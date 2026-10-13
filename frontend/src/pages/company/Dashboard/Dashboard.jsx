import { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";
import { getCurrentCompanyProfile } from "../../../services/companyService";
import { fetchNormalizedJobs } from "../../../services/jobService";
import {
  fetchNormalizedApplications,
  getOffers,
} from "../../../services/applicationService";
import { fetchInterviewsList } from "../../../services/interviewService";
import { extractResults } from "../../../services/api";

export default function Dashboard() {
  const { user } = useAuth();
  const [companyProfile, setCompanyProfile] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [compProf, allJobs, appList, intList, offerRes] = await Promise.all([
        getCurrentCompanyProfile(user?.id).catch(() => null),
        fetchNormalizedJobs(),
        fetchNormalizedApplications(),
        fetchInterviewsList().catch(() => []),
        getOffers().catch(() => ({ data: [] })),
      ]);
      setCompanyProfile(compProf);

      const ownJobs = allJobs.filter(
        (j) =>
          (compProf?.id && Number(j.companyId) === Number(compProf.id)) ||
          (user?.id && Number(j.companyUserId) === Number(user.id))
      );
      setJobs(ownJobs);
      setApplications(appList);
      setInterviews(intList);
      setOffers(extractResults(offerRes));
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load company dashboard.");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const companyName =
    companyProfile?.company_name ||
    user?.full_name ||
    user?.username ||
    "Company";

  const statusCounts = useMemo(() => {
    const counts = {
      Applied: 0,
      Reviewing: 0,
      Interview: 0,
      Offered: 0,
      Accepted: 0,
      Rejected: 0,
    };
    applications.forEach((a) => {
      if (a.rawStatus === "APPLIED") counts.Applied += 1;
      else if (a.rawStatus === "REVIEWING") counts.Reviewing += 1;
      else if (a.rawStatus === "INTERVIEW") counts.Interview += 1;
      else if (a.rawStatus === "OFFERED") counts.Offered += 1;
      else if (a.rawStatus === "REJECTED") counts.Rejected += 1;
    });
    counts.Accepted = offers.filter((o) => o.status === "ACCEPTED").length;
    return counts;
  }, [applications, offers]);

  const activeJobs = jobs.filter((j) => j.rawStatus === "PUBLISHED").length;
  const totalApplicants = applications.length;

  const stats = [
    { label: "Active jobs", val: loading ? "..." : activeJobs },
    { label: "Applicants", val: loading ? "..." : totalApplicants },
    { label: "In Review", val: loading ? "..." : statusCounts.Reviewing },
    { label: "Interviews", val: loading ? "..." : Math.max(statusCounts.Interview, interviews.length) },
    { label: "Offers", val: loading ? "..." : Math.max(statusCounts.Offered, offers.length) },
    { label: "Accepted", val: loading ? "..." : statusCounts.Accepted },
  ];

  const maxVal = Math.max(2, ...Object.values(statusCounts));
  const getScale = (val) => `${Math.round((val / maxVal) * 100)}%`;

  const stages = [
    { key: "Applied", color: "#175040" },
    { key: "Reviewing", color: "#3b82f6" },
    { key: "Interview", color: "#0d9488" },
    { key: "Offered", color: "#16a34a" },
    { key: "Accepted", color: "#15803d" },
    { key: "Rejected", color: "#ef4444" },
  ];

  const recentApplicants = useMemo(() => {
    return applications.slice(0, 6).map((app) => ({
      id: app.id,
      name: app.candidateName,
      title: app.jobTitle,
      status: app.companyStatus || app.status,
    }));
  }, [applications]);

  const badgeClass = (s) => {
    const v = String(s || "").toLowerCase();
    if (v === "applied") return "applied";
    if (v === "screening" || v === "reviewing" || v === "review") return "screening";
    if (v === "shortlisted") return "shortlisted";
    if (v === "interviewing" || v === "interview") return "interview";
    if (v === "offered" || v === "offer") return "offer";
    if (v === "hired" || v === "accepted") return "hired";
    return "rejected";
  };

  return (
    <div className="workspace-page">
      <div className="workspace-heading" style={{ marginBottom: "30px" }}>
        <div>
          <h1>Welcome, {companyName}</h1>
          <p>Here&apos;s your live recruitment pipeline at a glance.</p>
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: "12px 16px",
            backgroundColor: "#fef2f2",
            color: "#b91c1c",
            borderRadius: "8px",
            marginBottom: "20px",
          }}
        >
          {error}
        </div>
      )}

      <div className="dashboard-stats">
        {stats.map((s, i) => (
          <div className="stat-card" key={i}>
            <div className="stat-val">{s.val}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="dashboard-panel">
        <h2>Candidate pipeline</h2>
        <div className="chart-container">
          <div className="y-axis">
            {[...Array(6)].map((_, idx) => {
              const tick = Math.round(((5 - idx) / 5) * maxVal * 10) / 10;
              return <span key={idx}>{tick}</span>;
            })}
          </div>
          <div className="grid-lines">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="grid-line"></div>
            ))}
          </div>

          {stages.map((stage) => {
            const val = statusCounts[stage.key] || 0;
            return (
              <div className="chart-bar-wrap" key={stage.key}>
                <div
                  className="chart-bar"
                  style={{
                    height: getScale(val),
                    background: val > 0 ? stage.color : "#e5e7eb",
                    minHeight: val === 0 ? "0" : "4px",
                  }}
                  title={`${stage.key}: ${val}`}
                ></div>
                <div className="chart-label">
                  {stage.key} ({val})
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div
        className="dashboard-panel"
        style={{ background: "transparent", border: "none", padding: 0, boxShadow: "none" }}
      >
        <h2>Recent applicants</h2>
        <div className="applicant-list">
          {loading ? (
            <div style={{ padding: "20px", color: "#64748b" }}>
              Loading recent applicants...
            </div>
          ) : recentApplicants.length > 0 ? (
            recentApplicants.map((app) => (
              <div className="applicant-row" key={app.id}>
                <div className="applicant-info">
                  <Link
                    to={`/company/applicants/${app.id}`}
                    style={{ textDecoration: "none", color: "inherit" }}
                  >
                    <span className="applicant-name">{app.name}</span>
                  </Link>
                  <span style={{ margin: "0 6px", color: "#ccc" }}>&middot;</span>
                  <span className="applicant-title">{app.title}</span>
                </div>
                <div className={`status-badge ${badgeClass(app.status)}`}>
                  {app.status}
                </div>
              </div>
            ))
          ) : (
            <div style={{ padding: "20px", color: "#64748b", background: "#fff", borderRadius: "8px", border: "1px dashed #cbd5e1" }}>
              No applications received yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}