import { useState, useEffect, useCallback, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Sparkles,
  Search,
  Filter,
  Briefcase,
  MapPin,
  Building2,
  DollarSign,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  Sliders,
  Bookmark,
  ExternalLink,
  Target,
  GraduationCap,
  Layers,
  HelpCircle,
  Check,
  TrendingUp,
  X,
  FileUser,
  Compass,
} from "lucide-react";
import { useAuth } from "../../../hooks/useAuth";
import { useLanguage } from "../../../context/LanguageContext";
import {
  getJobRecommendations,
  recalculateJobRecommendations,
} from "../../../services/jobRecommendationService";
import {
  fetchNormalizedApplications,
  createApplication,
} from "../../../services/applicationService";
import {
  fetchSavedJobRecords,
  toggleSavedJobBackend,
} from "../../../services/candidateService";
import { formatSalaryRange } from "../../../services/jobService";
import "./BestFitJobs.css";

export default function BestFitJobs() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Recommendations data
  const [recommendations, setRecommendations] = useState([]);
  const [meta, setMeta] = useState({
    count: 0,
    top_score: 0,
    target_role: "",
    preferred_location: "",
    preferred_employment_type: "",
    preferred_workplace_type: "",
  });
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Applications & Saved jobs state
  const [applications, setApplications] = useState([]);
  const [savedRecords, setSavedRecords] = useState([]);
  const [applyingId, setApplyingId] = useState(null);
  const [savingId, setSavingId] = useState(null);

  // Expanded card details (accordion)
  const [expandedJobId, setExpandedJobId] = useState(null);

  // Preference Edit State
  const [showPreferencesBar, setShowPreferencesBar] = useState(false);
  const [prefForm, setPrefForm] = useState({
    target_role: "",
    preferred_location: "",
    preferred_employment_type: "",
    preferred_workplace_type: "",
  });

  // Client Filter States
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [minScoreFilter, setMinScoreFilter] = useState("all");
  const [employmentFilter, setEmploymentFilter] = useState("");
  const [workplaceFilter, setWorkplaceFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");

  // Load recommendations, applications, and saved jobs
  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [recRes, appList, savedList] = await Promise.all([
        getJobRecommendations(),
        fetchNormalizedApplications().catch(() => []),
        fetchSavedJobRecords().catch(() => []),
      ]);

      const resData = recRes.data || {};
      setRecommendations(resData.results || []);
      setMeta({
        count: resData.count || 0,
        top_score: resData.top_score || 0,
        target_role: resData.target_role || "",
        preferred_location: resData.preferred_location || "",
        preferred_employment_type: resData.preferred_employment_type || "",
        preferred_workplace_type: resData.preferred_workplace_type || "",
      });
      setPrefForm({
        target_role: resData.target_role || "",
        preferred_location: resData.preferred_location || "",
        preferred_employment_type: resData.preferred_employment_type || "",
        preferred_workplace_type: resData.preferred_workplace_type || "",
      });

      setApplications(appList);
      setSavedRecords(savedList);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Could not load job recommendations. Please make sure your CV is uploaded."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Sets for applied & saved IDs
  const appliedJobIds = useMemo(
    () => new Set(applications.map((a) => Number(a.jobId))),
    [applications]
  );

  const savedJobIds = useMemo(
    () => new Set(savedRecords.map((r) => Number(r.job?.id || r.job_id || r.job))),
    [savedRecords]
  );

  // Recalculate matches with updated preferences
  const handleRecalculate = async (e) => {
    if (e) e.preventDefault();
    setRecalculating(true);
    setError("");
    setSuccessMsg("");
    try {
      const res = await recalculateJobRecommendations(prefForm);
      const resData = res.data || {};
      setRecommendations(resData.results || []);
      setMeta({
        count: resData.count || 0,
        top_score: resData.top_score || 0,
        target_role: resData.target_role || prefForm.target_role,
        preferred_location: resData.preferred_location || prefForm.preferred_location,
        preferred_employment_type: resData.preferred_employment_type || prefForm.preferred_employment_type,
        preferred_workplace_type: resData.preferred_workplace_type || prefForm.preferred_workplace_type,
      });
      setSuccessMsg("Preferences saved and job matches recalculated!");
      setTimeout(() => setSuccessMsg(""), 4000);
      setShowPreferencesBar(false);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to recalculate matches.");
    } finally {
      setRecalculating(false);
    }
  };

  // Toggle Save Job
  const handleToggleSave = async (jobId) => {
    setSavingId(jobId);
    try {
      const next = await toggleSavedJobBackend(jobId, savedRecords);
      setSavedRecords(next);
    } catch (err) {
      alert(err.response?.data?.detail || "Could not update saved job.");
    } finally {
      setSavingId(null);
    }
  };

  // Apply to Job
  const handleApply = async (job) => {
    if (appliedJobIds.has(Number(job.id))) return;
    setApplyingId(job.id);
    try {
      await createApplication({ job_id: job.id });
      const nextApps = await fetchNormalizedApplications();
      setApplications(nextApps);
      setSuccessMsg(`Successfully applied to ${job.title}!`);
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to submit application.");
    } finally {
      setApplyingId(null);
    }
  };

  // Filter recommendations based on active client filters
  const filteredRecommendations = useMemo(() => {
    return recommendations.filter((rec) => {
      const job = rec.job || {};

      // Search query (title, company, skills)
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const skillsStr = (job.skills || []).join(" ").toLowerCase();
        const matchingStr = (rec.matching_skills || []).join(" ").toLowerCase();
        const searchable = `${job.title} ${job.company?.company_name} ${job.location} ${skillsStr} ${matchingStr}`.toLowerCase();
        if (!searchable.includes(q)) return false;
      }

      // Match Score Threshold
      if (minScoreFilter === "80" && rec.match_score < 80) return false;
      if (minScoreFilter === "65" && rec.match_score < 65) return false;
      if (minScoreFilter === "50" && rec.match_score < 50) return false;

      // Employment Type
      if (employmentFilter && job.employment_type !== employmentFilter) {
        return false;
      }

      // Workplace Type
      if (workplaceFilter && job.workplace_type !== workplaceFilter) {
        return false;
      }

      // Location
      if (locationFilter.trim()) {
        const locQ = locationFilter.toLowerCase().trim();
        if (!(job.location || "").toLowerCase().includes(locQ)) {
          return false;
        }
      }

      return true;
    });
  }, [
    recommendations,
    searchTerm,
    minScoreFilter,
    employmentFilter,
    workplaceFilter,
    locationFilter,
  ]);

  // Helper for match score badge styling
  const getScoreBadgeClass = (score) => {
    if (score >= 80) return "score-badge--exceptional";
    if (score >= 65) return "score-badge--strong";
    if (score >= 50) return "score-badge--moderate";
    return "score-badge--development";
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return "Exceptional Match";
    if (score >= 65) return "Strong Match";
    if (score >= 50) return "Good Fit";
    return "Potential Match";
  };

  return (
    <div className="best-fit-page">
      {/* ── Top Header Bar ────────────────────────────────────────────── */}
      <div className="bf-header">
        <div className="bf-header__text">
          <div className="bf-header__pill">
            <Sparkles size={14} className="bf-sparkle-icon" />
            <span>AI Job Recommendation Engine</span>
          </div>
          <h1 className="bf-header__title">Find My Best-Fit Jobs</h1>
          <p className="bf-header__subtitle">
            Ranked matches calculated by comparing your approved CV profile against actual open positions in CareerLens.
          </p>
        </div>

        <div className="bf-header__actions">
          <button
            className="bf-btn-pref"
            onClick={() => setShowPreferencesBar(!showPreferencesBar)}
          >
            <Sliders size={16} />
            <span>Career Preferences</span>
            {showPreferencesBar ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          <button
            className="bf-btn-recalc"
            onClick={() => handleRecalculate()}
            disabled={recalculating}
          >
            <RefreshCw size={16} className={recalculating ? "bf-spin" : ""} />
            <span>{recalculating ? "Matching..." : "Recalculate Matches"}</span>
          </button>
        </div>
      </div>

      {/* ── Notifications / Alerts ────────────────────────────────────── */}
      {error && (
        <div className="bf-alert bf-alert--danger">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="bf-alert bf-alert--success">
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* ── Career Preferences Bar (Collapsible) ──────────────────────── */}
      {showPreferencesBar && (
        <form className="bf-preferences-panel" onSubmit={handleRecalculate}>
          <div className="pref-panel__header">
            <div className="pref-title-wrap">
              <Target size={18} className="pref-icon" />
              <h3>Customize Recommendation Preferences</h3>
            </div>
            <button
              type="button"
              className="pref-close-btn"
              onClick={() => setShowPreferencesBar(false)}
            >
              <X size={18} />
            </button>
          </div>

          <div className="pref-grid">
            <div className="pref-field">
              <label>Target Role / Position</label>
              <input
                type="text"
                placeholder="e.g. Frontend Developer, UI Designer"
                value={prefForm.target_role}
                onChange={(e) =>
                  setPrefForm({ ...prefForm, target_role: e.target.value })
                }
              />
            </div>

            <div className="pref-field">
              <label>Preferred Location</label>
              <input
                type="text"
                placeholder="e.g. Phnom Penh, Siem Reap, Any"
                value={prefForm.preferred_location}
                onChange={(e) =>
                  setPrefForm({ ...prefForm, preferred_location: e.target.value })
                }
              />
            </div>

            <div className="pref-field">
              <label>Job Type</label>
              <select
                value={prefForm.preferred_employment_type}
                onChange={(e) =>
                  setPrefForm({
                    ...prefForm,
                    preferred_employment_type: e.target.value,
                  })
                }
              >
                <option value="">Any Employment Type</option>
                <option value="FULL_TIME">Full Time</option>
                <option value="PART_TIME">Part Time</option>
                <option value="INTERNSHIP">Internship</option>
                <option value="CONTRACT">Contract</option>
              </select>
            </div>

            <div className="pref-field">
              <label>Workplace Setup</label>
              <select
                value={prefForm.preferred_workplace_type}
                onChange={(e) =>
                  setPrefForm({
                    ...prefForm,
                    preferred_workplace_type: e.target.value,
                  })
                }
              >
                <option value="">Any Workplace Setup</option>
                <option value="ON_SITE">On-site</option>
                <option value="HYBRID">Hybrid</option>
                <option value="REMOTE">Remote</option>
              </select>
            </div>
          </div>

          <div className="pref-panel__footer">
            <span className="pref-hint">
              Preferences are matched alongside your extracted resume skills and experience.
            </span>
            <button
              type="submit"
              className="pref-submit-btn"
              disabled={recalculating}
            >
              <Check size={16} />
              <span>Apply Preferences & Recalculate</span>
            </button>
          </div>
        </form>
      )}

      {/* ── Summary Stats Banner ──────────────────────────────────────── */}
      <div className="bf-stats-banner">
        <div className="stat-pill">
          <Layers size={18} className="stat-pill__icon" />
          <div className="stat-pill__info">
            <span className="stat-num">{meta.count}</span>
            <span className="stat-label">Active Jobs Evaluated</span>
          </div>
        </div>

        <div className="stat-pill">
          <TrendingUp size={18} className="stat-pill__icon stat-pill__icon--green" />
          <div className="stat-pill__info">
            <span className="stat-num">{meta.top_score}%</span>
            <span className="stat-label">Top Job Match</span>
          </div>
        </div>

        <div className="stat-pill">
          <Target size={18} className="stat-pill__icon stat-pill__icon--purple" />
          <div className="stat-pill__info">
            <span className="stat-num truncate-text">
              {meta.target_role || "Any Technical Role"}
            </span>
            <span className="stat-label">Target Role</span>
          </div>
        </div>

        <div className="stat-pill stat-pill--link">
          <Link to="/candidate/resume" className="stat-resume-link">
            <FileUser size={16} />
            <span>Update CV to Improve Fit</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* ── Filter & Search Toolbar ───────────────────────────────────── */}
      <div className="bf-toolbar">
        <div className="bf-search-wrap">
          <Search size={16} className="bf-search-icon" />
          <input
            type="text"
            className="bf-search-input"
            placeholder="Filter by title, company, or matching skill..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              className="bf-clear-search"
              onClick={() => setSearchTerm("")}
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="bf-filters-row">
          <div className="bf-filter-item">
            <label>Match Score:</label>
            <select
              value={minScoreFilter}
              onChange={(e) => setMinScoreFilter(e.target.value)}
            >
              <option value="all">All Match Scores</option>
              <option value="80">80%+ Exceptional</option>
              <option value="65">65%+ Strong Match</option>
              <option value="50">50%+ Good Fit</option>
            </select>
          </div>

          <div className="bf-filter-item">
            <label>Job Type:</label>
            <select
              value={employmentFilter}
              onChange={(e) => setEmploymentFilter(e.target.value)}
            >
              <option value="">All Types</option>
              <option value="FULL_TIME">Full-time</option>
              <option value="PART_TIME">Part-time</option>
              <option value="INTERNSHIP">Internship</option>
              <option value="CONTRACT">Contract</option>
            </select>
          </div>

          <div className="bf-filter-item">
            <label>Workplace:</label>
            <select
              value={workplaceFilter}
              onChange={(e) => setWorkplaceFilter(e.target.value)}
            >
              <option value="">All Setups</option>
              <option value="ON_SITE">On-site</option>
              <option value="HYBRID">Hybrid</option>
              <option value="REMOTE">Remote</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Recommended Jobs List ─────────────────────────────────────── */}
      <div className="bf-jobs-container">
        {loading ? (
          <div className="bf-loading-card">
            <RefreshCw size={28} className="bf-spin bf-loading-icon" />
            <h3>Matching your CV against CareerLens job listings...</h3>
            <p>Evaluating technical skills, past experience, education, and location alignment.</p>
          </div>
        ) : filteredRecommendations.length > 0 ? (
          <div className="bf-jobs-list">
            {filteredRecommendations.map((rec) => {
              const job = rec.job || {};
              const company = job.company || {};
              const isExpanded = expandedJobId === job.id;
              const isApplied = appliedJobIds.has(Number(job.id));
              const isSaved = savedJobIds.has(Number(job.id));
              const salaryFormatted = formatSalaryRange(job.salary_min, job.salary_max);
              const breakdown = rec.score_breakdown || {};

              return (
                <div key={rec.id} className="bf-job-card">
                  {/* Card Header */}
                  <div className="bf-job-card__top">
                    <div className="bf-job-card__main">
                      <div className="bf-job-card__title-row">
                        <Link
                          to={`/candidate/jobs/${job.id}`}
                          className="bf-job-title"
                        >
                          {job.title}
                        </Link>
                        <div
                          className={`bf-score-pill ${getScoreBadgeClass(
                            rec.match_score
                          )}`}
                          title={`Overall Job Match Score: ${rec.match_score}/100`}
                        >
                          <span className="score-pct">{rec.match_score}%</span>
                          <span className="score-desc">
                            {getScoreLabel(rec.match_score)}
                          </span>
                        </div>
                      </div>

                      <div className="bf-job-meta-row">
                        <span className="bf-meta-item">
                          <Building2 size={14} />
                          {company.company_name || "Company"}
                        </span>
                        <span className="bf-meta-bullet">&middot;</span>
                        <span className="bf-meta-item">
                          <MapPin size={14} />
                          {job.location || "Remote"}
                        </span>
                        <span className="bf-meta-bullet">&middot;</span>
                        <span className="bf-meta-item">
                          <Briefcase size={14} />
                          {job.employment_type?.replace("_", " ")}
                        </span>
                        <span className="bf-meta-bullet">&middot;</span>
                        <span className="bf-meta-item bf-salary">
                          <DollarSign size={14} />
                          {salaryFormatted}
                        </span>
                      </div>
                    </div>

                    {/* Card Top Actions */}
                    <div className="bf-job-card__actions">
                      <button
                        className={`bf-btn-save ${isSaved ? "bf-btn-save--saved" : ""}`}
                        onClick={() => handleToggleSave(job.id)}
                        disabled={savingId === job.id}
                        title={isSaved ? "Saved to your list" : "Save job"}
                      >
                        <Bookmark size={16} />
                        <span>{isSaved ? "Saved" : "Save"}</span>
                      </button>

                      {isApplied ? (
                        <span className="bf-applied-badge">
                          <CheckCircle2 size={14} />
                          <span>Applied</span>
                        </span>
                      ) : (
                        <button
                          className="bf-btn-apply"
                          onClick={() => handleApply(job)}
                          disabled={applyingId === job.id}
                        >
                          {applyingId === job.id ? (
                            "Applying..."
                          ) : (
                            <>
                              <span>Apply Now</span>
                              <ArrowRight size={14} />
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Why this job matches (Explainable Rationale) */}
                  <div className="bf-explanation-box">
                    <div className="bf-box-label">
                      <Sparkles size={14} />
                      <strong>Why this job is recommended for you:</strong>
                    </div>
                    <p>{rec.explanation}</p>
                  </div>

                  {/* Skills Alignment Grid */}
                  <div className="bf-skills-row">
                    {/* Matching Skills */}
                    <div className="bf-skills-group">
                      <span className="bf-group-title bf-group-title--matched">
                        <CheckCircle2 size={13} />
                        Matching Skills ({rec.matching_skills?.length || 0}):
                      </span>
                      <div className="bf-tags-list">
                        {(rec.matching_skills || []).length > 0 ? (
                          rec.matching_skills.map((skill) => (
                            <span key={skill} className="bf-tag bf-tag--matched">
                              {skill}
                            </span>
                          ))
                        ) : (
                          <span className="bf-tag-empty">
                            Fundamental qualifications match
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Missing / Unverified Skills */}
                    {(rec.missing_skills || []).length > 0 && (
                      <div className="bf-skills-group">
                        <span className="bf-group-title bf-group-title--missing">
                          <AlertCircle size={13} />
                          Missing or unverified in CV ({rec.missing_skills.length}):
                        </span>
                        <div className="bf-tags-list">
                          {rec.missing_skills.map((skill) => (
                            <span key={skill} className="bf-tag bf-tag--missing">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Expand / Collapse Score Breakdown & Improvement Suggestions */}
                  <div className="bf-card-accordion-toggle">
                    <button
                      className="bf-toggle-btn"
                      onClick={() =>
                        setExpandedJobId(isExpanded ? null : job.id)
                      }
                    >
                      <span>
                        {isExpanded
                          ? "Hide Score Breakdown & Improvement Suggestions"
                          : "View Score Breakdown & Improvement Suggestions"}
                      </span>
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>

                    <Link
                      to={`/candidate/jobs/${job.id}`}
                      className="bf-view-details-link"
                    >
                      <span>View Full Job Details</span>
                      <ExternalLink size={14} />
                    </Link>
                  </div>

                  {/* Expanded Section */}
                  {isExpanded && (
                    <div className="bf-expanded-content">
                      {/* Score Breakdown Bars */}
                      <div className="bf-breakdown-card">
                        <h4 className="bf-subheading">
                          Score Breakdown ({rec.match_score}/100)
                        </h4>
                        <div className="bf-meters-grid">
                          <div className="bf-meter-item">
                            <div className="bf-meter-label">
                              <span>Required Skills</span>
                              <strong>
                                {breakdown.skills_score || 0} / {breakdown.skills_max || 40}
                              </strong>
                            </div>
                            <div className="bf-meter-bar">
                              <div
                                className="bf-meter-fill bf-meter-fill--blue"
                                style={{
                                  width: `${
                                    ((breakdown.skills_score || 0) /
                                      (breakdown.skills_max || 40)) *
                                    100
                                  }%`,
                                }}
                              />
                            </div>
                          </div>

                          <div className="bf-meter-item">
                            <div className="bf-meter-label">
                              <span>Experience & Role Fit</span>
                              <strong>
                                {breakdown.experience_score || 0} /{" "}
                                {breakdown.experience_max || 25}
                              </strong>
                            </div>
                            <div className="bf-meter-bar">
                              <div
                                className="bf-meter-fill bf-meter-fill--green"
                                style={{
                                  width: `${
                                    ((breakdown.experience_score || 0) /
                                      (breakdown.experience_max || 25)) *
                                    100
                                  }%`,
                                }}
                              />
                            </div>
                          </div>

                          <div className="bf-meter-item">
                            <div className="bf-meter-label">
                              <span>Education & Qualifications</span>
                              <strong>
                                {breakdown.education_score || 0} /{" "}
                                {breakdown.education_max || 15}
                              </strong>
                            </div>
                            <div className="bf-meter-bar">
                              <div
                                className="bf-meter-fill bf-meter-fill--purple"
                                style={{
                                  width: `${
                                    ((breakdown.education_score || 0) /
                                      (breakdown.education_max || 15)) *
                                    100
                                  }%`,
                                }}
                              />
                            </div>
                          </div>

                          <div className="bf-meter-item">
                            <div className="bf-meter-label">
                              <span>Projects & Practical Evidence</span>
                              <strong>
                                {breakdown.projects_score || 0} /{" "}
                                {breakdown.projects_max || 10}
                              </strong>
                            </div>
                            <div className="bf-meter-bar">
                              <div
                                className="bf-meter-fill bf-meter-fill--amber"
                                style={{
                                  width: `${
                                    ((breakdown.projects_score || 0) /
                                      (breakdown.projects_max || 10)) *
                                    100
                                  }%`,
                                }}
                              />
                            </div>
                          </div>

                          <div className="bf-meter-item">
                            <div className="bf-meter-label">
                              <span>Location & Preferences</span>
                              <strong>
                                {breakdown.preferences_score || 0} /{" "}
                                {breakdown.preferences_max || 10}
                              </strong>
                            </div>
                            <div className="bf-meter-bar">
                              <div
                                className="bf-meter-fill bf-meter-fill--indigo"
                                style={{
                                  width: `${
                                    ((breakdown.preferences_score || 0) /
                                      (breakdown.preferences_max || 10)) *
                                    100
                                  }%`,
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Improvement Suggestions */}
                      <div className="bf-suggestions-card">
                        <div className="bf-subheading-wrap">
                          <h4 className="bf-subheading">
                            How to Improve Your Fit for This Position
                          </h4>
                          <span className="bf-note-tag">
                            Missing from CV ≠ Lack of ability
                          </span>
                        </div>
                        <ul className="bf-suggestions-list">
                          {(rec.improvement_suggestions || []).map((sugg, idx) => (
                            <li key={idx}>
                              <ArrowRight size={14} className="sugg-arrow" />
                              <span>{sugg}</span>
                            </li>
                          ))}
                        </ul>

                        <div className="bf-roadmap-cta-row">
                          <Link
                            to={`/candidate/career-roadmap?job_id=${job.id}&role=${encodeURIComponent(job.title)}`}
                            className="bf-btn-roadmap-action"
                          >
                            <Compass size={15} />
                            <span>Create Skill-Gap Roadmap for This Role</span>
                            <ArrowRight size={14} />
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty State */
          <div className="bf-empty-state">
            <div className="empty-state-icon-box">
              <Search size={32} />
            </div>
            <h3>No Recommended Jobs Match Your Filters</h3>
            <p>
              We couldn't find active positions matching your criteria with current filters.
              Try adjusting your score threshold, removing location restrictions, or exploring these related areas:
            </p>

            <div className="bf-suggested-categories">
              <span className="cat-chip" onClick={() => { setSearchTerm("Frontend"); setMinScoreFilter("all"); }}>
                Frontend Engineering
              </span>
              <span className="cat-chip" onClick={() => { setSearchTerm("Python"); setMinScoreFilter("all"); }}>
                Backend / Python
              </span>
              <span className="cat-chip" onClick={() => { setSearchTerm("React"); setMinScoreFilter("all"); }}>
                React Ecosystem
              </span>
              <span className="cat-chip" onClick={() => { setSearchTerm("Mobile"); setMinScoreFilter("all"); }}>
                Mobile Development
              </span>
            </div>

            <button
              className="bf-reset-filters-btn"
              onClick={() => {
                setSearchTerm("");
                setMinScoreFilter("all");
                setEmploymentFilter("");
                setWorkplaceFilter("");
                setLocationFilter("");
              }}
            >
              Reset All Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
