import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../../../hooks/useAuth";
import JobCard from "../../../components/candidate/JobCard";
import {
  getCurrentCandidateProfile,
  fetchSavedJobRecords,
  toggleSavedJobBackend,
} from "../../../services/candidateService";
import { fetchNormalizedJobs } from "../../../services/jobService";
import {
  fetchNormalizedApplications,
  createApplication,
  getOffers,
} from "../../../services/applicationService";
import { fetchInterviewsList } from "../../../services/interviewService";
import { extractResults } from "../../../services/api";
import "./Dashboard.css";

export default function CandidateDashboard() {
  const { user } = useAuth();
  const firstName = user?.first_name || (user?.full_name ? user.full_name.split(" ")[0] : user?.username || "Candidate");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [offers, setOffers] = useState([]);
  const [savedRecords, setSavedRecords] = useState([]);
  const [applyingJobId, setApplyingJobId] = useState(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [prof, jobList, appList, intList, offerRes, savedList] = await Promise.all([
        getCurrentCandidateProfile(user?.id).catch(() => null),
        fetchNormalizedJobs(),
        fetchNormalizedApplications(),
        fetchInterviewsList().catch(() => []),
        getOffers().catch(() => ({ data: [] })),
        fetchSavedJobRecords(),
      ]);
      setProfile(prof);
      setJobs(jobList.filter((j) => j.rawStatus === "PUBLISHED"));
      setApplications(appList);
      setInterviews(intList);
      setOffers(extractResults(offerRes));
      setSavedRecords(savedList);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const savedJobIds = useMemo(
    () => new Set(savedRecords.map((r) => Number(r.job?.id || r.job_id || r.job))),
    [savedRecords]
  );

  const appliedJobIds = useMemo(
    () => new Set(applications.map((a) => Number(a.jobId))),
    [applications]
  );

  const profileCompletion = useMemo(() => {
    if (!profile) return 25;
    const u = profile.user || user || {};
    const checks = [
      Boolean(u.first_name || u.username),
      Boolean(u.email),
      Boolean(u.phone),
      Boolean(profile.university),
      Boolean(profile.major),
      Boolean(profile.graduation_year),
      Boolean(profile.bio),
      Boolean((profile.skills && profile.skills.length > 0) || profile.resume_file),
    ];
    const filled = checks.filter(Boolean).length;
    return Math.round((filled / checks.length) * 100);
  }, [profile, user]);

  const recommendedJobs = useMemo(() => {
    const candSkills = new Set(
      (profile?.skills || []).map((s) =>
        (typeof s === "object" ? s.skill?.name || s.name : String(s)).toLowerCase()
      )
    );
    const sorted = [...jobs].sort((a, b) => {
      const aMatches = (a.tags || []).filter((t) => candSkills.has(t.toLowerCase())).length;
      const bMatches = (b.tags || []).filter((t) => candSkills.has(t.toLowerCase())).length;
      return bMatches - aMatches;
    });
    return sorted.slice(0, 4);
  }, [jobs, profile]);

  const handleSaveJob = async (job) => {
    try {
      const next = await toggleSavedJobBackend(job.id, savedRecords);
      setSavedRecords(next);
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to update saved job.");
    }
  };

  const handleApplyJob = async (job) => {
    if (appliedJobIds.has(Number(job.id))) return;
    setApplyingJobId(job.id);
    try {
      await createApplication({ job_id: job.id });
      const updatedApps = await fetchNormalizedApplications();
      setApplications(updatedApps);
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to submit application.");
    } finally {
      setApplyingJobId(null);
    }
  };

  const interviewCount = applications.filter((a) => a.rawStatus === "INTERVIEW").length;
  const offerCount = Math.max(
    offers.length,
    applications.filter((a) => a.rawStatus === "OFFERED").length
  );

  const upcomingInterviews = useMemo(() => {
    const appMap = new Map(applications.map((a) => [Number(a.id), a]));
    return interviews
      .filter((iv) => iv.status === "SCHEDULED")
      .map((iv) => {
        const app = appMap.get(Number(iv.application));
        return {
          ...iv,
          jobTitle: app?.jobTitle || `Application #${iv.application}`,
          company: app?.company || "Company",
          formattedDate: iv.scheduled_at
            ? new Date(iv.scheduled_at).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })
            : "TBD",
        };
      });
  }, [interviews, applications]);

  return (
    <div className="dashboard">
      <h2 className="dashboard__welcome">Welcome, {firstName}</h2>

      {error && (
        <div style={{ padding: "12px 16px", background: "#fef2f2", color: "#b91c1c", borderRadius: "8px", marginBottom: "16px" }}>
          {error}
        </div>
      )}

      {/* Stats Row */}
      <div className="dashboard__stats">
        <div className="dashboard__stat-card">
          <span className="dashboard__stat-number">{loading ? "..." : applications.length}</span>
          <span className="dashboard__stat-label">Applications</span>
        </div>
        <div className="dashboard__stat-card">
          <span className="dashboard__stat-number">{loading ? "..." : interviewCount}</span>
          <span className="dashboard__stat-label">In interview stage</span>
        </div>
        <div className="dashboard__stat-card">
          <span className="dashboard__stat-number">{loading ? "..." : offerCount}</span>
          <span className="dashboard__stat-label">Offers</span>
        </div>
        <div className="dashboard__stat-card">
          <span className="dashboard__stat-number">{loading ? "..." : savedRecords.length}</span>
          <span className="dashboard__stat-label">Saved jobs</span>
        </div>
      </div>

      {/* Profile Completion Bar */}
      <div className="dashboard__progress-card">
        <div className="dashboard__progress-label">
          Profile completion: {profileCompletion}%
        </div>
        <div className="dashboard__progress-track">
          <div
            className="dashboard__progress-fill"
            style={{ width: `${profileCompletion}%` }}
          ></div>
        </div>
      </div>

      {/* Recommended Jobs */}
      <div className="dashboard__section">
        <h3 className="dashboard__section-title">Recommended jobs</h3>
        <div className="dashboard__job-list">
          {loading ? (
            <div className="dashboard__empty-state">Loading recommended jobs...</div>
          ) : recommendedJobs.length > 0 ? (
            recommendedJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onSave={handleSaveJob}
                onApply={handleApplyJob}
                isSaved={savedJobIds.has(Number(job.id))}
                isApplied={appliedJobIds.has(Number(job.id))}
                applying={applyingJobId === job.id}
              />
            ))
          ) : (
            <div className="dashboard__empty-state">No published jobs available right now.</div>
          )}
        </div>
      </div>

      {/* Upcoming Interviews */}
      <div className="dashboard__section">
        <h3 className="dashboard__section-title">Upcoming interviews</h3>
        {loading ? (
          <div className="dashboard__empty-state">Loading interviews...</div>
        ) : upcomingInterviews.length > 0 ? (
          <div style={{ display: "grid", gap: "12px" }}>
            {upcomingInterviews.map((iv) => (
              <div
                key={iv.id}
                style={{
                  background: "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  padding: "16px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "12px",
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, color: "#0f172a", fontSize: "15px" }}>
                    {iv.jobTitle} — {iv.company}
                  </div>
                  <div style={{ fontSize: "13px", color: "#475569", marginTop: "4px" }}>
                    Scheduled: <strong>{iv.formattedDate}</strong>
                    {iv.location ? ` · Location: ${iv.location}` : ""}
                  </div>
                </div>
                {iv.meeting_link && (
                  <a
                    href={iv.meeting_link}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#0d9488",
                      textDecoration: "underline",
                    }}
                  >
                    Join Meeting
                  </a>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="dashboard__empty-state">No upcoming interviews.</div>
        )}
      </div>
    </div>
  );
}