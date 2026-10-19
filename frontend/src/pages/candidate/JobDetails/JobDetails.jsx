import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { useLanguage } from "../../../context/LanguageContext";
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
  const { t } = useLanguage();

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
        <div style={{ padding: "40px", textAlign: "center", color: "var(--color-text-secondary, #64748b)" }}>
          {t("common.loading")}
        </div>
      </div>
    );
  }

  if (!job || error) {
    return (
      <div className="job-details-page">
        <div className="job-not-found">
          <h2>{t("candidate.jobNotFound")}</h2>
          <p style={{ marginBottom: "24px", color: "var(--color-text-secondary, #6b7280)" }}>
            {error || t("candidate.jobNotFoundDesc")}
          </p>
          <Link to="/candidate/jobs">
            <Button variant="primary">{t("candidate.backToJobs")}</Button>
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
        text: err.response?.data?.detail || t("common.error"),
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
        text: t("common.success"),
      });
    } catch (err) {
      setStatusMsg({
        type: "error",
        text: err.response?.data?.detail || t("common.error"),
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
        {t("candidate.backToJobs")}
      </Link>

      {statusMsg.text && (
        <div
          style={{
            marginBottom: "16px",
            padding: "12px 16px",
            borderRadius: "8px",
            backgroundColor: statusMsg.type === "error" ? "rgba(239, 68, 68, 0.15)" : "rgba(16, 185, 129, 0.15)",
            color: statusMsg.type === "error" ? "#ef4444" : "#10b981",
            border: `1px solid ${statusMsg.type === "error" ? "rgba(239, 68, 68, 0.3)" : "rgba(16, 185, 129, 0.3)"}`,
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
            {isSaved ? `✓ ${t("candidate.saved")}` : t("candidate.saveJob")}
          </Button>
          {isApplied ? (
            <Link to={`/candidate/applications/${existingApplication.id}`}>
              <Button variant="primary">✓ {t("candidate.applied")}</Button>
            </Link>
          ) : (
            <Button
              variant="primary"
              onClick={() => setShowApplyForm((prev) => !prev)}
              disabled={applying}
            >
              {t("candidate.applyNow")}
            </Button>
          )}
        </div>
      </div>

      {showApplyForm && !isApplied && (
        <form
          onSubmit={handleApplySubmit}
          style={{
            backgroundColor: "var(--color-surface, #fff)",
            border: "1px solid var(--color-border, #cbd5e1)",
            borderRadius: "8px",
            padding: "20px",
            marginBottom: "24px",
          }}
        >
          <h3 style={{ margin: "0 0 8px 0", fontSize: "16px", color: "var(--color-text, #0f172a)" }}>
            {t("candidate.submitApplicationFor")} {job.title}
          </h3>
          <p style={{ margin: "0 0 12px 0", fontSize: "13px", color: "var(--color-text-secondary, #64748b)" }}>
            {t("candidate.submitApplicationDesc")}
          </p>
          <textarea
            rows={4}
            placeholder={t("candidate.coverLetterPlaceholder")}
            value={coverLetter}
            onChange={(e) => setCoverLetter(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px",
              border: "1px solid var(--color-border, #cbd5e1)",
              backgroundColor: "var(--color-background, #fff)",
              color: "var(--color-text, #0f172a)",
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
              {t("common.cancel")}
            </Button>
            <Button type="submit" variant="primary" size="sm" loading={applying}>
              {t("candidate.confirmSubmit")}
            </Button>
          </div>
        </form>
      )}

      <div className="job-details__content">
        <div className="job-details__body">
          <div className="job-details__section">
            <h3>{t("candidate.jobDescription")}</h3>
            <p style={{ whiteSpace: "pre-line" }}>
              {job.description || t("common.noData")}
            </p>
          </div>

          {job.tags && job.tags.length > 0 && (
            <div className="job-details__section">
              <h3>{t("candidate.skillsLabel")}</h3>
              <ul>
                {job.tags.map((skill) => (
                  <li key={skill}>{skill}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="job-details__section">
            <h3>{t("candidate.aboutCompany")} {job.company}</h3>
            <p>
              {companyInfo.description ||
                `${job.company} is an employer in the ${companyInfo.industry || "technology"} sector located in ${companyInfo.location || job.location}.`}
            </p>
            {companyInfo.website && (
              <p style={{ marginTop: "8px" }}>
                {t("company.website")}:{" "}
                <a
                  href={companyInfo.website}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: "var(--color-primary, #016BFB)", textDecoration: "underline" }}
                >
                  {companyInfo.website}
                </a>
              </p>
            )}
          </div>
        </div>

        <aside className="job-details__sidebar">
          <div className="job-summary__item">
            <span className="job-summary__label">{t("candidate.salary")}</span>
            <span className="job-summary__value">{job.salary}</span>
          </div>
          <div className="job-summary__item">
            <span className="job-summary__label">{t("candidate.jobType")}</span>
            <span className="job-summary__value">{job.type}</span>
          </div>
          <div className="job-summary__item">
            <span className="job-summary__label">{t("candidate.workplaceFilter")}</span>
            <span className="job-summary__value">{job.setup}</span>
          </div>
          <div className="job-summary__item">
            <span className="job-summary__label">{t("candidate.industryFilter")}</span>
            <span className="job-summary__value">{job.industry}</span>
          </div>
          <div className="job-summary__item">
            <span className="job-summary__label">{t("candidate.postedOn")}</span>
            <span className="job-summary__value">{job.postedDate}</span>
          </div>
          {job.deadline && (
            <div className="job-summary__item">
              <span className="job-summary__label">{t("candidate.deadline")}</span>
              <span className="job-summary__value">{job.deadline}</span>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}