import Input from "../common/Input";
import Select from "../common/Select";
import Textarea from "../common/Textarea";
import Button from "../common/Button";
import "./JobForm.css";

export default function JobForm({
  initialJob = {},
  onSubmit,
  submitLabel = "Save job",
  loading = false,
}) {
  const handleSubmit = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const raw = Object.fromEntries(formData.entries());
    onSubmit?.(raw);
  };

  const initialSkills = Array.isArray(initialJob.tags)
    ? initialJob.tags.join(", ")
    : Array.isArray(initialJob.skills)
    ? initialJob.skills.join(", ")
    : initialJob.skills || "";

  return (
    <form className="workspace-panel company-job-form" onSubmit={handleSubmit}>
      <div className="job-form-grid">
        <Input
          id="title"
          name="title"
          label="Job title"
          defaultValue={initialJob.title || ""}
          required
        />
        <Input
          id="location"
          name="location"
          label="Location"
          defaultValue={initialJob.location || initialJob.loc || "Phnom Penh"}
          required
        />
        <Select
          id="type"
          name="type"
          label="Employment type"
          defaultValue={initialJob.type || "Full-time"}
          options={["Full-time", "Part-time", "Contract", "Internship"]}
        />
        <Select
          id="setup"
          name="setup"
          label="Workplace setup"
          defaultValue={initialJob.setup || "On-site"}
          options={["On-site", "Hybrid", "Remote"]}
        />
        <Input
          id="salary_min"
          name="salary_min"
          type="number"
          label="Minimum salary (USD)"
          defaultValue={initialJob.salaryMin ?? ""}
          placeholder="e.g. 600"
        />
        <Input
          id="salary_max"
          name="salary_max"
          type="number"
          label="Maximum salary (USD)"
          defaultValue={initialJob.salaryMax ?? ""}
          placeholder="e.g. 1200"
        />
        <Select
          id="status"
          name="status"
          label="Posting status"
          defaultValue={initialJob.status || "Published"}
          options={["Published", "Draft", "Closed"]}
        />
        <Input
          id="deadline"
          name="deadline"
          type="date"
          label="Application deadline"
          defaultValue={initialJob.deadline || ""}
        />
      </div>

      <Input
        id="skills"
        name="skills"
        label="Required skills (comma-separated)"
        defaultValue={initialSkills}
        placeholder="e.g. JavaScript, React, SQL, Git"
      />

      <Textarea
        id="description"
        name="description"
        label="Role description & requirements"
        defaultValue={initialJob.description || ""}
        rows={6}
        required
      />

      <div className="job-form-actions">
        <Button type="submit" variant="primary" loading={loading}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}