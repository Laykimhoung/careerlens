import { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { fetchNormalizedJobs } from "../../../services/jobService";
import {
  fetchNormalizedApplications,
  createApplication,
} from "../../../services/applicationService";
import {
  fetchSavedJobRecords,
  toggleSavedJobBackend,
} from "../../../services/candidateService";
import "./Jobs.css";

export const MOCK_JOBS_DB = [];

export default function CandidateJobs() {
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [savedRecords, setSavedRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [applyingId, setApplyingId] = useState(null);
  const [savingId, setSavingId] = useState(null);

  // Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [setupFilter, setSetupFilter] = useState("");
  const [industryFilter, setIndustryFilter] = useState("");

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
      <h1 className="cj-title">Find Jobs</h1>

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
        <input
          type="text"
          className="cj-search"
          placeholder="Search title, company, skill or location"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="cj-dropdowns">
          <select
            className="cj-select"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">Job type</option>
            <option value="Full-time">Full-time</option>
            <option value="Part-time">Part-time</option>
            <option value="Internship">Internship</option>
            <option value="Contract">Contract</option>
          </select>
          <select
            className="cj-select"
            value={setupFilter}
            onChange={(e) => setSetupFilter(e.target.value)}
          >
            <option value="">Workplace</option>
            <option value="On-site">On-site</option>
            <option value="Hybrid">Hybrid</option>
            <option value="Remote">Remote</option>
          </select>
          <select
            className="cj-select"
            value={industryFilter}
            onChange={(e) => setIndustryFilter(e.target.value)}
          >
            <option value="">Industry</option>
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
            Loading job postings...
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
                    {isSaved ? "Saved" : "Save"}
                  </button>
                  {isApplied ? (
                    <span className="cj-badge cj-badge--applied">Applied</span>
                  ) : (
                    <button
                      className="cj-btn cj-btn--solid"
                      onClick={() => applyJob(job)}
                      disabled={applyingId === job.id}
                    >
                      {applyingId === job.id ? "Applying..." : "Apply"}
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
            No jobs match your filters.
          </div>
        )}
      </div>
    </div>
  );
}