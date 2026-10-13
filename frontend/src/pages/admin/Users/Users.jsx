import { useState, useEffect, useCallback } from "react";
import { extractResults } from "../../../services/api";
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
} from "../../../services/adminService";
import "./Users.css";
import "../../../styles/adminForms.css";

const ROLES = ["student", "company", "admin"];
const BLANK = { name: "", email: "", role: "student", status: "Active", pw: "CareerLens2026!Demo" };

function mapBackendRoleToUi(role) {
  const upper = String(role || "CANDIDATE").toUpperCase();
  if (upper === "COMPANY") return "company";
  if (upper === "ADMIN") return "admin";
  return "student";
}

function mapUiRoleToBackend(role) {
  const lower = String(role || "student").toLowerCase();
  if (lower === "company") return "COMPANY";
  if (lower === "admin") return "ADMIN";
  return "CANDIDATE";
}

function normalizeUserRow(u) {
  const fullName =
    [u.first_name, u.last_name].filter(Boolean).join(" ") ||
    u.username ||
    "Unnamed User";
  return {
    id: u.id,
    username: u.username,
    name: fullName,
    email: u.email || "—",
    role: mapBackendRoleToUi(u.role),
    rawRole: u.role,
    status: u.is_active === false ? "Suspended" : "Active",
    createdAt: u.date_joined ? String(u.date_joined).slice(0, 10) : "",
  };
}

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
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [modalUser, setModalUser] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getUsers();
      const rawList = extractResults(res);
      setUsers(rawList.map(normalizeUserRow));
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Failed to load user accounts from the server."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q || `${u.name} ${u.email} ${u.username || ""}`.toLowerCase().includes(q);
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const openCreate = () => {
    setForm(BLANK);
    setModalUser({});
  };

  const openEdit = (u) => {
    setForm({
      name: u.name,
      email: u.email === "—" ? "" : u.email,
      role: u.role,
      status: u.status,
      pw: "",
    });
    setModalUser(u);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const parts = String(form.name || "").trim().split(/\s+/).filter(Boolean);
      const first_name = parts[0] || "";
      const last_name = parts.slice(1).join(" ");
      const role = mapUiRoleToBackend(form.role);
      const is_active = form.status === "Active";

      if (modalUser.id) {
        const payload = {
          first_name,
          last_name,
          email: form.email.trim(),
          role,
          is_active,
        };
        if (form.pw && form.pw.trim()) {
          payload.password = form.pw.trim();
        }
        await updateUser(modalUser.id, payload);
      } else {
        const emailPrefix = (form.email || "user")
          .split("@")[0]
          .replace(/[^a-zA-Z0-9_]/g, "_")
          .toLowerCase();
        const username = `${emailPrefix}_${Math.floor(100 + Math.random() * 900)}`;
        await createUser({
          username,
          email: form.email.trim(),
          first_name,
          last_name,
          role,
          is_active,
          password: form.pw?.trim() || "CareerLens2026!Demo",
        });
      }
      setModalUser(null);
      await loadUsers();
    } catch (err) {
      const data = err.response?.data;
      const detail =
        data?.detail ||
        (data && typeof data === "object"
          ? Object.entries(data)
              .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
              .join(" | ")
          : null) ||
        "Failed to save user changes.";
      setError(detail);
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (u) => {
    try {
      await updateUser(u.id, { is_active: u.status !== "Active" });
      await loadUsers();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to update user status.");
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteUser(deleteTarget.id);
      setDeleteTarget(null);
      await loadUsers();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to delete user.");
      setDeleteTarget(null);
    }
  };

  const f = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  return (
    <section className="workspace-page">
      <div className="workspace-heading">
        <div>
          <h1>User Management</h1>
          <p>Create, edit and manage platform user accounts.</p>
        </div>
        <button className="workspace-button workspace-button-primary" onClick={openCreate}>
          + Add User
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
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="users-filter"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="all">All Roles</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <span className="workspace-muted">
          {loading ? "Loading..." : `${filtered.length} user${filtered.length !== 1 ? "s" : ""}`}
        </span>
      </div>

      <div className="workspace-table-wrap">
        <table className="workspace-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" className="workspace-empty">
                  Loading users from database...
                </td>
              </tr>
            ) : (
              <>
                {filtered.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <strong>{u.name}</strong>
                    </td>
                    <td>{u.email}</td>
                    <td>
                      <span className={`user-role-badge ${u.role}`}>{u.role}</span>
                    </td>
                    <td>
                      <span
                        className={`workspace-status ${
                          u.status === "Active"
                            ? "workspace-status-success"
                            : "workspace-status-danger"
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td>
                      <div className="workspace-table-actions">
                        <button
                          type="button"
                          className="workspace-button"
                          onClick={() => openEdit(u)}
                        >
                          Edit
                        </button>
                        {u.role !== "admin" && (
                          <button
                            type="button"
                            className="workspace-button"
                            onClick={() => toggleStatus(u)}
                          >
                            {u.status === "Active" ? "Suspend" : "Activate"}
                          </button>
                        )}
                        {u.role !== "admin" && (
                          <button
                            type="button"
                            className="workspace-button workspace-button-danger"
                            onClick={() => setDeleteTarget(u)}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan="5" className="workspace-empty">
                      No users found.
                    </td>
                  </tr>
                )}
              </>
            )}
          </tbody>
        </table>
      </div>

      {/* Create / Edit Modal */}
      {modalUser !== null && (
        <Modal
          title={modalUser.id ? "Edit User" : "Add New User"}
          onClose={() => setModalUser(null)}
        >
          <form onSubmit={handleSave} className="admin-form">
            <p className="admin-form-section">Account Information</p>

            <div className="admin-field">
              <label className="admin-label">
                Full Name <span className="admin-required">*</span>
              </label>
              <input
                className="admin-input"
                required
                value={form.name}
                onChange={f("name")}
                placeholder="e.g. John Smith"
              />
            </div>

            <div className="admin-field">
              <label className="admin-label">
                Email <span className="admin-required">*</span>
              </label>
              <input
                className="admin-input"
                type="email"
                required
                value={form.email}
                onChange={f("email")}
                placeholder="e.g. john@example.com"
              />
            </div>

            <div className="admin-form-grid">
              <div className="admin-field">
                <label className="admin-label">Role</label>
                <select
                  className="admin-input admin-select"
                  value={form.role}
                  onChange={f("role")}
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
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
                  <option>Active</option>
                  <option>Suspended</option>
                </select>
              </div>
            </div>

            <div className="admin-field">
              <label className="admin-label">
                {modalUser.id ? "New Password (optional)" : "Password"}
              </label>
              <input
                className="admin-input"
                value={form.pw}
                onChange={f("pw")}
                placeholder={modalUser.id ? "Leave blank to keep existing" : "e.g. CareerLens2026!Demo"}
              />
            </div>

            <div className="admin-form-actions">
              <button
                type="button"
                className="workspace-button"
                onClick={() => setModalUser(null)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="workspace-button workspace-button-primary"
                disabled={saving}
              >
                {saving ? "Saving..." : modalUser.id ? "Save Changes" : "Create User"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <Modal title="Confirm Delete" onClose={() => setDeleteTarget(null)}>
          <p style={{ margin: "0 0 20px", color: "var(--color-text-secondary)" }}>
            Are you sure you want to delete <strong>{deleteTarget.name}</strong>? This cannot be undone.
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