import { useState, useEffect, useCallback } from "react";
import { extractResults } from "../../../services/api";
import {
  getAdminJobs,
  getAdminCompanies,
  createAdminJob,
  updateAdminJob,
  deleteAdminJob,
} from "../../../services/adminService";
import {
  normalizeJobRecord,
  toBackendEmploymentType,
  toBackendWorkplaceType,
} from "../../../services/jobService";
import "./Jobs.css";
import "../../../styles/adminForms.css";

const JOB_TYPES = ["Full-time", "Part-time", "Internship", "Contract"];
const WORK_MODES = ["On-site", "Remote", "Hybrid"];
const STATUS_OPTS = ["Published", "Draft", "Closed"];
const BLANK = {
  title: "",
  companyId: "",
  co: "",
  loc: "",
  type: "Full-time",
  work: "On-site",
  salaryMin: "",
  salaryMax: "",
  desc: "",
  status: "Published",
  skills: [],
  deadline: "",
};

function mapUiJobStatusToBackend(st) {
  const upper = String(st || "PUBLISHED").toUpperCase();
  if (upper === "DRAFT" || upper === "PAUSED") return "DRAFT";
  if (upper === "CLOSED" || upper === "REJECTED") return "CLOSED";
  return "PUBLISHED";
}

function Modal({ title, onClose, children }) {
  return (
    <div className="crud-overlay" onClick={onClose}>
      <div
        className="crud-modal"
        style={{ maxWidth: 640 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="crud-modal-header">
          <h2>{title}</h2>
          <button type="button" className="crud-close" onClick={onClose}>
            &times;
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [skillInput, setSkillInput] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [jobsRes, compsRes] = await Promise.all([
        getAdminJobs(),
        getAdminCompanies(),
      ]);
      const rawJobs = extractResults(jobsRes);
      const rawComps = extractResults(compsRes);
      setCompanies(rawComps);
      setJobs(
        rawJobs.map((j) => {
          const norm = normalizeJobRecord(j);
          return {
            ...norm,
            co: norm.companyName,
            loc: norm.location,
            work: norm.workMode,
            desc: norm.description,
          };
        })
      );
    } catch (err) {
      setError(
        err.response?.data?.detail || "Failed to load job listings from server."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = jobs.filter((j) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q || `${j.title} ${j.co} ${j.loc}`.toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || j.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const openCreate = () => {
    const defaultComp = companies[0];
    setForm({
      ...BLANK,
      companyId: defaultComp ? String(defaultComp.id) : "",
      co: defaultComp ? defaultComp.company_name : "",
      skills: [],
    });
    setSkillInput("");
    setModal({});
  };

  const openEdit = (j) => {
    setForm({
      title: j.title,
      companyId: j.companyId ? String(j.companyId) : "",
      co: j.co,
      loc: j.loc,
      type: j.type,
      work: j.work,
      salaryMin: j.salary_min || "",
      salaryMax: j.salary_max || "",
      desc: j.desc || "",
      status: j.status,
      skills: j.skills ? [...j.skills] : [],
      deadline: j.rawDeadline ? String(j.rawDeadline).slice(0, 10) : "",
    });
    setSkillInput("");
    setModal(j);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        title: form.title.trim(),
        company_id: form.companyId ? Number(form.companyId) : undefined,
        company_name: form.co?.trim() || undefined,
        location: form.loc.trim() || "Phnom Penh, Cambodia",
        employment_type: toBackendEmploymentType(form.type),
        workplace_type: toBackendWorkplaceType(form.work),
        status: mapUiJobStatusToBackend(form.status),
        salary_min: form.salaryMin ? Number(form.salaryMin) : null,
        salary_max: form.salaryMax ? Number(form.salaryMax) : null,
        description: form.desc.trim() || form.title.trim(),
        skills: form.skills || [],
      };
      if (form.deadline) {
        payload.deadline = new Date(`${form.deadline}T23:59:59Z`).toISOString();
      }

      if (modal.id) {
        await updateAdminJob(modal.id, payload);
      } else {
        await createAdminJob(payload);
      }
      setModal(null);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to save job listing.");
    } finally {
      setSaving(false);
    }
  };

  const setStatus = async (j, status) => {
    try {
      await updateAdminJob(j.id, { status: mapUiJobStatusToBackend(status) });
      await loadData();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to update job status.");
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteAdminJob(deleteTarget.id);
      setDeleteTarget(null);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to delete job.");
      setDeleteTarget(null);
    }
  };

  const f = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));
  const statusBadge = (s) =>
    s === "Published"
      ? "workspace-status-success"
      : s === "Draft"
      ? "workspace-status-warning"
      : "workspace-status-danger";

  const addSkill = () => {
    const trimmed = skillInput.trim();
    if (!trimmed) return;
    const skills = form.skills || [];
    if (skills.map((s) => s.toLowerCase()).includes(trimmed.toLowerCase())) {
      setSkillInput("");
      return;
    }
    setForm((prev) => ({ ...prev, skills: [...(prev.skills || []), trimmed] }));
    setSkillInput("");
  };
  const removeSkill = (idx) =>
    setForm((prev) => ({
      ...prev,
      skills: (prev.skills || []).filter((_, i) => i !== idx),
    }));
  const handleSkillKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addSkill();
    }
  };

  return (
    <section className="workspace-page">
      <div className="workspace-heading">
        <div>
          <h1>Job Management</h1>
          <p>Manage all job listings across all companies.</p>
        </div>
        <button
          className="workspace-button workspace-button-primary"
          onClick={openCreate}
        >
          + Add Job
        </button>
      </div>

      {error && (
        <div
          style={{
            padding: "12px 16px",
            marginBottom: "16px",
            borderRadius: "8px",
            background: "#FEF2F2",
            color: "#B91C1C",
            border: "1px solid #FECACA",
            fontSize: "14px",
          }}
        >
          {error}
        </div>
      )}

      <div className="workspace-toolbar">
        <input
          type="search"
          className="workspace-search"
          placeholder="Search by title or company..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="jobs-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Statuses</option>
          {STATUS_OPTS.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <span className="workspace-muted">
          {loading
            ? "Loading..."
            : `${filtered.length} job${filtered.length !== 1 ? "s" : ""}`}
        </span>
      </div>

      <div className="workspace-table-wrap">
        <table className="workspace-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Company</th>
              <th>Type</th>
              <th>Location</th>
              <th>Status</th>
              <th style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="workspace-empty">
                  Loading job listings from database...
                </td>
              </tr>
            ) : (
              <>
                {filtered.map((j) => (
                  <tr key={j.id}>
                    <td>
                      <strong>{j.title}</strong>
                    </td>
                    <td>{j.co}</td>
                    <td>{j.type}</td>
                    <td>{j.loc}</td>
                    <td>
                      <span className={`workspace-status ${statusBadge(j.status)}`}>
                        {j.status}
                      </span>
                    </td>
                    <td>
                      <div className="workspace-table-actions">
                        <button
                          type="button"
                          className="workspace-button"
                          onClick={() => openEdit(j)}
                        >
                          Edit
                        </button>
                        {j.status !== "Published" && (
                          <button
                            type="button"
                            className="workspace-button workspace-button-primary"
                            onClick={() => setStatus(j, "Published")}
                          >
                            Publish
                          </button>
                        )}
                        {j.status !== "Draft" && (
                          <button
                            type="button"
                            className="workspace-button"
                            onClick={() => setStatus(j, "Draft")}
                          >
                            Draft
                          </button>
                        )}
                        {j.status !== "Closed" && (
                          <button
                            type="button"
                            className="workspace-button"
                            onClick={() => setStatus(j, "Closed")}
                          >
                            Close
                          </button>
                        )}
                        <button
                          type="button"
                          className="workspace-button workspace-button-danger"
                          onClick={() => setDeleteTarget(j)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan="6" className="workspace-empty">
                      No jobs found.
                    </td>
                  </tr>
                )}
              </>
            )}
          </tbody>
        </table>
      </div>

      {modal !== null && (
        <Modal
          title={modal.id ? "Edit Job" : "Add New Job"}
          onClose={() => setModal(null)}
        >
          <form onSubmit={handleSave} className="admin-form">
            <p className="admin-form-section">Job Details</p>

            <div className="admin-form-grid">
              <div className="admin-field">
                <label className="admin-label">
                  Job Title <span className="admin-required">*</span>
                </label>
                <input
                  className="admin-input"
                  required
                  value={form.title}
                  onChange={f("title")}
                  placeholder="e.g. Software Engineer"
                />
              </div>

              <div className="admin-field">
                <label className="admin-label">
                  Company <span className="admin-required">*</span>
                </label>
                {companies.length > 0 ? (
                  <select
                    className="admin-input admin-select"
                    required
                    value={form.companyId}
                    onChange={(e) => {
                      const comp = companies.find(
                        (c) => String(c.id) === String(e.target.value)
                      );
                      setForm((prev) => ({
                        ...prev,
                        companyId: e.target.value,
                        co: comp?.company_name || prev.co,
                      }));
                    }}
                  >
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.company_name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    className="admin-input"
                    required
                    value={form.co}
                    onChange={f("co")}
                    placeholder="e.g. Acme Corp"
                  />
                )}
              </div>
            </div>

            <div className="admin-form-grid">
              <div className="admin-field">
                <label className="admin-label">Location</label>
                <input
                  className="admin-input"
                  value={form.loc}
                  onChange={f("loc")}
                  placeholder="e.g. Phnom Penh, Cambodia"
                />
              </div>
              <div className="admin-field">
                <label className="admin-label">Deadline</label>
                <input
                  type="date"
                  className="admin-input"
                  value={form.deadline}
                  onChange={f("deadline")}
                />
              </div>
              <div className="admin-field">
                <label className="admin-label">Min Salary (USD)</label>
                <input
                  type="number"
                  className="admin-input"
                  value={form.salaryMin}
                  onChange={f("salaryMin")}
                  placeholder="e.g. 800"
                />
              </div>
              <div className="admin-field">
                <label className="admin-label">Max Salary (USD)</label>
                <input
                  type="number"
                  className="admin-input"
                  value={form.salaryMax}
                  onChange={f("salaryMax")}
                  placeholder="e.g. 1500"
                />
              </div>
              <div className="admin-field">
                <label className="admin-label">Job Type</label>
                <select
                  className="admin-input admin-select"
                  value={form.type}
                  onChange={f("type")}
                >
                  {JOB_TYPES.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="admin-field">
                <label className="admin-label">Work Mode</label>
                <select
                  className="admin-input admin-select"
                  value={form.work}
                  onChange={f("work")}
                >
                  {WORK_MODES.map((w) => (
                    <option key={w}>{w}</option>
                  ))}
                </select>
              </div>
              <div className="admin-field">
                <label className="admin-label">Status</label>
                <select
                  className="admin-input admin-select"
                  value={form.status}
                  onChange={f("status")}
                >
                  {STATUS_OPTS.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="admin-field">
              <label className="admin-label">Required Skills</label>
              <div className="admin-skill-row">
                <input
                  className="admin-input admin-skill-input"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={handleSkillKeyDown}
                  placeholder="Enter a skill..."
                  maxLength={60}
                />
                <button
                  type="button"
                  className="admin-skill-btn"
                  onClick={addSkill}
                >
                  Add Skill
                </button>
              </div>
              {(form.skills || []).length > 0 && (
                <div className="admin-chips">
                  {(form.skills || []).map((skill, idx) => (
                    <span key={idx} className="admin-chip">
                      {skill}
                      <button
                        type="button"
                        className="admin-chip-remove"
                        onClick={() => removeSkill(idx)}
                        aria-label={`Remove ${skill}`}
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="admin-field">
              <label className="admin-label">Description</label>
              <textarea
                className="admin-input admin-textarea"
                value={form.desc}
                onChange={f("desc")}
                placeholder="Describe the role, responsibilities, and requirements..."
              />
            </div>

            <div className="admin-form-actions">
              <button
                type="button"
                className="workspace-button"
                onClick={() => setModal(null)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="workspace-button workspace-button-primary"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : modal.id
                  ? "Save Changes"
                  : "Create Job"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {deleteTarget && (
        <Modal title="Confirm Delete" onClose={() => setDeleteTarget(null)}>
          <p style={{ margin: "0 0 20px", color: "var(--color-text-secondary)" }}>
            Delete <strong>{deleteTarget.title}</strong>? This cannot be undone.
          </p>
          <div className="workspace-actions">
            <button
              type="button"
              className="workspace-button"
              onClick={() => setDeleteTarget(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="workspace-button workspace-button-danger"
              onClick={confirmDelete}
            >
              Yes, Delete
            </button>
          </div>
        </Modal>
      )}
    </section>
  );
}