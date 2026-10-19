import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../../context/LanguageContext";
import JobForm from "../../../components/company/JobForm";
import {
  createJob as createJobApi,
  toBackendEmploymentType,
  toBackendWorkplaceType,
  toBackendJobStatus,
} from "../../../services/jobService";
import "./CreateJob.css";

export default function CreateJob() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCreateJob = async (values) => {
    setLoading(true);
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
        status: toBackendJobStatus(values.status || "Published"),
        deadline: values.deadline ? `${values.deadline}T23:59:59Z` : null,
        skills: skillList,
      };

      await createJobApi(payload);
      navigate("/company/jobs");
    } catch (err) {
      const detail =
        err.response?.data?.detail ||
        Object.values(err.response?.data || {})?.[0] ||
        "Failed to create job posting.";
      setError(String(detail));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="workspace-page">
      <div className="workspace-heading">
        <div>
          <h1>{t("company.createJobTitle")}</h1>
          <p>{t("company.createJobSub")}</p>
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
        onSubmit={handleCreateJob}
        submitLabel={t("company.createJobPostingBtn")}
        loading={loading}
      />
    </section>
  );
}