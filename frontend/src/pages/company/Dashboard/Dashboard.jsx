import { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
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
  CheckCircle2,
  ArrowUpRight,
} from "lucide-react";
import { useAuth } from "../../../hooks/useAuth";
import { getCurrentCompanyProfile } from "../../../services/companyService";
import { fetchNormalizedJobs } from "../../../services/jobService";
import {
  fetchNormalizedApplications,
  getOffers,
} from "../../../services/applicationService";
import { fetchInterviewsList } from "../../../services/interviewService";
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
    <div className="comp-dash-tooltip">
      <span
        className="comp-dash-tooltip-dot"
        style={{ backgroundColor: item.payload?.color || "#F97316" }}
      />
      <span className="comp-dash-tooltip-label">{item.payload?.name}:</span>
      <strong className="comp-dash-tooltip-val">{item.value}</strong>
    </div>
  );
}

export default function CompanyDashboard() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [companyProfile, setCompanyProfile] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchFilter, setSearchFilter] = useState("");

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
    "TechNova Cambodia";

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
      else if (a.rawStatus === "REVIEWING" || a.rawStatus === "SCREENING") counts.Reviewing += 1;
      else if (a.rawStatus === "INTERVIEW") counts.Interview += 1;
      else if (a.rawStatus === "OFFERED") counts.Offered += 1;
      else if (a.rawStatus === "REJECTED") counts.Rejected += 1;
    });
    counts.Accepted = offers.filter((o) => o.status === "ACCEPTED").length;
    return counts;
  }, [applications, offers]);

  const activeJobs = jobs.filter((j) => j.rawStatus === "PUBLISHED").length;
  const totalApplicants = applications.length;

  const barData = [
    { name: t("admin.applied", "Applied"), value: statusCounts.Applied, color: "#F97316" },
    { name: t("admin.review", "Review"), value: statusCounts.Reviewing, color: "#FB923C" },
    { name: t("admin.interview", "Interview"), value: Math.max(statusCounts.Interview, interviews.length), color: "#EA580C" },
    { name: t("admin.offered", "Offered"), value: statusCounts.Offered, color: "#16A34A" },
    { name: t("admin.accepted", "Accepted"), value: statusCounts.Accepted, color: "#0284C7" },
  ];

  const maxVal = Math.max(4, ...barData.map((d) => d.value));

  // "On Process" Active Applicants
  const inProcessApplicants = useMemo(() => {
    return applications
      .filter((a) => ["APPLIED", "REVIEWING", "SCREENING", "INTERVIEW"].includes(a.rawStatus))
      .slice(0, 5);
  }, [applications]);

  const todayFormatted = new Date().toLocaleDateString(language === "km" ? "km-KH" : "en-US", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="comp-dash-container">
      {/* ── Top Header Bar ──────────────────────────────────────────────────── */}
      <header className="comp-dash-header">
        <div className="comp-header-user">
          <div className="comp-avatar-circle" aria-hidden="true">
            {companyName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="comp-greeting-title">{t("admin.hi", "Hi")}, {companyName}</h1>
            <p className="comp-greeting-sub">{t("company.recruitmentWorkspace", "Live recruitment pipeline & talent management")}</p>
          </div>
        </div>

        <div className="comp-header-controls">
          <div className="comp-search-bar">
            <Search size={18} className="comp-search-icon" />
            <input
              type="search"
              placeholder={t("candidate.searchJobsCompanies", "Search applicants, jobs...")}
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="comp-search-input"
            />
          </div>

          <Link to="/company/notifications" className="comp-notif-btn" title="Notifications">
            <Bell size={20} />
            {applications.length > 0 && <span className="comp-notif-badge">{applications.length}</span>}
          </Link>
        </div>
      </header>

      {error && (
        <div className="comp-error-banner" role="alert">
          {error}
        </div>
      )}

      {/* ── 2-Column Responsive Workspace Grid ──────────────────────────────── */}
      <div className="comp-main-grid">
        {/* ── LEFT COLUMN ─────────────────────────────────────────────────── */}
        <div className="comp-left-column">
          {/* Top 3 Cards Row */}
          <div className="comp-top-cards-row">
            {/* 1. Feature Spotlight Card */}
            <div className="comp-spotlight-card">
              <span className="comp-spotlight-pill">{t("company.hiringSpotlight", "Hiring Spotlight")}</span>
              <div className="comp-spotlight-illu">
                <CandidateCareerSpotlight />
              </div>
              <div className="comp-spotlight-meta">
                <div className="comp-stars-row">
                  <Star size={14} fill="#F59E0B" color="#F59E0B" />
                  <Star size={14} fill="#F59E0B" color="#F59E0B" />
                  <Star size={14} fill="#F59E0B" color="#F59E0B" />
                  <Star size={14} fill="#F59E0B" color="#F59E0B" />
                  <Star size={14} fill="#F59E0B" color="#F59E0B" />
                </div>
                <h2 className="comp-spotlight-title">{jobs[0]?.title || "Lead Developer"}</h2>
                <p className="comp-spotlight-desc">{activeJobs} {t("company.activeJobListings", "active job listings published")}</p>
                <Link to="/company/jobs" className="comp-spotlight-btn">
                  {t("company.manageJobs", "Manage Jobs")} &rarr;
                </Link>
              </div>
            </div>

            {/* 2. Center Overviews Bar Chart Card */}
            <div className="comp-overview-card">
              <div className="comp-overview-header">
                <div>
                  <h2 className="comp-overview-title">{t("company.recruitmentOverviews", "Recruitment Overviews")}</h2>
                  <p className="comp-overview-sub">{t("company.applicantConversion", "Applicant conversion through stages")}</p>
                </div>
                <span className="comp-overview-badge">{totalApplicants} {t("company.totalLabel", "Total")}</span>
              </div>

              <div className="comp-overview-chart">
                <ResponsiveContainer width="100%" height={170}>
                  <BarChart
                    data={barData}
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
                      {barData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 3. Right Highlight Card */}
            <div className="comp-performer-card">
              <div className="comp-performer-badge">
                <PlatformAnalyticsIllustration />
              </div>
              <h2 className="comp-performer-name">{companyName}</h2>
              <span className="comp-performer-role">{t("company.verifiedEnterprise", "Verified Enterprise")}</span>

              <div className="comp-dual-stats">
                <div className="comp-dual-stat-item">
                  <strong>{activeJobs}</strong>
                  <span>{t("company.openPositions", "Open Jobs")}</span>
                </div>
                <div className="comp-dual-stat-item">
                  <strong>{totalApplicants}</strong>
                  <span>{t("company.totalApplicants", "Applicants")}</span>
                </div>
              </div>

              <Link to="/company/jobs" className="comp-performer-btn">
                + {t("company.postJob", "Post Job")}
              </Link>
            </div>
          </div>

          {/* Lower Grid: Quick Stats & Active Jobs */}
          <div className="comp-lower-section">
            <div className="comp-jobs-panel">
              <div className="comp-panel-header">
                <div>
                  <h2 className="comp-panel-title">{t("company.activeJobPostings", "Active Job Postings")}</h2>
                  <p className="comp-panel-sub">{t("company.manageVacancies", "Manage vacancies and applications")}</p>
                </div>
                <Link to="/company/jobs" className="comp-see-all">
                  {t("candidate.viewAll", "View All")} &rarr;
                </Link>
              </div>

              <div className="comp-job-cards-list">
                {jobs.length === 0 ? (
                  <div className="comp-empty-box">
                    <EmptyStateIllustration />
                    <p>{t("company.noJobsPrompt", "No job postings yet. Create your first opening today!")}</p>
                    <Link to="/company/jobs" className="comp-create-job-btn">
                      + {t("company.postJob", "Post a Job")}
                    </Link>
                  </div>
                ) : (
                  jobs.slice(0, 4).map((j) => (
                    <div key={j.id} className="comp-job-row-card">
                      <div className="comp-job-row-info">
                        <strong>{j.title}</strong>
                        <span className="comp-job-row-meta">
                          {j.type} · {j.location} · {j.workMode || "On-site"}
                        </span>
                      </div>
                      <div className="comp-job-row-actions">
                        <span className="comp-job-status-pill">{j.status}</span>
                        <Link to={`/company/jobs`} className="comp-manage-link">
                          {t("company.manageJobs", "Manage")} &rarr;
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN ────────────────────────────────────────────────── */}
        <div className="comp-right-column">
          {/* Scenic Workspace Banner */}
          <div className="comp-banner-card">
            <RecruitmentWorkspaceBanner />
          </div>

          {/* "On Process" Applicants Card */}
          <div className="comp-process-card">
            <div className="comp-process-header">
              <div>
                <h2 className="comp-process-title">{t("admin.onProcess", "On Process")}</h2>
                <span className="comp-process-date">{todayFormatted}</span>
              </div>
              <span className="comp-process-pill">{inProcessApplicants.length} {t("company.inReview", "In Review")}</span>
            </div>

            <div className="comp-process-list">
              {inProcessApplicants.length === 0 ? (
                <div className="comp-empty-process">
                  <CheckCircle2 size={24} color="#10B981" />
                  <p>{t("company.allReviewed", "All applicants have been reviewed!")}</p>
                </div>
              ) : (
                inProcessApplicants.map((app) => (
                  <Link
                    key={app.id}
                    to="/company/applicants"
                    className="comp-process-item"
                    style={{
                      borderLeftColor:
                        app.rawStatus === "INTERVIEW"
                          ? "#8B5CF6"
                          : app.rawStatus === "REVIEWING"
                          ? "#3B82F6"
                          : "#F97316",
                    }}
                  >
                    <div className="comp-process-main">
                      <strong className="comp-process-cand">{app.candidateName}</strong>
                      <span className="comp-process-role">{app.jobTitle}</span>
                    </div>

                    <div className="comp-process-meta">
                      <span className="comp-status-pill">{app.status}</span>
                      <ArrowUpRight size={14} className="comp-arrow-icon" />
                    </div>
                  </Link>
                ))
              )}
            </div>

            <div className="comp-process-foot">
              <Link to="/company/applicants" className="comp-view-all-apps">
                {t("company.viewAllApplicants", "View All Applicants")} &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}