import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Sparkles, Briefcase, Tag, TrendingUp, Search } from "lucide-react";
import { fetchNormalizedJobs } from "../../../services/jobService";
import {
  fetchNormalizedApplications,
  createApplication,
} from "../../../services/applicationService";
import {
  fetchSavedJobRecords,
  toggleSavedJobBackend,
} from "../../../services/candidateService";
import { useLanguage } from "../../../context/LanguageContext";
import "./Jobs.css";

export const MOCK_JOBS_DB = [];

export default function CandidateJobs() {
  const { t } = useLanguage();
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [savedRecords, setSavedRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [applyingId, setApplyingId] = useState(null);
  const [savingId, setSavingId] = useState(null);

  // Filter States & URL Synchronization
  const [searchParams, setSearchParams] = useSearchParams();
  const urlQ = searchParams.get("q") || searchParams.get("search") || "";
  const [searchTerm, setSearchTerm] = useState(urlQ);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchWrapRef = useRef(null);
  const [typeFilter, setTypeFilter] = useState("");
  const [setupFilter, setSetupFilter] = useState("");
  const [industryFilter, setIndustryFilter] = useState("");

  useEffect(() => {
    const q = searchParams.get("q") || searchParams.get("search");
    if (q !== null && q !== searchTerm) {
      setSearchTerm(q);
    }
  }, [searchParams]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const suggestions = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const allSkillsMap = new Map();
    jobs.forEach((j) => {
      const skills = [
        ...(Array.isArray(j.tags) ? j.tags : []),
        ...(Array.isArray(j.skills) ? j.skills : []),
      ];
      skills.forEach((s) => {
        if (s && typeof s === "string") allSkillsMap.set(s.toLowerCase(), s);
      });
    });
    ["React", "Node.js", "Python", "JavaScript", "TypeScript", "UI/UX", "SQL", "Docker", "Tailwind CSS", "Figma"].forEach(
      (s) => allSkillsMap.set(s.toLowerCase(), s)
    );
    const allSkills = Array.from(allSkillsMap.values());

    if (!q) {
      return {
        jobs: jobs.slice(0, 3),
        skills: allSkills.slice(0, 6),
      };
    }

    const matchedJobs = jobs
      .filter((j) => {
        const text = `${j.title} ${j.company} ${j.location} ${(j.tags || []).join(" ")}`.toLowerCase();
        return text.includes(q);
      })
      .slice(0, 4);

    const matchedSkills = allSkills
      .filter((s) => s.toLowerCase().includes(q))
      .slice(0, 5);

    return {
      jobs: matchedJobs,
      skills: matchedSkills,
    };
  }, [jobs, searchTerm]);

  const loadJobsData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [jobList, appList, savedList] = await Promise.all([
        fetchNormalizedJobs(),
        fetchNormalizedApplications().catch(() => []),
        fetchSavedJobRecords(),
      ]);
      setJobs(jobList.filter((j) => j.rawStatus === "PUBLISHED"));
      setApplications(appList);
      setSavedRecords(savedList);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load job listings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadJobsData();
  }, [loadJobsData]);

  const savedJobIds = useMemo(
    () => new Set(savedRecords.map((r) => Number(r.job?.id || r.job_id || r.job))),
    [savedRecords]
  );

  const appliedJobIds = useMemo(
    () => new Set(applications.map((a) => Number(a.jobId))),
    [applications]
  );

  const industries = useMemo(() => {
    const set = new Set(
      jobs.map((j) => j.industry).filter((ind) => ind && ind.trim().length > 0)
    );
    return Array.from(set).sort();
  }, [jobs]);

  const toggleSave = async (jobId) => {
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

  const applyJob = async (job) => {
    if (appliedJobIds.has(Number(job.id))) return;
    setApplyingId(job.id);
    try {
      await createApplication({ job_id: job.id });
      const nextApps = await fetchNormalizedApplications();
      setApplications(nextApps);
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to submit application.");
    } finally {
      setApplyingId(null);
    }
  };

  const filteredJobs = useMemo(() => {
    return jobs.filter((j) => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !q ||
        `${j.title} ${j.company} ${j.location} ${(j.tags || []).join(" ")}`
          .toLowerCase()
          .includes(q);

      const matchesType = !typeFilter || j.type === typeFilter;
      const matchesSetup = !setupFilter || j.setup === setupFilter;
      const matchesIndustry =
        !industryFilter ||
        (j.industry || "").toLowerCase() === industryFilter.toLowerCase();

      return matchesSearch && matchesType && matchesSetup && matchesIndustry;
    });
  }, [jobs, searchTerm, typeFilter, setupFilter, industryFilter]);

  return (
    <div className="cj-page">
      <h1 className="cj-title">{t("candidate.findJobsTitle", "Find Jobs")}</h1>

      {error && (
        <div
          style={{
            padding: "12px 16px",
            backgroundColor: "#fef2f2",
            color: "#b91c1c",
            borderRadius: "8px",
            marginBottom: "16px",
          }}
        >
          {error}
        </div>
      )}

      {/* Search and Filters */}
      <div className="cj-filters">
        <div className="cj-search-wrap" ref={searchWrapRef}>
          <input
            type="text"
            className="cj-search"
            placeholder={t("candidate.searchJobsFilterPlaceholder", "Search title, company, skill or location")}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === "Escape") {
                setShowSuggestions(false);
              }
            }}
            autoComplete="off"
          />

          {showSuggestions && (
            <div className="cj-search-suggestions" role="listbox">
              {suggestions.skills.length > 0 && (
                <div className="cj-sugg-section">
                  <div className="cj-sugg-header">
                    <TrendingUp size={13} />
                    <span>{searchTerm ? t("candidate.skillsKeywords", "Skills & Tags") : t("candidate.popularSearches", "Popular Searches")}</span>
                  </div>
                  <div className="cj-sugg-pills">
                    {suggestions.skills.map((skill) => (
                      <button
                        key={skill}
                        type="button"
                        className="cj-sugg-pill"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setSearchTerm(skill);
                          setShowSuggestions(false);
                        }}
                      >
                        <Tag size={11} />
                        {skill}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {suggestions.jobs.length > 0 && (
                <div className="cj-sugg-section">
                  <div className="cj-sugg-header">
                    <Briefcase size={13} />
                    <span>{searchTerm ? t("candidate.matchingJobs", "Matching Jobs") : t("candidate.recommendedRoles", "Recent Vacancies")}</span>
                  </div>
                  {suggestions.jobs.map((j) => (
                    <div
                      key={j.id}
                      className="cj-sugg-job-item"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setSearchTerm(j.title);
                        setShowSuggestions(false);
                      }}
                    >
                      <div className="cj-sugg-job-info">
                        <span className="cj-sugg-job-title">{j.title}</span>
                        <span className="cj-sugg-job-meta">{j.company} • {j.location}</span>
                      </div>
                      <span className="cj-sugg-badge">{j.type}</span>
                    </div>
                  ))}
                </div>
              )}

              {searchTerm && suggestions.jobs.length === 0 && suggestions.skills.length === 0 && (
                <div className="cj-sugg-empty">
                  <span>{t("candidate.noSuggestionsFound", "No exact suggestions for")} &ldquo;{searchTerm}&rdquo;</span>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="cj-dropdowns">
          <select
            className="cj-select"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">{t("candidate.jobTypeFilter", "Job type")}</option>
            <option value="Full-time">{t("candidate.fullTime", "Full-time")}</option>
            <option value="Part-time">{t("candidate.partTime", "Part-time")}</option>
            <option value="Internship">{t("candidate.internship", "Internship")}</option>
            <option value="Contract">{t("candidate.contract", "Contract")}</option>
          </select>
          <select
            className="cj-select"
            value={setupFilter}
            onChange={(e) => setSetupFilter(e.target.value)}
          >
            <option value="">{t("candidate.workplaceFilter", "Workplace")}</option>
            <option value="On-site">{t("candidate.onSite", "On-site")}</option>
            <option value="Hybrid">{t("candidate.hybrid", "Hybrid")}</option>
            <option value="Remote">{t("candidate.remote", "Remote")}</option>
          </select>
          <select
            className="cj-select"
            value={industryFilter}
            onChange={(e) => setIndustryFilter(e.target.value)}
          >
            <option value="">{t("candidate.industryFilter", "Industry")}</option>
            {industries.map((ind) => (
              <option key={ind} value={ind}>
                {ind}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results List */}
      <div className="cj-list">
        {loading ? (
          <div
            style={{
              textAlign: "center",
              padding: "40px",
              color: "#64748b",
              backgroundColor: "#fff",
              border: "1px dashed #cbd5e1",
              borderRadius: "8px",
            }}
          >
            {t("candidate.loadingJobs", "Loading job postings...")}
          </div>
        ) : filteredJobs.length > 0 ? (
          filteredJobs.map((job) => {
            const isSaved = savedJobIds.has(Number(job.id));
            const isApplied = appliedJobIds.has(Number(job.id));
            return (
              <div key={job.id} className="cj-card">
                <div className="cj-card__left">
                  <Link
                    to={`/candidate/jobs/${job.id}`}
                    style={{ textDecoration: "none", color: "inherit" }}
                  >
                    <h3 className="cj-card__title">{job.title}</h3>
                  </Link>
                  <div className="cj-card__meta">
                    {job.company} &middot; {job.location} &middot; {job.setup} &middot;{" "}
                    {job.type}
                  </div>
                  <div className="cj-card__salary">{job.salary}</div>
                  <div className="cj-card__tags">
                    {(job.tags || []).map((tag) => (
                      <span key={tag} className="cj-card__tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="cj-card__right">
                  <button
                    className={`cj-btn ${isSaved ? "cj-btn--solid" : "cj-btn--outline"}`}
                    onClick={() => toggleSave(job.id)}
                    disabled={savingId === job.id}
                  >
                    {isSaved ? t("candidate.saved", "Saved") : t("candidate.save", "Save")}
                  </button>
                  {isApplied ? (
                    <span className="cj-badge cj-badge--applied">{t("candidate.applied", "Applied")}</span>
                  ) : (
                    <button
                      className="cj-btn cj-btn--solid"
                      onClick={() => applyJob(job)}
                      disabled={applyingId === job.id}
                    >
                      {applyingId === job.id ? t("candidate.applying", "Applying...") : t("candidate.apply", "Apply")}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div
            style={{
              textAlign: "center",
              padding: "40px",
              color: "#64748b",
              backgroundColor: "#fff",
              border: "1px dashed #cbd5e1",
              borderRadius: "8px",
            }}
          >
            {t("candidate.noJobsMatch", "No jobs match your filters.")}
          </div>
        )}
      </div>
    </div>
  );
}