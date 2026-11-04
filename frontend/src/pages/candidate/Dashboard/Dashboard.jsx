import { useState, useEffect, useCallback, useMemo, useRef } from "react";
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
  ArrowRight,
  Bookmark,
  CheckCircle2,
  Video,
  Sparkles,
  Crown,
  History,
  ShieldCheck,
  Zap,
  Compass,
  Briefcase,
  Building2,
  Tag,
  TrendingUp,
  Key,
  Eye,
  EyeOff,
  Trash2,
  ExternalLink,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useAuth } from "../../../hooks/useAuth";
import JobCard from "../../../components/candidate/JobCard";
import {
  getGeminiKeyStatus,
  saveGeminiKey,
  deleteGeminiKey,
} from "../../../services/authService";
import {
  getCurrentCandidateProfile,
  fetchSavedJobRecords,
  toggleSavedJobBackend,
  getNotifications,
} from "../../../services/candidateService";
import { fetchNormalizedJobs } from "../../../services/jobService";
import {
  fetchNormalizedApplications,
  createApplication,
  getOffers,
} from "../../../services/applicationService";
import { fetchInterviewsList } from "../../../services/interviewService";
import { getUsageSummary } from "../../../services/resumeImprovementService";
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
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [applyingJobId, setApplyingJobId] = useState(null);
  const [usageSummary, setUsageSummary] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchBarRef = useRef(null);

  // Gemini BYOK AI Engine state
  const [geminiStatus, setGeminiStatus] = useState({
    has_key: false,
    key_preview: "",
    model: "gemini-3.5-flash-lite",
    status: "not_configured",
  });
  const [geminiKeyInput, setGeminiKeyInput] = useState("");
  const [showKeyForm, setShowKeyForm] = useState(false);
  const [showRawKey, setShowRawKey] = useState(false);
  const [geminiLoading, setGeminiLoading] = useState(false);
  const [geminiNotice, setGeminiNotice] = useState({ type: "", text: "" });

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
      const [prof, jobList, appList, intList, offerRes, savedList, usageRes, notifRes, geminiRes] = await Promise.all([
        getCurrentCandidateProfile(user?.id).catch(() => null),
        fetchNormalizedJobs().catch(() => []),
        fetchNormalizedApplications().catch(() => []),
        fetchInterviewsList().catch(() => []),
        getOffers().catch(() => ({ data: [] })),
        fetchSavedJobRecords().catch(() => []),
        getUsageSummary().catch(() => ({ data: null })),
        getNotifications().catch(() => ({ data: [] })),
        getGeminiKeyStatus().catch(() => ({ data: null })),
      ]);
      setProfile(prof);
      setJobs((jobList || []).filter((j) => j.rawStatus === "PUBLISHED"));
      setApplications(appList || []);
      setInterviews(intList || []);
      setOffers(extractResults(offerRes));
      setSavedRecords(savedList || []);
      const notifs = extractResults(notifRes);
      setUnreadNotifCount(notifs.filter((n) => !n.is_read).length);
      if (usageRes?.data) setUsageSummary(usageRes.data);
      if (geminiRes?.data) {
        setGeminiStatus(geminiRes.data);
        if (!geminiRes.data.has_key) setShowKeyForm(true);
      }
    } catch (err) {
      console.error("Dashboard loading error:", err);
      const detail =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.message ||
        "Failed to load dashboard data.";
      setError(detail);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleSaveGeminiKey = async (e) => {
    if (e) e.preventDefault();
    if (!geminiKeyInput.trim()) {
      setGeminiNotice({ type: "error", text: "Please paste your Google Gemini API key." });
      return;
    }
    setGeminiLoading(true);
    setGeminiNotice({ type: "", text: "" });
    try {
      const res = await saveGeminiKey(geminiKeyInput.trim());
      setGeminiStatus({
        has_key: true,
        key_preview: res.data.key_preview,
        model: res.data.model || "gemini-3.5-flash-lite",
        status: "connected",
      });
      setGeminiKeyInput("");
      setShowKeyForm(false);
      setGeminiNotice({
        type: "success",
        text: res.data.message || "Google Gemini API key verified and connected successfully!",
      });
      setTimeout(() => setGeminiNotice({ type: "", text: "" }), 5000);
    } catch (err) {
      console.error("Gemini API key validation error:", err);
      const detail =
        err.response?.data?.detail ||
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        "Failed to validate Gemini API key.";
      setGeminiNotice({
        type: "error",
        text: detail,
      });
    } finally {
      setGeminiLoading(false);
    }
  };

  const handleDeleteGeminiKey = async () => {
    if (!window.confirm("Disconnect your Gemini API key? CareerLens AI features will fall back to the built-in heuristic engine.")) {
      return;
    }
    setGeminiLoading(true);
    try {
      await deleteGeminiKey();
      setGeminiStatus({
        has_key: false,
        key_preview: "",
        model: "gemini-3.5-flash-lite",
        status: "disconnected",
      });
      setShowKeyForm(true);
      setGeminiNotice({
        type: "info",
        text: "Gemini key disconnected. AI features will use the built-in engine.",
      });
      setTimeout(() => setGeminiNotice({ type: "", text: "" }), 4000);
    } catch (err) {
      setGeminiNotice({
        type: "error",
        text: err.response?.data?.detail || "Failed to disconnect Gemini key.",
      });
    } finally {
      setGeminiLoading(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchBarRef.current && !searchBarRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const matchingSuggestions = useMemo(() => {
    const q = searchFilter.trim().toLowerCase();

    // Unique skills from loaded jobs
    const allSkillsMap = new Map();
    jobs.forEach((j) => {
      const jobSkills = [
        ...(Array.isArray(j.tags) ? j.tags : []),
        ...(Array.isArray(j.skills) ? j.skills : []),
      ];
      jobSkills.forEach((s) => {
        if (s && typeof s === "string") {
          allSkillsMap.set(s.toLowerCase(), s);
        }
      });
    });
    // Ensure popular baseline skills exist
    ["React", "Node.js", "Python", "JavaScript", "TypeScript", "UI/UX", "SQL", "Docker", "Tailwind CSS", "Figma"].forEach(
      (s) => allSkillsMap.set(s.toLowerCase(), s)
    );

    const allSkills = Array.from(allSkillsMap.values());

    if (!q) {
      return {
        jobs: jobs.slice(0, 4),
        skills: allSkills.slice(0, 6),
        companies: [],
        totalCount: jobs.length,
      };
    }

    const matchedJobs = jobs
      .filter((j) => {
        const titleMatch = j.title && j.title.toLowerCase().includes(q);
        const compMatch = j.company && j.company.toLowerCase().includes(q);
        const locMatch = j.location && j.location.toLowerCase().includes(q);
        const tagMatch = Array.isArray(j.tags) && j.tags.some((t) => t.toLowerCase().includes(q));
        const skillMatch = Array.isArray(j.skills) && j.skills.some((s) => s.toLowerCase().includes(q));
        return titleMatch || compMatch || locMatch || tagMatch || skillMatch;
      })
      .slice(0, 4);

    const matchedSkills = allSkills
      .filter((s) => s.toLowerCase().includes(q))
      .slice(0, 5);

    const matchedCompanies = Array.from(
      new Set(
        jobs
          .map((j) => j.company)
          .filter((c) => c && c.toLowerCase().includes(q))
      )
    ).slice(0, 3);

    return {
      jobs: matchedJobs,
      skills: matchedSkills,
      companies: matchedCompanies,
      totalCount: matchedJobs.length,
    };
  }, [jobs, searchFilter]);

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
          <div className="cand-search-bar" ref={searchBarRef}>
            <Search size={18} className="cand-search-icon" />
            <input
              type="search"
              placeholder={t("candidate.searchPlaceholder", "Search jobs, skills, companies...")}
              value={searchFilter}
              onChange={(e) => {
                setSearchFilter(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && searchFilter.trim()) {
                  setShowSuggestions(false);
                  navigate(`/candidate/jobs?q=${encodeURIComponent(searchFilter.trim())}`);
                } else if (e.key === "Escape") {
                  setShowSuggestions(false);
                }
              }}
              className="cand-search-input"
              autoComplete="off"
            />

            {showSuggestions && (
              <div className="cand-search-suggestions" role="listbox">
                {!searchFilter.trim() ? (
                  <div className="cand-sugg-section">
                    <div className="cand-sugg-header">
                      <TrendingUp size={13} />
                      <span>{t("candidate.popularSearches", "Popular Searches")}</span>
                    </div>
                    <div className="cand-sugg-pills">
                      {matchingSuggestions.skills.map((skill) => (
                        <button
                          key={skill}
                          type="button"
                          className="cand-sugg-pill"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setSearchFilter(skill);
                            setShowSuggestions(false);
                            navigate(`/candidate/jobs?q=${encodeURIComponent(skill)}`);
                          }}
                        >
                          <Sparkles size={11} />
                          {skill}
                        </button>
                      ))}
                    </div>
                    {matchingSuggestions.jobs.length > 0 && (
                      <div className="cand-sugg-sublist">
                        <div className="cand-sugg-header">
                          <Briefcase size={13} />
                          <span>{t("candidate.recommendedRoles", "Recent Vacancies")}</span>
                        </div>
                        {matchingSuggestions.jobs.map((j) => (
                          <div
                            key={j.id}
                            className="cand-sugg-job-item"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setShowSuggestions(false);
                              navigate(`/candidate/jobs/${j.id}`);
                            }}
                          >
                            <div className="cand-sugg-job-info">
                              <span className="cand-sugg-job-title">{j.title}</span>
                              <span className="cand-sugg-job-meta">{j.company} • {j.location}</span>
                            </div>
                            <span className="cand-sugg-badge">{j.type}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    {matchingSuggestions.jobs.length === 0 &&
                    matchingSuggestions.skills.length === 0 &&
                    matchingSuggestions.companies.length === 0 ? (
                      <div className="cand-sugg-empty">
                        <p className="cand-sugg-empty-title">
                          {t("candidate.noSuggestionsFound", "No exact suggestions found")}
                        </p>
                        <p className="cand-sugg-empty-sub">
                          {t("candidate.pressEnterToSearch", "Press Enter to search all jobs for")} &ldquo;{searchFilter}&rdquo;
                        </p>
                      </div>
                    ) : (
                      <>
                        {matchingSuggestions.jobs.length > 0 && (
                          <div className="cand-sugg-section">
                            <div className="cand-sugg-header">
                              <Briefcase size={13} />
                              <span>{t("candidate.matchingJobs", "Matching Jobs")}</span>
                            </div>
                            {matchingSuggestions.jobs.map((j) => (
                              <div
                                key={j.id}
                                className="cand-sugg-job-item"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  setShowSuggestions(false);
                                  navigate(`/candidate/jobs/${j.id}`);
                                }}
                              >
                                <div className="cand-sugg-job-info">
                                  <span className="cand-sugg-job-title">{j.title}</span>
                                  <span className="cand-sugg-job-meta">{j.company} • {j.location}</span>
                                </div>
                                <span className="cand-sugg-badge">{j.type}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {matchingSuggestions.skills.length > 0 && (
                          <div className="cand-sugg-section">
                            <div className="cand-sugg-header">
                              <Sparkles size={13} />
                              <span>{t("candidate.skillsKeywords", "Skills & Tags")}</span>
                            </div>
                            <div className="cand-sugg-pills">
                              {matchingSuggestions.skills.map((skill) => (
                                <button
                                  key={skill}
                                  type="button"
                                  className="cand-sugg-pill"
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    setSearchFilter(skill);
                                    setShowSuggestions(false);
                                    navigate(`/candidate/jobs?q=${encodeURIComponent(skill)}`);
                                  }}
                                >
                                  <Tag size={11} />
                                  {skill}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {matchingSuggestions.companies.length > 0 && (
                          <div className="cand-sugg-section">
                            <div className="cand-sugg-header">
                              <Building2 size={13} />
                              <span>{t("candidate.companies", "Companies")}</span>
                            </div>
                            {matchingSuggestions.companies.map((comp) => (
                              <div
                                key={comp}
                                className="cand-sugg-company-item"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  setSearchFilter(comp);
                                  setShowSuggestions(false);
                                  navigate(`/candidate/jobs?q=${encodeURIComponent(comp)}`);
                                }}
                              >
                                <Building2 size={14} className="cand-sugg-icon" />
                                <span>{comp}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}

                    <div
                      className="cand-sugg-footer"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setShowSuggestions(false);
                        navigate(`/candidate/jobs?q=${encodeURIComponent(searchFilter.trim())}`);
                      }}
                    >
                      <span>
                        {t("candidate.viewAllResults", "View all results for")} <strong>&ldquo;{searchFilter}&rdquo;</strong>
                      </span>
                      <ArrowRight size={14} />
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <Link to="/candidate/notifications" className="cand-notif-btn" title={t("common.nav.notifications", "Notifications")}>
            <Bell size={20} />
            {unreadNotifCount > 0 && <span className="cand-notif-badge">{unreadNotifCount}</span>}
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

          {/* AI Career Toolkit Quick Links */}
          <div className="cand-ai-usage-card">
            <div className="cand-ai-usage-header">
              <div className="cand-ai-tier-wrap">
                <span className="cand-tier-badge-premium" style={{ background: "rgba(59, 130, 246, 0.1)", color: "#3B82F6", borderColor: "rgba(59, 130, 246, 0.2)" }}>
                  <Sparkles size={14} />
                  <strong>AI CAREER TOOLKIT</strong>
                </span>
              </div>
            </div>

            <div className="cand-ai-quick-links" style={{ marginTop: "0.5rem" }}>
              <Link to="/candidate/career-roadmap" className="cand-ai-link-item">
                <Compass size={14} />
                <span>My Career Roadmap</span>
                <ArrowUpRight size={13} className="cand-link-arrow" />
              </Link>
              <Link to="/candidate/cv-versions" className="cand-ai-link-item">
                <History size={14} />
                <span>My CV Versions</span>
                <ArrowUpRight size={13} className="cand-link-arrow" />
              </Link>
              <Link to="/candidate/cv-studio" className="cand-ai-link-item">
                <Sparkles size={14} />
                <span>AI CV Studio</span>
                <ArrowUpRight size={13} className="cand-link-arrow" />
              </Link>
            </div>
          </div>

          {/* Personal Google Gemini AI Engine BYOK Card */}
          <div className="cand-gemini-card">
            <div className="cand-gemini-header">
              <div className="cand-gemini-title-wrap">
                <div className="cand-gemini-icon-circle">
                  <Sparkles size={16} className="cand-gemini-sparkle-icon" />
                </div>
                <div>
                  <h3 className="cand-gemini-title">AI Engine (Google Gemini)</h3>
                  <span className="cand-gemini-subtitle">BYOK — Bring Your Own API Key</span>
                </div>
              </div>
              <span className={`cand-gemini-badge ${geminiStatus.has_key ? "badge-connected" : "badge-heuristic"}`}>
                <span className="cand-status-dot" />
                {geminiStatus.has_key ? "Gemini 3.5 Flash-Lite" : "Built-in Engine"}
              </span>
            </div>

            <p className="cand-gemini-desc">
              Connect your personal Google Gemini API key to power all CareerLens AI tools (Resume Analyzer, CV Studio, Career Roadmap, and Job Matching) with Gemini 3.5 Flash-Lite.
            </p>

            {geminiNotice.text && (
              <div className={`cand-gemini-notice notice-${geminiNotice.type}`}>
                <AlertCircle size={15} />
                <span>{geminiNotice.text}</span>
              </div>
            )}

            {geminiStatus.has_key && !showKeyForm ? (
              <div className="cand-gemini-active-box">
                <div className="cand-gemini-active-meta">
                  <Key size={15} className="text-emerald-500" />
                  <span className="cand-gemini-masked-key">Key: {geminiStatus.key_preview || "••••••••"}</span>
                  <span className="cand-gemini-model-tag">{geminiStatus.model || "gemini-3.5-flash-lite"}</span>
                </div>
                <div className="cand-gemini-actions">
                  <button
                    type="button"
                    className="cand-btn-gemini-ghost"
                    onClick={() => setShowKeyForm(true)}
                  >
                    Change Key
                  </button>
                  <button
                    type="button"
                    className="cand-btn-gemini-danger"
                    onClick={handleDeleteGeminiKey}
                    disabled={geminiLoading}
                    title="Disconnect Gemini API Key"
                  >
                    <Trash2 size={13} />
                    <span>Disconnect</span>
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSaveGeminiKey} className="cand-gemini-form">
                <div className="cand-gemini-input-wrap">
                  <Key size={15} className="cand-gemini-input-icon" />
                  <input
                    type={showRawKey ? "text" : "password"}
                    value={geminiKeyInput}
                    onChange={(e) => setGeminiKeyInput(e.target.value)}
                    placeholder="Paste Gemini API key (AIzaSy...)"
                    className="cand-gemini-input"
                    disabled={geminiLoading}
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    className="cand-btn-toggle-eye"
                    onClick={() => setShowRawKey((prev) => !prev)}
                    title={showRawKey ? "Hide key" : "Show key"}
                  >
                    {showRawKey ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>

                <div className="cand-gemini-form-footer">
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cand-gemini-free-link"
                  >
                    <span>Get a free API key at Google AI Studio</span>
                    <ExternalLink size={12} />
                  </a>

                  <div className="cand-gemini-btn-row">
                    {geminiStatus.has_key && (
                      <button
                        type="button"
                        className="cand-btn-gemini-cancel"
                        onClick={() => {
                          setShowKeyForm(false);
                          setGeminiKeyInput("");
                        }}
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="submit"
                      className="cand-btn-gemini-submit"
                      disabled={geminiLoading || !geminiKeyInput.trim()}
                    >
                      {geminiLoading ? (
                        <>
                          <Loader2 size={14} className="cand-spinner" />
                          <span>Testing & Saving...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles size={14} />
                          <span>Verify & Connect</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>

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
    </div>
  );
}