import { useState } from "react";
import { readStore, saveDemoCollection } from '../../../services/member3DemoStore';
import './Jobs.css';
import '../../../styles/adminForms.css';

const JOB_TYPES  = ["Full-time", "Part-time", "Internship", "Contract", "Freelance"];
const WORK_MODES = ["On-site", "Remote", "Hybrid"];
const STATUS_OPTS = ["Published", "Draft", "Paused", "Rejected"];
const BLANK = { title: "", co: "", loc: "", type: "Full-time", work: "On-site", salary: "", cat: "", desc: "", status: "Published", skills: [], dept: "", deadline: "" };

function Modal({ title, onClose, children }) {
  return (
    <div className="crud-overlay" onClick={onClose}>
      <div className="crud-modal" style={{ maxWidth: 640 }} onClick={(e) => e.stopPropagation()}>
        <div className="crud-modal-header">
          <h2>{title}</h2>
          <button type="button" className="crud-close" onClick={onClose}>&times;</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function Jobs() {
  const [store, setStore] = useState(() => readStore());
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [skillInput, setSkillInput] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

  const jobs = store.jobs || [];
  const cats = store.cats || [];

  const filtered = jobs.filter((j) => {
    const q = search.toLowerCase();
    const matchSearch = !q || `${j.title} ${j.co}`.toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || j.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const saveJobs = (next) => { saveDemoCollection("jobs", next); setStore((s) => ({ ...s, jobs: next })); };

  const openCreate = () => { setForm({ ...BLANK, skills: [] }); setSkillInput(""); setModal({}); };
  const openEdit = (j) => {
    setForm({
      title: j.title, co: j.co, loc: j.loc, type: j.type, work: j.work,
      salary: j.salary, cat: j.cat, desc: j.desc, status: j.status,
      skills: j.skills ? [...j.skills] : [],
      dept: j.dept || "", deadline: j.deadline || "",
    });
    setSkillInput("");
    setModal(j);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (modal.id) {
      saveJobs(jobs.map((j) => j.id === modal.id ? { ...j, ...form } : j));
    } else {
      const jid = "j" + Date.now().toString(36);
      saveJobs([...jobs, { id: jid, cid: "admin", ...form }]);
    }
    setModal(null);
  };

  const setStatus = (j, status) => saveJobs(jobs.map((item) => item.id === j.id ? { ...item, status } : item));
  const confirmDelete = () => { saveJobs(jobs.filter((j) => j.id !== deleteTarget.id)); setDeleteTarget(null); };
  const f = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));
  const statusBadge = (s) => s === "Published" ? "workspace-status-success" : s === "Paused" ? "workspace-status-warning" : s === "Rejected" ? "workspace-status-danger" : "workspace-status";

  // Skill chip handlers
  const addSkill = () => {
    const trimmed = skillInput.trim();
    if (!trimmed) return;
    const skills = form.skills || [];
    if (skills.map((s) => s.toLowerCase()).includes(trimmed.toLowerCase())) { setSkillInput(""); return; }
    setForm((prev) => ({ ...prev, skills: [...(prev.skills || []), trimmed] }));
    setSkillInput("");
  };
  const removeSkill = (idx) => setForm((prev) => ({ ...prev, skills: (prev.skills || []).filter((_, i) => i !== idx) }));
  const handleSkillKeyDown = (e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } };

  return (
    <section className="workspace-page">
      <div className="workspace-heading">
        <div><h1>Job Management</h1><p>Manage all job listings across all companies.</p></div>
        <button className="workspace-button workspace-button-primary" onClick={openCreate}>+ Add Job</button>
      </div>

      <div className="workspace-toolbar">
        <input type="search" className="workspace-search" placeholder="Search by title or company..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ marginBottom: 0, width: 280 }} />
        <select className="jobs-filter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All Statuses</option>
          {STATUS_OPTS.map((s) => <option key={s}>{s}</option>)}
        </select>
        <span className="workspace-muted">{filtered.length} job{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      <div className="workspace-table-wrap">
        <table className="workspace-table">
          <thead><tr><th>Title</th><th>Company</th><th>Type</th><th>Location</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {filtered.map((j) => (
              <tr key={j.id}>
                <td><strong>{j.title}</strong></td>
                <td>{j.co}</td>
                <td>{j.type}</td>
                <td>{j.loc}</td>
                <td><span className={`workspace-status ${statusBadge(j.status)}`}>{j.status}</span></td>
                <td>
                  <div className="workspace-table-actions">
                    <button type="button" className="workspace-button" onClick={() => openEdit(j)}>Edit</button>
                    {j.status !== "Published" && <button type="button" className="workspace-button workspace-button-primary" onClick={() => setStatus(j, "Published")}>Publish</button>}
                    {j.status !== "Paused" && <button type="button" className="workspace-button" onClick={() => setStatus(j, "Paused")}>Pause</button>}
                    {j.status !== "Rejected" && <button type="button" className="workspace-button" onClick={() => setStatus(j, "Rejected")}>Reject</button>}
                    <button type="button" className="workspace-button workspace-button-danger" onClick={() => setDeleteTarget(j)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan="6" className="workspace-empty">No jobs found.</td></tr>}
          </tbody>
        </table>
      </div>

      {modal !== null && (
        <Modal title={modal.id ? "Edit Job" : "Add New Job"} onClose={() => setModal(null)}>
          <form onSubmit={handleSave} className="admin-form">
            <p className="admin-form-section">Job Details</p>

            <div className="admin-field">
              <label className="admin-label">Job Title <span className="admin-required">*</span></label>
              <input className="admin-input" required value={form.title} onChange={f("title")} placeholder="e.g. Software Engineer" />
            </div>

            <div className="admin-field">
              <label className="admin-label">Company Name <span className="admin-required">*</span></label>
              <input className="admin-input" required value={form.co} onChange={f("co")} placeholder="e.g. Acme Corp" />
            </div>

            <div className="admin-form-grid">
              <div className="admin-field">
                <label className="admin-label">Location</label>
                <input className="admin-input" value={form.loc} onChange={f("loc")} placeholder="e.g. Phnom Penh" />
              </div>
              <div className="admin-field">
                <label className="admin-label">Salary</label>
                <input className="admin-input" value={form.salary} onChange={f("salary")} placeholder="e.g. $500–$800" />
              </div>
              <div className="admin-field">
                <label className="admin-label">Job Type</label>
                <select className="admin-input admin-select" value={form.type} onChange={f("type")}>
                  {JOB_TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="admin-field">
                <label className="admin-label">Work Mode</label>
                <select className="admin-input admin-select" value={form.work} onChange={f("work")}>
                  {WORK_MODES.map((w) => <option key={w}>{w}</option>)}
                </select>
              </div>
              <div className="admin-field">
                <label className="admin-label">Category</label>
                <select className="admin-input admin-select" value={form.cat} onChange={f("cat")}>
                  <option value="">Select category</option>
                  {cats.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="admin-field">
                <label className="admin-label">Status</label>
                <select className="admin-input admin-select" value={form.status} onChange={f("status")}>
                  {STATUS_OPTS.map((s) => <option key={s}>{s}</option>)}
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
                <button type="button" className="admin-skill-btn" onClick={addSkill}>
                  Add Skill
                </button>
              </div>
              {(form.skills || []).length > 0 && (
                <div className="admin-chips">
                  {(form.skills || []).map((skill, idx) => (
                    <span key={idx} className="admin-chip">
                      {skill}
                      <button type="button" className="admin-chip-remove" onClick={() => removeSkill(idx)} aria-label={`Remove ${skill}`}>&times;</button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="admin-field">
              <label className="admin-label">Description</label>
              <textarea className="admin-input admin-textarea" value={form.desc} onChange={f("desc")} placeholder="Describe the role, responsibilities, and requirements..." />
            </div>

            <div className="admin-form-actions">
              <button type="button" className="workspace-button" onClick={() => setModal(null)}>Cancel</button>
              <button type="submit" className="workspace-button workspace-button-primary">
                {modal.id ? "Save Changes" : "Create Job"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {deleteTarget && (
        <Modal title="Confirm Delete" onClose={() => setDeleteTarget(null)}>
          <p style={{ margin: "0 0 20px", color: "#374151" }}>Delete <strong>{deleteTarget.title}</strong>? This cannot be undone.</p>
          <div className="workspace-actions">
            <button type="button" className="workspace-button workspace-button-danger" onClick={confirmDelete}>Yes, Delete</button>
            <button type="button" className="workspace-button" onClick={() => setDeleteTarget(null)}>Cancel</button>
          </div>
        </Modal>
      )}
    </section>
  );
}