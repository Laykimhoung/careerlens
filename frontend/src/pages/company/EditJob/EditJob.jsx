import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
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
          <p className="workspace-muted">Loading job details...</p>
        </div>
      ) : job ? (
        <>
          <div className="workspace-heading">
            <div>
              <h1>Edit job</h1>
              <p>Update the role description and posting details.</p>
            </div>
          </div>
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
          <JobForm
            initialJob={job}
            onSubmit={handleUpdateJob}
            submitLabel="Save changes"
            loading={saving}
          />
        </>
      ) : (
        <div className="workspace-panel">
          <h1>Job not found</h1>
          <p className="workspace-muted">
            {error || "This role may have been removed."}
          </p>
          <Link className="workspace-button" to="/company/jobs">
            Back to jobs
          </Link>
        </div>
      )}
    </section>
  );
}