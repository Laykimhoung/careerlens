import { useState } from "react";
import { readStore, saveDemoCollection } from '../../../services/member3DemoStore';
import './Companies.css';
import '../../../styles/adminForms.css';

const BLANK = { name: "", email: "", ind: "", loc: "", verified: "Pending Verification", status: "Active" };

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

export default function Companies() {
  const [store, setStore] = useState(() => readStore());
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const users = store.users || [];
  const companies = users.filter((u) => u.role === "company");

  const filtered = companies.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch = !q || `${c.name} ${c.email}`.toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || c.verified === statusFilter;
    return matchSearch && matchStatus;
  });

  const saveUsers = (next) => { saveDemoCollection("users", next); setStore((s) => ({ ...s, users: next })); };

  const openCreate = () => { setForm(BLANK); setModal({}); };
  const openEdit = (c) => {
    setForm({
      name: c.name,
      email: c.email,
      ind: c.ind || "",
      loc: c.loc || "",
      verified: c.verified || "Pending Verification",
      status: c.status || "Active",
    });
    setModal(c);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (modal.id) {
      saveUsers(users.map((u) => u.id === modal.id ? { ...u, ...form } : u));
    } else {
      const uid = "co" + Date.now().toString(36);
      saveUsers([...users, { id: uid, role: "company", pw: "company123", ...form }]);
    }
    setModal(null);
  };

  const setVerification = (c, verified) => saveUsers(users.map((u) => u.id === c.id ? { ...u, verified } : u));
  const confirmDelete = () => { saveUsers(users.filter((u) => u.id !== deleteTarget.id)); setDeleteTarget(null); };
  const f = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));
  const badgeClass = (v) => v === "Verified" ? "workspace-status-success" : v === "Pending Verification" ? "workspace-status-warning" : "workspace-status-danger";

  return (
    <section className="workspace-page">
      <div className="workspace-heading">
        <div><h1>Company Management</h1><p>Create, review and manage company accounts.</p></div>
        <button className="workspace-button workspace-button-primary" onClick={openCreate}>+ Add Company</button>
      </div>

      <div className="workspace-toolbar">
        <input type="search" className="workspace-search" placeholder="Search companies..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ marginBottom: 0, width: 280 }} />
        <select className="companies-filter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All Statuses</option>
          <option value="Verified">Verified</option>
          <option value="Pending Verification">Pending</option>
          <option value="Rejected">Rejected</option>
          <option value="Suspended">Suspended</option>
        </select>
        <span className="workspace-muted">{filtered.length} compan{filtered.length !== 1 ? "ies" : "y"}</span>
      </div>

      <div className="workspace-table-wrap">
        <table className="workspace-table">
          <thead><tr><th>Company Name</th><th>Email</th><th>Industry</th><th>Location</th><th>Verification</th><th>Actions</th></tr></thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id}>
                <td><strong>{c.name}</strong></td>
                <td>{c.email}</td>
                <td>{c.ind || "—"}</td>
                <td>{c.loc || "—"}</td>
                <td><span className={`workspace-status ${badgeClass(c.verified)}`}>{c.verified || "Pending Verification"}</span></td>
                <td>
                  <div className="workspace-table-actions">
                    <button type="button" className="workspace-button" onClick={() => openEdit(c)}>Edit</button>
                    {c.verified !== "Verified" && <button type="button" className="workspace-button workspace-button-primary" onClick={() => setVerification(c, "Verified")}>Verify</button>}
                    {c.verified !== "Rejected" && <button type="button" className="workspace-button" onClick={() => setVerification(c, "Rejected")}>Reject</button>}
                    {c.verified !== "Suspended" && <button type="button" className="workspace-button" onClick={() => setVerification(c, "Suspended")}>Suspend</button>}
                    <button type="button" className="workspace-button workspace-button-danger" onClick={() => setDeleteTarget(c)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan="6" className="workspace-empty">No companies found.</td></tr>}
          </tbody>
        </table>
      </div>

      {modal !== null && (
        <Modal title={modal.id ? "Edit Company" : "Add Company"} onClose={() => setModal(null)}>
          <form onSubmit={handleSave} className="admin-form">
            <p className="admin-form-section">Company Information</p>

            <div className="admin-field">
              <label className="admin-label">Company Name <span className="admin-required">*</span></label>
              <input className="admin-input" required value={form.name} onChange={f("name")} placeholder="e.g. Acme Corp" />
            </div>

            <div className="admin-field">
              <label className="admin-label">Email <span className="admin-required">*</span></label>
              <input className="admin-input" type="email" required value={form.email} onChange={f("email")} placeholder="e.g. contact@acme.com" />
            </div>

            <div className="admin-field">
              <label className="admin-label">Industry</label>
              <input className="admin-input" value={form.ind} onChange={f("ind")} placeholder="e.g. Technology" />
            </div>

            <div className="admin-field">
              <label className="admin-label">Location</label>
              <input className="admin-input" value={form.loc} onChange={f("loc")} placeholder="e.g. Phnom Penh" />
            </div>

            <div className="admin-field">
              <label className="admin-label">Verification Status</label>
              <select className="admin-input admin-select" value={form.verified} onChange={f("verified")}>
                <option>Pending Verification</option>
                <option>Verified</option>
                <option>Rejected</option>
                <option>Suspended</option>
              </select>
            </div>

            <div className="admin-form-actions">
              <button type="button" className="workspace-button" onClick={() => setModal(null)}>Cancel</button>
              <button type="submit" className="workspace-button workspace-button-primary">
                {modal.id ? "Save Changes" : "Create Company"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {deleteTarget && (
        <Modal title="Confirm Delete" onClose={() => setDeleteTarget(null)}>
          <p style={{ margin: "0 0 20px", color: "#374151" }}>Delete <strong>{deleteTarget.name}</strong>? This cannot be undone.</p>
          <div className="workspace-actions">
            <button type="button" className="workspace-button workspace-button-danger" onClick={confirmDelete}>Yes, Delete</button>
            <button type="button" className="workspace-button" onClick={() => setDeleteTarget(null)}>Cancel</button>
          </div>
        </Modal>
      )}
    </section>
  );
}