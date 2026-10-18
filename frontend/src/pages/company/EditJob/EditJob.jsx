import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useLanguage } from "../../../context/LanguageContext";
import JobForm from "../../../components/company/JobForm";
import {
  getJobById,
  updateJob as updateJobApi,
  normalizeJobRecord,
  toBackendEmploymentType,
  toBackendWorkplaceType,
  toBackendJobStatus,
} from "../../../services/jobService";
import "./EditJob.css";

export default function EditJob() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadJob = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getJobById(id);
      setJob(normalizeJobRecord(res.data));
    } catch (err) {
      setError(err.response?.data?.detail || "Job not found.");
      setJob(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadJob();
  }, [loadJob]);

  const handleUpdateJob = async (values) => {
    setSaving(true);
    setError("");
    try {
      const skillList = (values.skills || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const payload = {
        title: values.title.trim(),
        description: values.description.trim(),
        location: values.location.trim(),
        employment_type: toBackendEmploymentType(values.type),
        workplace_type: toBackendWorkplaceType(values.setup),
        salary_min: values.salary_min ? Number(values.salary_min) : null,
        salary_max: values.salary_max ? Number(values.salary_max) : null,
        status: toBackendJobStatus(values.status),
        deadline: values.deadline ? `${values.deadline}T23:59:59Z` : null,
        skills: skillList,
      };

      await updateJobApi(id, payload);
      navigate("/company/jobs");
    } catch (err) {
      const detail =
        err.response?.data?.detail ||
        Object.values(err.response?.data || {})?.[0] ||
        "Failed to update job posting.";
      setError(String(detail));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="workspace-page">
      {loading ? (
        <div className="workspace-panel">
          <p className="workspace-muted">{t("common.loading")}</p>
        </div>
      ) : job ? (
        <>
          <div className="workspace-heading">
            <div>
              <h1>{t("company.editJobTitle")}</h1>
              <p>{t("company.editJobSub")}</p>
            </div>
          </div>
          {error && (
            <div
              style={{
                padding: "12px 16px",
                backgroundColor: "rgba(239, 68, 68, 0.15)",
                color: "#ef4444",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                borderRadius: "8px",
                marginBottom: "16px",
              }}
            >
              {error}
            </div>
          )}
          <JobForm
            initialJob={job}
            onSubmit={handleUpdateJob}
            submitLabel={t("company.updateJobPostingBtn")}
            loading={saving}
          />
        </>
      ) : (
        <div className="workspace-panel">
          <h1>{t("candidate.jobNotFound")}</h1>
          <p className="workspace-muted">
            {error || t("candidate.jobNotFoundDesc")}
          </p>
          <Link className="workspace-button" to="/company/jobs">
            {t("company.manageJobs")}
          </Link>
        </div>
      )}
    </section>
  );
}