import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import Button from "../../../components/common/Button";
import { getJobById, normalizeJobRecord } from "../../../services/jobService";
import {
  fetchNormalizedApplications,
  createApplication,
} from "../../../services/applicationService";
import {
  fetchSavedJobRecords,
  toggleSavedJobBackend,
} from "../../../services/candidateService";
import "./JobDetails.css";

export default function CandidateJobDetails() {
  const { id } = useParams();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savedRecords, setSavedRecords] = useState([]);
  const [applications, setApplications] = useState([]);
  const [applying, setApplying] = useState(false);
  const [saving, setSaving] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: "", text: "" });

  const loadDetails = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [jobRes, appList, savedList] = await Promise.all([
        getJobById(id),
        fetchNormalizedApplications().catch(() => []),
        fetchSavedJobRecords(),
      ]);
      setJob(normalizeJobRecord(jobRes.data));
      setApplications(appList);
      setSavedRecords(savedList);
    } catch (err) {
      setError(err.response?.data?.detail || "Job not found.");
      setJob(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  if (loading) {
    return (
      <div className="job-details-page">
        <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
          Loading job details...
        </div>
      </div>
    );
  }

  if (!job || error) {
    return (
      <div className="job-details-page">
        <div className="job-not-found">
          <h2>Job not found</h2>
          <p style={{ marginBottom: "24px", color: "#6b7280" }}>
            {error || "The job you are looking for does not exist or has been removed."}
          </p>
          <Link to="/candidate/jobs">
            <Button variant="primary">Back to Jobs</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isSaved = savedRecords.some(
    (r) => Number(r.job?.id || r.job_id || r.job) === Number(job.id)
  );
  const existingApplication = applications.find(
    (a) => Number(a.jobId) === Number(job.id)
  );
  const isApplied = Boolean(existingApplication);

  const handleToggleSave = async () => {
    setSaving(true);
    try {
      const next = await toggleSavedJobBackend(job.id, savedRecords);
      setSavedRecords(next);
    } catch (err) {
      setStatusMsg({
        type: "error",
        text: err.response?.data?.detail || "Failed to update saved job.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleApplySubmit = async (e) => {
    if (e) e.preventDefault();
    if (isApplied) return;
    setApplying(true);
    setStatusMsg({ type: "", text: "" });
    try {
      await createApplication({
        job_id: job.id,
        cover_letter: coverLetter.trim(),
      });
      const nextApps = await fetchNormalizedApplications();
      setApplications(nextApps);
      setShowApplyForm(false);
      setStatusMsg({
        type: "success",
        text: "Your application has been submitted successfully!",
      });
    } catch (err) {
      setStatusMsg({
        type: "error",
        text: err.response?.data?.detail || "Failed to submit application.",
      });
    } finally {
      setApplying(false);
    }
  };

  const companyInfo = job.raw?.company || {};

  return (
    <div className="job-details-page">
      <Link to="/candidate/jobs" className="job-details__back">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          style={{ width: "16px", height: "16px" }}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
          />
        </svg>
        Back to Jobs
      </Link>

      {statusMsg.text && (
        <div
          style={{
            marginBottom: "16px",
            padding: "12px 16px",
            borderRadius: "8px",
            backgroundColor: statusMsg.type === "error" ? "#fef2f2" : "#f0fdf4",
            color: statusMsg.type === "error" ? "#b91c1c" : "#15803d",
            fontSize: "14px",
          }}
        >
          {statusMsg.text}
        </div>
      )}

      <div className="job-details__header">
        <div>
          <h1 className="job-details__title">{job.title}</h1>
          <p className="job-details__subtitle">
            {job.company} &middot; {job.location}
          </p>
          <div className="job-details__tags">
            {job.tags?.map((tag) => (
              <span key={tag} className="job-details__tag">
                {tag}
              </span>
            ))}
          </div>
        </div>
        <div className="job-details__actions">
          <Button variant="outline" onClick={handleToggleSave} disabled={saving}>
            {isSaved ? "Saved ✓" : "Save Job"}
          </Button>
          {isApplied ? (
            <Link to={`/candidate/applications/${existingApplication.id}`}>
              <Button variant="teal">Applied ✓ (View Status)</Button>
            </Link>
          ) : (
            <Button
              variant="teal"
              onClick={() => setShowApplyForm((prev) => !prev)}
              disabled={applying}
            >
              Apply Now
            </Button>
          )}
        </div>
      </div>

      {showApplyForm && !isApplied && (
        <form
          onSubmit={handleApplySubmit}
          style={{
            backgroundColor: "#fff",
            border: "1px solid #cbd5e1",
            borderRadius: "8px",
            padding: "20px",
            marginBottom: "24px",
          }}
        >
          <h3 style={{ margin: "0 0 8px 0", fontSize: "16px", color: "#0f172a" }}>
            Submit Application for {job.title}
          </h3>
          <p style={{ margin: "0 0 12px 0", fontSize: "13px", color: "#64748b" }}>
            Your candidate profile and uploaded resume will be included automatically. You may also include a cover letter below.
          </p>
          <textarea
            rows={4}
            placeholder="Write a brief cover letter or note to the hiring team (optional)..."
            value={coverLetter}
            onChange={(e) => setCoverLetter(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px",
              border: "1px solid #cbd5e1",
              borderRadius: "6px",
              marginBottom: "12px",
              fontSize: "14px",
            }}
          />
          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowApplyForm(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="teal" size="sm" loading={applying}>
              Confirm & Submit Application
            </Button>
          </div>
        </form>
      )}

      <div className="job-details__content">
        <div className="job-details__body">
          <div className="job-details__section">
            <h3>Job Description</h3>
            <p style={{ whiteSpace: "pre-line" }}>
              {job.description || "No detailed description provided."}
            </p>
          </div>

          {job.tags && job.tags.length > 0 && (
            <div className="job-details__section">
              <h3>Required Skills</h3>
              <ul>
                {job.tags.map((skill) => (
                  <li key={skill}>{skill}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="job-details__section">
            <h3>About {job.company}</h3>
            <p>
              {companyInfo.description ||
                `${job.company} is an employer in the ${companyInfo.industry || "technology"} sector located in ${companyInfo.location || job.location}.`}
            </p>
            {companyInfo.website && (
              <p style={{ marginTop: "8px" }}>
                Website:{" "}
                <a
                  href={companyInfo.website}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: "#0d9488", textDecoration: "underline" }}
                >
                  {companyInfo.website}
                </a>
              </p>
            )}
          </div>
        </div>

        <aside className="job-details__sidebar">
          <div className="job-summary__item">
            <span className="job-summary__label">Salary</span>
            <span className="job-summary__value">{job.salary}</span>
          </div>
          <div className="job-summary__item">
            <span className="job-summary__label">Job Type</span>
            <span className="job-summary__value">{job.type}</span>
          </div>
          <div className="job-summary__item">
            <span className="job-summary__label">Work Setup</span>
            <span className="job-summary__value">{job.setup}</span>
          </div>
          <div className="job-summary__item">
            <span className="job-summary__label">Industry</span>
            <span className="job-summary__value">{job.industry}</span>
          </div>
          <div className="job-summary__item">
            <span className="job-summary__label">Posted</span>
            <span className="job-summary__value">{job.postedDate}</span>
          </div>
          {job.deadline && (
            <div className="job-summary__item">
              <span className="job-summary__label">Deadline</span>
              <span className="job-summary__value">{job.deadline}</span>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}