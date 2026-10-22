import { useState, useEffect, useCallback, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import {
  Search,
  Bell,
  Star,
  Calendar,
  Clock,
  ArrowUpRight,
  Bookmark,
  CheckCircle2,
  Video,
  Sparkles,
  Crown,
  History,
  ShieldCheck,
  Zap,
  Compass,
} from "lucide-react";
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
import { getUsageSummary } from "../../../services/resumeImprovementService";
import UpgradeModal from "../../../components/candidate/UpgradeModal";
import { extractResults } from "../../../services/api";
import RecruitmentWorkspaceBanner from "../../../components/illustrations/RecruitmentWorkspaceBanner";
import CandidateCareerSpotlight from "../../../components/illustrations/CandidateCareerSpotlight";
import PlatformAnalyticsIllustration from "../../../components/illustrations/PlatformAnalyticsIllustration";
import EmptyStateIllustration from "../../../components/illustrations/EmptyStateIllustration";
import { useLanguage } from "../../../context/LanguageContext";
import "./Dashboard.css";

function CustomBarTooltip({ active, payload }) {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0];
  return (
    <div className="candidate-dash-tooltip">
      <span
        className="candidate-dash-tooltip-dot"
        style={{ backgroundColor: item.payload?.color || "#F97316" }}
      />
      <span className="candidate-dash-tooltip-label">{item.payload?.name}:</span>
      <strong className="candidate-dash-tooltip-val">{item.value}</strong>
    </div>
  );
}

