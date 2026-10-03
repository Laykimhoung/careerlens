import { useState } from "react";
import { readStore, saveDemoCollection } from "../../services/member3DemoStore";
import "./Applications.css";

const STATUS_FLOW = ["Applied", "Screening", "Shortlisted", "Interviewing", "Offered", "Rejected"];
const BLANK_APP = { jid: "", sid: "", status: "Applied", cover: "", date: "", notes: "" };

function Modal({ title, onClose, children }) {
  return (
    <div className="crud-overlay" onClick={onClose}>
      <div className="crud-modal" onClick={(e) => e.stopPropagation()}>
        <div className="crud-modal-header">
          <h2>{title}</h2>
          <button type="button" className="crud-close" onClick={onClose}>&times;</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function Applications() {
  const [store, setStore] = useState(() => readStore());
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(BLANK_APP);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const apps  = store.apps  || [];
  const users = store.users || [];
  const jobs  = store.jobs  || [];

  const candidates = users.filter((u) => u.role === "student" || u.role === "candidate");

  const display = apps.map((a) => {
    const student = users.find((u) => u.id === a.sid) || {};
    const job     = jobs.find((j)  => j.id === a.jid) || {};
    return { ...a, studentName: student.name || "Unknown", jobTitle: job.title || "Unknown Job", companyName: job.co || "—" };
  }).filter((a) => {
    const q = search.toLowerCase();
    const matchSearch = !q || `${a.studentName} ${a.jobTitle}`.toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const saveApps = (next) => { saveDemoCollection("apps", next); setStore((s) => ({ ...s, apps: next })); };

  const openCreate = () => { setForm({ ...BLANK_APP, date: new Date().toISOString().slice(0, 10) }); setModal({}); };
  const openEdit   = (a) => { setForm({ jid: a.jid, sid: a.sid, status: a.status, cover: a.cover || "", date: a.date || "", notes: a.notes || "" }); setModal(a); };

  const handleSave = (e) => {
    e.preventDefault();
    if (modal.id) {
      saveApps(apps.map((a) => a.id === modal.id ? { ...a, ...form } : a));
    } else {
      const aid = "a" + Date.now().toString(36);
      saveApps([...apps, { id: aid, hist: [["Applied", form.date]], ...form }]);
    }
    setModal(null);
  };

  const changeStatus = (id, status) => saveApps(apps.map((a) => a.id === id ? { ...a, status } : a));
  const confirmDelete = () => { saveApps(apps.filter((a) => a.id !== deleteTarget.id)); setDeleteTarget(null); };
  const f = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const statusBadge = (s) => s === "Applied" ? "" : s === "Offered" ? "workspace-status-success" : s === "Rejected" ? "workspace-status-danger" : "workspace-status-warning";

  return (
    <section className="workspace-page">
      <div className="workspace-heading">
        <div><h1>All Applications</h1><p>Monitor and manage every application across the platform.</p></div>
        <button className="workspace-button workspace-button-primary" onClick={openCreate}>+ Add Application</button>
      </div>

      <div className="workspace-toolbar">
        <input type="search" className="workspace-search" placeholder="Search by candidate or job..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ marginBottom: 0, width: 280 }} />
        <select className="apps-filter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All Statuses</option>
          {STATUS_FLOW.map((s) => <option key={s}>{s}</option>)}
        </select>
        <span className="workspace-muted">{display.length} application{display.length !== 1 ? "s" : ""}</span>
      </div>

      <div className="workspace-table-wrap">
        <table className="workspace-table">
          <thead><tr><th>Candidate</th><th>Job</th><th>Company</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
          <tbody>
            {display.map((a) => (
              <tr key={a.id}>
                <td><strong>{a.studentName}</strong></td>
                <td>{a.jobTitle}</td>
                <td>{a.companyName}</td>
                <td>
                  <select className="apps-status-select" value={a.status} onChange={(e) => changeStatus(a.id, e.target.value)}>
                    {STATUS_FLOW.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </td>
                <td style={{ color: "#6b7280" }}>{a.date ? a.date.split(" ")[0] : "—"}</td>
                <td>
                  <div className="workspace-table-actions">
                    <button type="button" className="workspace-button" onClick={() => openEdit(a)}>Edit</button>
                    <button type="button" className="workspace-button workspace-button-danger" onClick={() => setDeleteTarget(a)} style={{ padding: "4px 8px", minHeight: "auto", fontSize: "11px" }}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {display.length === 0 && <tr><td colSpan="6" className="workspace-empty">No applications found.</td></tr>}
          </tbody>
        </table>
      </div>

      {modal !== null && (
        <Modal title={modal.id ? "Edit Application" : "Add Application"} onClose={() => setModal(null)}>
          <form onSubmit={handleSave}>
            <div className="workspace-field"><label>Candidate</label>
              <select required value={form.sid} onChange={f("sid")}>
                <option value="">Select candidate...</option>
                {candidates.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="workspace-field"><label>Job</label>
              <select required value={form.jid} onChange={f("jid")}>
                <option value="">Select job...</option>
                {jobs.map((j) => <option key={j.id} value={j.id}>{j.title} — {j.co}</option>)}
              </select>
            </div>
            <div className="workspace-field"><label>Status</label>
              <select value={form.status} onChange={f("status")}>{STATUS_FLOW.map((s) => <option key={s}>{s}</option>)}</select>
            </div>
            <div className="workspace-field"><label>Date Applied</label><input type="date" value={form.date} onChange={f("date")} /></div>
            <div className="workspace-field"><label>Cover Note</label><textarea value={form.cover} onChange={f("cover")} /></div>
            <div className="workspace-actions">
              <button type="submit" className="workspace-button workspace-button-primary">{modal.id ? "Save Changes" : "Create Application"}</button>
              <button type="button" className="workspace-button" onClick={() => setModal(null)}>Cancel</button>
            </div>
          </form>
        </Modal>
      )}

      {deleteTarget && (
        <Modal title="Confirm Delete" onClose={() => setDeleteTarget(null)}>
          <p style={{ margin: "0 0 20px", color: "#374151" }}>Delete application by <strong>{deleteTarget.studentName}</strong> for <strong>{deleteTarget.jobTitle}</strong>?</p>
          <div className="workspace-actions">
            <button type="button" className="workspace-button workspace-button-danger" onClick={confirmDelete}>Yes, Delete</button>
            <button type="button" className="workspace-button" onClick={() => setDeleteTarget(null)}>Cancel</button>
          </div>
        </Modal>
      )}
    </section>
  );
}
