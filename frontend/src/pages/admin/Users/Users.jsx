import { useState, useEffect, useCallback } from "react";
import { extractResults } from "../../../services/api";
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
} from "../../../services/adminService";
import { useLanguage } from "../../../context/LanguageContext";
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
  const { t } = useLanguage();
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

  const getRoleLabel = (r) => {
    if (r === "student") return t("common.nav.candidates", "Student");
    if (r === "company") return t("common.nav.companies", "Company");
    if (r === "admin") return t("platformAdmin", "Admin");
    return r;
  };

  const getStatusLabel = (s) => {
    if (s === "Active") return t("admin.active", "Active");
    return t("admin.suspended", "Suspended");
  };

  return (
    <section className="workspace-page">
      <div className="workspace-heading">
        <div>
          <h1>{t("admin.userManagement", "User Management")}</h1>
          <p>{t("admin.userManagementDesc", "Create, edit and manage platform user accounts.")}</p>
        </div>
        <button className="workspace-button workspace-button-primary" onClick={openCreate}>
          {t("admin.addUser", "+ Add User")}
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
          placeholder={t("admin.searchUsers", "Search by name or email...")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="users-filter"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="all">{t("admin.allRoles", "All Roles")}</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {getRoleLabel(r)}
            </option>
          ))}
        </select>
        <span className="workspace-muted">
          {loading ? t("common.loading", "Loading...") : `${filtered.length} ${t("admin.usersCount", "users")}`}
        </span>
      </div>

      <div className="workspace-table-wrap">
        <table className="workspace-table">
          <thead>
            <tr>
              <th>{t("common.name", "Name")}</th>
              <th>{t("common.email", "Email")}</th>
              <th>{t("role", "Role")}</th>
              <th>{t("common.status", "Status")}</th>
              <th style={{ textAlign: "right" }}>{t("common.actions", "Actions")}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" className="workspace-empty">
                  {t("common.loading", "Loading...")}
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
                      <span className={`user-role-badge ${u.role}`}>{getRoleLabel(u.role)}</span>
                    </td>
                    <td>
                      <span
                        className={`workspace-status ${
                          u.status === "Active"
                            ? "workspace-status-success"
                            : "workspace-status-danger"
                        }`}
                      >
                        {getStatusLabel(u.status)}
                      </span>
                    </td>
                    <td>
                      <div className="workspace-table-actions">
                        <button
                          type="button"
                          className="workspace-button"
                          onClick={() => openEdit(u)}
                        >
                          {t("common.edit", "Edit")}
                        </button>
                        {u.role !== "admin" && (
                          <button
                            type="button"
                            className="workspace-button"
                            onClick={() => toggleStatus(u)}
                          >
                            {u.status === "Active" ? t("admin.suspend", "Suspend") : t("admin.activate", "Activate")}
                          </button>
                        )}
                        {u.role !== "admin" && (
                          <button
                            type="button"
                            className="workspace-button workspace-button-danger"
                            onClick={() => setDeleteTarget(u)}
                          >
                            {t("common.delete", "Delete")}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan="5" className="workspace-empty">
                      {t("common.noResults", "No users found.")}
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
          title={modalUser.id ? t("admin.editUser", "Edit User") : t("admin.addUser", "Add New User")}
          onClose={() => setModalUser(null)}
        >
          <form onSubmit={handleSave} className="admin-form">
            <p className="admin-form-section">{t("admin.userInfo", "Account Information")}</p>

            <div className="admin-field">
              <label className="admin-label">
                {t("common.name", "Full Name")} <span className="admin-required">*</span>
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
                {t("common.email", "Email")} <span className="admin-required">*</span>
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
                <label className="admin-label">{t("role", "Role")}</label>
                <select
                  className="admin-input admin-select"
                  value={form.role}
                  onChange={f("role")}
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {getRoleLabel(r)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="admin-field">
                <label className="admin-label">{t("common.status", "Status")}</label>
                <select
                  className="admin-input admin-select"
                  value={form.status}
                  onChange={f("status")}
                >
                  <option value="Active">{t("admin.active", "Active")}</option>
                  <option value="Suspended">{t("admin.suspended", "Suspended")}</option>
                </select>
              </div>
            </div>

            <div className="admin-field">
              <label className="admin-label">
                {modalUser.id ? t("newPasswordOptional", "New Password (optional)") : t("password", "Password")}
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
                {t("common.cancel", "Cancel")}
              </button>
              <button
                type="submit"
                className="workspace-button workspace-button-primary"
                disabled={saving}
              >
                {saving ? t("common.loading", "Saving...") : modalUser.id ? t("admin.saveChanges", "Save Changes") : t("admin.addUser", "Create User")}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <Modal title={t("admin.confirmDelete", "Confirm Delete")} onClose={() => setDeleteTarget(null)}>
          <p style={{ margin: "0 0 20px", color: "var(--color-text-secondary)" }}>
            {deleteTarget.name}?
          </p>
          <div className="workspace-actions">
            <button
              type="button"
              className="workspace-button"
              onClick={() => setDeleteTarget(null)}
            >
              {t("common.cancel", "Cancel")}
            </button>
            <button
              type="button"
              className="workspace-button workspace-button-danger"
              onClick={confirmDelete}
            >
              {t("admin.yesDelete", "Yes, Delete")}
            </button>
          </div>
        </Modal>
      )}
    </section>
  );
}