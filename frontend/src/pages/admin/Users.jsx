import { useState } from "react";
import { readStore, saveDemoCollection } from "../../services/member3DemoStore";
import "./Users.css";

const ROLES = ["student", "company", "admin"];
const BLANK = { name: "", email: "", role: "student", status: "Active", pw: "demo123" };

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

export default function Users() {
  const [store, setStore] = useState(() => readStore());
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [modalUser, setModalUser] = useState(null); // null=closed, {}=create, user=edit
  const [form, setForm] = useState(BLANK);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const users = store.users || [];
  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch = !q || `${u.name} ${u.email}`.toLowerCase().includes(q);
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const saveUsers = (next) => { saveDemoCollection("users", next); setStore((s) => ({ ...s, users: next })); };

  const openCreate = () => { setForm(BLANK); setModalUser({}); };
  const openEdit   = (u) => { setForm({ name: u.name, email: u.email, role: u.role, status: u.status, pw: u.pw || "" }); setModalUser(u); };

  const handleSave = (e) => {
    e.preventDefault();
    if (modalUser.id) {
      saveUsers(users.map((u) => u.id === modalUser.id ? { ...u, ...form } : u));
    } else {
      const uid = "u" + Date.now().toString(36);
      saveUsers([...users, { id: uid, ...form }]);
    }
    setModalUser(null);
  };

  const toggleStatus = (u) => saveUsers(users.map((item) => item.id === u.id ? { ...item, status: item.status === "Active" ? "Suspended" : "Active" } : item));
  const confirmDelete = () => { saveUsers(users.filter((u) => u.id !== deleteTarget.id)); setDeleteTarget(null); };

  const f = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  return (
    <section className="workspace-page">
      <div className="workspace-heading">
        <div><h1>User Management</h1><p>Create, edit and manage platform user accounts.</p></div>
        <button className="workspace-button workspace-button-primary" onClick={openCreate}>+ Add User</button>
      </div>

      <div className="workspace-toolbar">
        <input type="search" className="workspace-search" placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ marginBottom: 0, width: 300 }} />
        <select className="users-filter" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="all">All Roles</option>
          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <span className="workspace-muted">{filtered.length} user{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      <div className="workspace-table-wrap">
        <table className="workspace-table">
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id}>
                <td><strong>{u.name}</strong></td>
                <td>{u.email}</td>
                <td><span className={`user-role-badge ${u.role}`}>{u.role}</span></td>
                <td><span className={`workspace-status ${u.status === "Active" ? "workspace-status-success" : "workspace-status-danger"}`}>{u.status}</span></td>
                <td>
                  <div className="workspace-table-actions">
                    <button type="button" className="workspace-button" onClick={() => openEdit(u)}>Edit</button>
                    {u.role !== "admin" && <button type="button" className="workspace-button" onClick={() => toggleStatus(u)}>{u.status === "Active" ? "Suspend" : "Activate"}</button>}
                    {u.role !== "admin" && <button type="button" className="workspace-button workspace-button-danger" onClick={() => setDeleteTarget(u)}>Delete</button>}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan="5" className="workspace-empty">No users found.</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Create / Edit Modal */}
      {modalUser !== null && (
        <Modal title={modalUser.id ? "Edit User" : "Add New User"} onClose={() => setModalUser(null)}>
          <form onSubmit={handleSave}>
            <div className="workspace-field"><label>Full Name</label><input required value={form.name} onChange={f("name")} /></div>
            <div className="workspace-field"><label>Email</label><input type="email" required value={form.email} onChange={f("email")} /></div>
            <div className="workspace-field"><label>Role</label>
              <select value={form.role} onChange={f("role")}>
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="workspace-field"><label>Status</label>
              <select value={form.status} onChange={f("status")}>
                <option>Active</option><option>Suspended</option>
              </select>
            </div>
            <div className="workspace-field"><label>Password</label><input value={form.pw} onChange={f("pw")} /></div>
            <div className="workspace-actions">
              <button type="submit" className="workspace-button workspace-button-primary">{modalUser.id ? "Save Changes" : "Create User"}</button>
              <button type="button" className="workspace-button" onClick={() => setModalUser(null)}>Cancel</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <Modal title="Confirm Delete" onClose={() => setDeleteTarget(null)}>
          <p style={{ margin: "0 0 20px", color: "#374151" }}>Are you sure you want to delete <strong>{deleteTarget.name}</strong>? This cannot be undone.</p>
          <div className="workspace-actions">
            <button className="workspace-button workspace-button-danger" onClick={confirmDelete}>Yes, Delete</button>
            <button className="workspace-button" onClick={() => setDeleteTarget(null)}>Cancel</button>
          </div>
        </Modal>
      )}
    </section>
  );
}