export default function CandidateDashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const firstName =
    user?.first_name ||
    (user?.full_name ? user.full_name.split(" ")[0] : user?.username || "Candidate");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchFilter, setSearchFilter] = useState("");
  const [profile, setProfile] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [offers, setOffers] = useState([]);
  const [savedRecords, setSavedRecords] = useState([]);
  const [applyingJobId, setApplyingJobId] = useState(null);
  const [usageSummary, setUsageSummary] = useState(null);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  const [avatar, setAvatar] = useState(() => {
    return (
      (user?.id ? localStorage.getItem(`careerlens_avatar_${user.id}`) : null) ||
      localStorage.getItem("careerlens_avatar") ||
      user?.avatar ||
      ""
    );
  });

  useEffect(() => {
    const handleUpdate = (e) => {
      if (e?.detail?.avatar !== undefined) {
        setAvatar(e.detail.avatar);
      } else {
        setAvatar(
          (user?.id ? localStorage.getItem(`careerlens_avatar_${user.id}`) : null) ||
          localStorage.getItem("careerlens_avatar") ||
          user?.avatar ||
          ""
        );
      }
    };
    window.addEventListener("careerlens_profile_image_updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("careerlens_profile_image_updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [user]);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [prof, jobList, appList, intList, offerRes, savedList, usageRes] = await Promise.all([
        getCurrentCandidateProfile(user?.id).catch(() => null),
        fetchNormalizedJobs(),
        fetchNormalizedApplications(),
        fetchInterviewsList().catch(() => []),
        getOffers().catch(() => ({ data: [] })),
        fetchSavedJobRecords(),
        getUsageSummary().catch(() => ({ data: null })),
      ]);
      setProfile(prof);
      setJobs(jobList.filter((j) => j.rawStatus === "PUBLISHED"));
      setApplications(appList);
      setInterviews(intList);
      setOffers(extractResults(offerRes));
      setSavedRecords(savedList);
      if (usageRes?.data) setUsageSummary(usageRes.data);
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
    if (!profile) return 30;
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

    const filtered = searchFilter.trim()
      ? sorted.filter((j) => {
          const q = searchFilter.toLowerCase();
          const titleMatch = j.title && j.title.toLowerCase().includes(q);
          const companyMatch = j.company && j.company.toLowerCase().includes(q);
          const locationMatch = j.location && j.location.toLowerCase().includes(q);
          const tagsMatch = Array.isArray(j.tags) && j.tags.some((t) => t.toLowerCase().includes(q));
          const skillsMatch = Array.isArray(j.skills) && j.skills.some((s) => s.toLowerCase().includes(q));
          return titleMatch || companyMatch || locationMatch || tagsMatch || skillsMatch;
        })
      : sorted;

    return filtered.slice(0, 4);
  }, [jobs, profile, searchFilter]);

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
  const reviewingCount = applications.filter(
    (a) => a.rawStatus === "REVIEWING" || a.rawStatus === "SCREENING"
  ).length;

  const appOverviewsData = [
    { name: "Applied", value: applications.length, color: "#F97316" },
    { name: "Review", value: reviewingCount, color: "#FB923C" },
    { name: "Interview", value: Math.max(interviewCount, interviews.length), color: "#EA580C" },
    { name: "Offers", value: offerCount, color: "#16A34A" },
    { name: "Saved", value: savedRecords.length, color: "#0284C7" },
  ];

  const maxVal = Math.max(4, ...appOverviewsData.map((d) => d.value));

  const upcomingInterviews = useMemo(() => {
    const appMap = new Map(applications.map((a) => [Number(a.id), a]));
    return interviews
      .filter((iv) => iv.status === "SCHEDULED")
      .map((iv) => {
        const app = appMap.get(Number(iv.application));
        return {
          ...iv,
          jobTitle: app?.jobTitle || `Application #${iv.application}`,
          company: app?.company || "Company Partner",
          formattedDate: iv.scheduled_at
            ? new Date(iv.scheduled_at).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })
            : "Scheduled Soon",
        };
      });
  }, [interviews, applications]);

  // "On Process" Active candidate applications
  const inProcessApps = useMemo(() => {
    return applications
      .filter((a) => ["APPLIED", "REVIEWING", "SCREENING", "INTERVIEW"].includes(a.rawStatus))
      .slice(0, 4);
  }, [applications]);

  const todayFormatted = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="cand-dash-container">
      {/* ── Top Header Bar (Matching Reference) ─────────────────────────────── */}
      <header className="cand-dash-header">
        <Link
          to="/candidate/profile"
          className="cand-header-user-link"
          title={t("candidate.viewEditProfile", "View and Edit Profile")}
        >
          <div className="cand-avatar-circle" aria-hidden="true" style={{ overflow: "hidden" }}>
            {avatar ? (
              <img
                src={avatar}
                alt={firstName}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              firstName.charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <h1 className="cand-greeting-title">
                {t("admin.hi", "Hi")}, {firstName}
              </h1>
              <span className="cand-greeting-edit-pill">
                {t("candidate.editProfile", "Edit Profile")} &rarr;
              </span>
            </div>
            <p className="cand-greeting-sub">
              {t("candidate.exploreCareer", "Explore your tailored career opportunities")}
            </p>
          </div>
        </Link>

        <div className="cand-header-controls">
          <div className="cand-search-bar">
            <Search size={18} className="cand-search-icon" />
            <input
              type="search"
              placeholder={t("candidate.searchPlaceholder", "Search jobs, skills, companies...")}
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && searchFilter.trim()) {
                  navigate(`/candidate/jobs?q=${encodeURIComponent(searchFilter.trim())}`);
                }
              }}
              className="cand-search-input"
            />
          </div>

          <Link to="/candidate/notifications" className="cand-notif-btn" title={t("common.nav.notifications", "Notifications")}>
            <Bell size={20} />
            {applications.length > 0 && <span className="cand-notif-badge">{applications.length}</span>}
          </Link>
        </div>
      </header>

      {error && (
        <div className="cand-error-banner" role="alert">
          {error}
        </div>
      )}

      {/* ── 2-Column Responsive Workspace Grid ──────────────────────────────── */}
      <div className="cand-main-grid">
        {/* ── LEFT COLUMN ─────────────────────────────────────────────────── */}
        <div className="cand-left-column">
          {/* Top 3 Cards Row */}
          <div className="cand-top-cards-row">
            {/* 1. Feature Spotlight Card (Inspired by Reference) */}
            <div className="cand-spotlight-card">
              <span className="cand-spotlight-pill">{t("candidate.profileReadiness", "Profile Readiness")}</span>
              <div className="cand-spotlight-illu">
                <CandidateCareerSpotlight />
              </div>
              <div className="cand-spotlight-meta">
                <div className="cand-stars-row">
                  <Star size={14} fill="#F59E0B" color="#F59E0B" />
                  <Star size={14} fill="#F59E0B" color="#F59E0B" />
                  <Star size={14} fill="#F59E0B" color="#F59E0B" />
                  <Star size={14} fill="#F59E0B" color="#F59E0B" />
                  <Star size={14} fill="#F59E0B" color="#F59E0B" />
                </div>
                <h2 className="cand-spotlight-title">{profile?.major || t("candidate.title", "Career Candidate")}</h2>
                <p className="cand-spotlight-desc">{profileCompletion}% {t("candidate.profileCompletion", "completed profile strength")}</p>
                <Link to="/candidate/profile" className="cand-spotlight-btn">
                  {t("candidate.editProfile", "Edit Profile")} &rarr;
                </Link>
              </div>
            </div>

            {/* 2. Center Overviews Bar Chart Card */}
            <div className="cand-overview-card">
              <div className="cand-overview-header">
                <div>
                  <h2 className="cand-overview-title">{t("candidate.appOverviews", "Application Overviews")}</h2>
                  <p className="cand-overview-sub">{t("candidate.hiringPipeline", "Your hiring journey pipeline")}</p>
                </div>
                <span className="cand-overview-badge">{applications.length} {t("candidate.submitted", "Submitted")}</span>
              </div>

              <div className="cand-overview-chart">
                <ResponsiveContainer width="100%" height={170}>
                  <BarChart
                    data={appOverviewsData}
                    margin={{ top: 10, right: 12, left: -24, bottom: 0 }}
                    barCategoryGap="20%"
                  >
                    <CartesianGrid stroke="#F1F5F9" vertical={false} strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#94A3B8", fontSize: 11, fontWeight: 500 }}
                      dy={6}
                    />
                    <YAxis
                      domain={[0, maxVal]}
                      allowDecimals={false}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#94A3B8", fontSize: 11 }}
                    />
                    <Tooltip cursor={{ fill: "rgba(249, 115, 22, 0.08)" }} content={<CustomBarTooltip />} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={30}>
                      {appOverviewsData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 3. Right Score Highlight Card */}
            <div className="cand-performer-card">
              <div className="cand-performer-badge">
                <PlatformAnalyticsIllustration />
              </div>
              <h2 className="cand-performer-name">{firstName}</h2>
              <span className="cand-performer-role">{profile?.university || "Active Jobseeker"}</span>

              <div className="cand-dual-stats">
                <div className="cand-dual-stat-item">
                  <strong>{applications.length}</strong>
                  <span>{t("common.active", "Active")}</span>
                </div>
                <div className="cand-dual-stat-item">
                  <strong>{savedRecords.length}</strong>
                  <span>{t("candidate.savedJobs", "Saved")}</span>
                </div>
              </div>

              <Link to="/candidate/jobs" className="cand-performer-btn">
                {t("common.nav.findJobs", "Browse Jobs")}
              </Link>
            </div>
          </div>

          {/* Lower Grid: Recommended Jobs & Interview Calendar */}
          <div className="cand-lower-section">
            <div className="cand-jobs-panel">
              <div className="cand-panel-header">
                <div>
                  <h2 className="cand-panel-title">{t("candidate.recommendedJobs", "Recommended Jobs")}</h2>
                  <p className="cand-panel-sub">{t("candidate.matchedSkills", "Opportunities matched to your skills")}</p>
                </div>
                <Link to="/candidate/jobs" className="cand-see-all">
                  {t("candidate.viewAll", "View All")} &rarr;
                </Link>
              </div>

              <div className="cand-job-cards-list">
                {loading ? (
                  <p className="cand-empty-msg">{t("common.loading", "Loading recommended opportunities...")}</p>
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
                  <div className="cand-empty-box">
                    <EmptyStateIllustration />
                    <p>{t("candidate.noJobsFound", "No jobs found matching your search. Check back soon!")}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN ────────────────────────────────────────────────── */}
        <div className="cand-right-column">
          {/* Scenic Workspace Banner */}
          <div className="cand-banner-card">
            <RecruitmentWorkspaceBanner />
          </div>

          {/* AI Resume & Plan Quota Card */}
          {usageSummary && (
            <div className={`cand-ai-usage-card ${usageSummary.plan_tier === "PREMIUM" ? "cand-ai-card-premium" : ""}`}>
              <div className="cand-ai-usage-header">
                <div className="cand-ai-tier-wrap">
                  {usageSummary.plan_tier === "PREMIUM" ? (
                    <span className="cand-tier-badge-premium">
                      <Crown size={14} className="text-amber-400" />
                      <strong>PREMIUM TIER</strong>
                    </span>
                  ) : (
                    <span className="cand-tier-badge-free">
                      <ShieldCheck size={14} />
                      <strong>FREE PROTOTYPE</strong>
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  className="cand-btn-upgrade-pill"
                  onClick={() => setIsUpgradeModalOpen(true)}
                >
                  <Zap size={13} />
                  <span>{usageSummary.plan_tier === "PREMIUM" ? "Manage Plan" : "Upgrade ($3.99)"}</span>
                </button>
              </div>

              <div className="cand-ai-meter-body">
                <div className="cand-ai-meter-row">
                  <span className="cand-ai-meter-label">AI CV Improvements</span>
                  <strong className="cand-ai-meter-nums">
                    {usageSummary.improvements_used} / {usageSummary.improvements_limit}
                  </strong>
                </div>
                <div className="cand-ai-meter-track">
                  <div
                    className="cand-ai-meter-bar"
                    style={{
                      width: `${Math.min(100, (usageSummary.improvements_used / (usageSummary.improvements_limit || 1)) * 100)}%`,
                    }}
                  />
                </div>
                <span className="cand-ai-meter-sub">
                  {usageSummary.improvements_remaining} credits remaining for active CV
                </span>
              </div>

              <div className="cand-ai-quick-links">
                <Link to="/candidate/career-roadmap" className="cand-ai-link-item">
                  <Compass size={14} />
                  <span>My Career Roadmap</span>
                  <ArrowUpRight size={13} className="cand-link-arrow" />
                </Link>
                <Link to="/candidate/cv-versions" className="cand-ai-link-item">
                  <History size={14} />
                  <span>My CV Versions ({usageSummary.total_versions || 0})</span>
                  <ArrowUpRight size={13} className="cand-link-arrow" />
                </Link>
                <Link to="/candidate/cv-studio" className="cand-ai-link-item">
                  <Sparkles size={14} />
                  <span>AI CV Studio</span>
                  <ArrowUpRight size={13} className="cand-link-arrow" />
                </Link>
              </div>
            </div>
          )}

          {/* "On Process" Active Applications Card */}
          <div className="cand-process-card">
            <div className="cand-process-header">
              <div>
                <h2 className="cand-process-title">{t("admin.onProcess", "On Process")}</h2>
                <span className="cand-process-date">{todayFormatted}</span>
              </div>
              <span className="cand-process-pill">{inProcessApps.length} {t("candidate.inProgress", "In Progress")}</span>
            </div>

            <div className="cand-process-list">
              {inProcessApps.length === 0 ? (
                <div className="cand-empty-process">
                  <CheckCircle2 size={24} color="#10B981" />
                  <p>{t("candidate.noPendingApps", "You have no pending applications right now.")}</p>
                  <Link to="/candidate/jobs" className="cand-explore-link">
                    {t("candidate.explorePositions", "Explore available positions")} &rarr;
                  </Link>
                </div>
              ) : (
                inProcessApps.map((app) => (
                  <Link
                    key={app.id}
                    to="/candidate/applications"
                    className="cand-process-item"
                    style={{
                      borderLeftColor:
                        app.rawStatus === "INTERVIEW"
                          ? "#8B5CF6"
                          : app.rawStatus === "REVIEWING"
                          ? "#3B82F6"
                          : "#F97316",
                    }}
                  >
                    <div className="cand-process-main">
                      <strong className="cand-process-job">{app.jobTitle}</strong>
                      <span className="cand-process-co">{app.company}</span>
                    </div>

                    <div className="cand-process-meta">
                      <span className="cand-status-pill">{app.status}</span>
                      <ArrowUpRight size={14} className="cand-arrow-icon" />
                    </div>
                  </Link>
                ))
              )}
            </div>

            {/* Upcoming Interviews Widget inside Process card */}
            {upcomingInterviews.length > 0 && (
              <div className="cand-interviews-box">
                <div className="cand-interviews-title">
                  <Calendar size={15} color="#016BFB" />
                  <span>{t("candidate.scheduledInterview", "Scheduled Interview")}</span>
                </div>
                {upcomingInterviews.slice(0, 2).map((iv) => (
                  <div key={iv.id} className="cand-interview-row">
                    <div>
                      <strong>{iv.jobTitle}</strong>
                      <small>{iv.company}</small>
                    </div>
                    <span className="cand-time-chip">{iv.formattedDate}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="cand-process-foot">
              <Link to="/candidate/applications" className="cand-view-all-apps">
                {t("candidate.viewAllApps", "View All My Applications")} &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        onUpgraded={(newUsage) => {
          if (newUsage) setUsageSummary(newUsage);
          else loadDashboard();
        }}
        usageSummary={usageSummary}
      />
    </div>
  );
}