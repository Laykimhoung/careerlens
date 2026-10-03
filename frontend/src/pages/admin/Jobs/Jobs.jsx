import { useState } from "react";
import { readStore, saveDemoCollection } from '../../../services/member3DemoStore';
import './Jobs.css';

const JOB_TYPES = ["Full-time", "Part-time", "Internship", "Contract", "Freelance"];
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
  const [skillsInput, setSkillsInput] = useState("");
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

  const openCreate = () => { setForm(BLANK); setSkillsInput(""); setModal({}); };
  const openEdit = (j) => { setForm({ title: j.title, co: j.co, loc: j.loc, type: j.type, work: j.work, salary: j.salary, cat: j.cat, desc: j.desc, status: j.status, skills: j.skills || [], dept: j.dept || "", deadline: j.deadline || "" }); setSkillsInput((j.skills || []).join(", ")); setModal(j); };

  const handleSave = (e) => {
    e.preventDefault();
    const skillsArr = skillsInput.split(",").map((s) => s.trim()).filter(Boolean);
    const data = { ...form, skills: skillsArr };
    if (modal.id) {
      saveJobs(jobs.map((j) => j.id === modal.id ? { ...j, ...data } : j));
    } else {
      const jid = "j" + Date.now().toString(36);
      saveJobs([...jobs, { id: jid, cid: "admin", ...data }]);
    }
    setModal(null);
  };

  const setStatus = (j, status) => saveJobs(jobs.map((item) => item.id === j.id ? { ...item, status } : item));
  const confirmDelete = () => { saveJobs(jobs.filter((j) => j.id !== deleteTarget.id)); setDeleteTarget(null); };

  const f = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const statusBadge = (s) => s === "Published" ? "workspace-status-success" : s === "Paused" ? "workspace-status-warning" : s === "Rejected" ? "workspace-status-danger" : "workspace-status";

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
          <form onSubmit={handleSave}>
            <div className="workspace-form-grid">
              <div className="workspace-field"><label>Job Title</label><input required value={form.title} onChange={f("title")} /></div>
              <div className="workspace-field"><label>Company Name</label><input required value={form.co} onChange={f("co")} /></div>
              <div className="workspace-field"><label>Location</label><input value={form.loc} onChange={f("loc")} /></div>
              <div className="workspace-field"><label>Salary</label><input value={form.salary} onChange={f("salary")} placeholder="e.g. $500-$800" /></div>
              <div className="workspace-field"><label>Type</label>
                <select value={form.type} onChange={f("type")}>{JOB_TYPES.map((t) => <option key={t}>{t}</option>)}</select>
              </div>
              <div className="workspace-field"><label>Work Mode</label>
                <select value={form.work} onChange={f("work")}>{WORK_MODES.map((w) => <option key={w}>{w}</option>)}</select>
              </div>
              <div className="workspace-field"><label>Category</label>
                <select value={form.cat} onChange={f("cat")}>
                  <option value="">Select category</option>
                  {cats.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="workspace-field"><label>Status</label>
                <select value={form.status} onChange={f("status")}>{STATUS_OPTS.map((s) => <option key={s}>{s}</option>)}</select>
              </div>
            </div>
            <div className="workspace-field"><label>Skills (comma-separated)</label><input value={skillsInput} onChange={(e) => setSkillsInput(e.target.value)} placeholder="e.g. JavaScript, SQL, Git" /></div>
            <div className="workspace-field"><label>Description</label><textarea value={form.desc} onChange={f("desc")} /></div>
            <div className="workspace-actions">
              <button type="submit" className="workspace-button workspace-button-primary">{modal.id ? "Save Changes" : "Create Job"}</button>
              <button type="button" className="workspace-button" onClick={() => setModal(null)}>Cancel</button>
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