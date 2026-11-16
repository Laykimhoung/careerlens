import { useLanguage } from "../../context/LanguageContext";
import Input from "../common/Input";
import Select from "../common/Select";
import Textarea from "../common/Textarea";
import Button from "../common/Button";
import "./JobForm.css";

export default function JobForm({
  initialJob = {},
  onSubmit,
  submitLabel,
  loading = false,
}) {
  const { t } = useLanguage();

  const handleSubmit = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const raw = Object.fromEntries(formData.entries());
    onSubmit?.(raw);
  };

  const initialSkills = Array.isArray(initialJob.skills)
    ? initialJob.skills.join(", ")
    : Array.isArray(initialJob.tags)
    ? initialJob.tags.join(", ")
    : initialJob.skills || "";

  const rawDeadlineSource = initialJob.rawDeadline || initialJob.deadline || "";
  const initialDeadline = /^\d{4}-\d{2}-\d{2}/.test(String(rawDeadlineSource))
    ? String(rawDeadlineSource).slice(0, 10)
    : "";

  return (
    <form className="workspace-panel company-job-form" onSubmit={handleSubmit}>
      <div className="job-form-grid">
        <Input
          id="title"
          name="title"
          label={t("company.jobTitleLabel")}
          defaultValue={initialJob.title || ""}
          placeholder={t("company.jobTitlePlaceholder")}
          required
        />
        <Input
          id="location"
          name="location"
          label={t("company.locationLabel")}
          defaultValue={initialJob.location || initialJob.loc || "Phnom Penh"}
          placeholder={t("company.locationPlaceholder")}
          required
        />
        <Select
          id="type"
          name="type"
          label={t("company.employmentTypeLabel")}
          defaultValue={initialJob.type || "Full-time"}
          options={["Full-time", "Part-time", "Contract", "Internship"]}
        />
        <Select
          id="setup"
          name="setup"
          label={t("company.workplaceTypeLabel")}
          defaultValue={initialJob.setup || "On-site"}
          options={["On-site", "Hybrid", "Remote"]}
        />
        <Input
          id="salary_min"
          name="salary_min"
          type="number"
          label={t("company.minSalaryLabel")}
          defaultValue={initialJob.salary_min ?? initialJob.salaryMin ?? ""}
          placeholder="e.g. 600"
        />
        <Input
          id="salary_max"
          name="salary_max"
          type="number"
          label={t("company.maxSalaryLabel")}
          defaultValue={initialJob.salary_max ?? initialJob.salaryMax ?? ""}
          placeholder="e.g. 1200"
        />
        <Select
          id="status"
          name="status"
          label={t("company.jobStatusLabel")}
          defaultValue={initialJob.status || "Published"}
          options={["Published", "Draft", "Closed"]}
        />
        <Input
          id="deadline"
          name="deadline"
          type="date"
          label={t("company.deadlineLabel")}
          defaultValue={initialDeadline}
        />
      </div>

      <Input
        id="skills"
        name="skills"
        label={t("company.skillsRequiredLabel")}
        defaultValue={initialSkills}
        placeholder="e.g. JavaScript, React, SQL, Git"
      />

      <Textarea
        id="description"
        name="description"
        label={t("company.jobDescriptionLabel")}
        defaultValue={initialJob.description || ""}
        rows={6}
        required
      />

      <div className="job-form-actions">
        <Button type="submit" variant="primary" loading={loading}>
          {submitLabel || t("common.save")}
        </Button>
      </div>
    </form>
  );
}