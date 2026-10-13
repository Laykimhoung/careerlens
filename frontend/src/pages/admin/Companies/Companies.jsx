import { useState, useEffect, useCallback } from "react";
import { extractResults } from "../../../services/api";
import {
  getAdminCompanies,
  updateAdminCompany,
  deleteAdminCompany,
} from "../../../services/adminService";
import { registerApi } from "../../../services/authService";
import "./Companies.css";
import "../../../styles/adminForms.css";

const BLANK = {
  name: "",
  email: "",
  ind: "",
  loc: "",
  verified: "Pending Verification",
  status: "Active",
};

function mapBackendVerificationToUi(co) {
  if (co?.user?.is_active === false) return "Suspended";
  const v = String(co?.verification_status || "PENDING").toUpperCase();
  if (v === "VERIFIED") return "Verified";
  if (v === "REJECTED") return "Rejected";
  return "Pending Verification";
}

function mapUiVerificationPayload(uiVerified, uiStatus = "Active") {
  if (uiVerified === "Suspended" || uiStatus === "Suspended") {
    return { is_active: false };
  }
  const verification_status =
    uiVerified === "Verified"
      ? "VERIFIED"
      : uiVerified === "Rejected"
      ? "REJECTED"
      : "PENDING";
  return { verification_status, is_active: true };
}

function normalizeCompanyRow(co) {
  const u = co.user || {};
  return {
    id: co.id,
    userId: u.id,
    name: co.company_name || u.username || "Unnamed Company",
    email: u.email || "",
    ind: co.industry || "",
    loc: co.location || "",
    verified: mapBackendVerificationToUi(co),
    status: u.is_active === false ? "Suspended" : "Active",
  };
}

function Modal({ title, onClose, children }) {
  return (
    <div className="crud-overlay" onClick={onClose}>
      <div className="crud-modal" onClick={(e) => e.stopPropagation()}>
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

export default function Companies() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadCompanies = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminCompanies();
      const raw = extractResults(res);
      setCompanies(raw.map(normalizeCompanyRow));
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load companies from the database.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

  const filtered = companies.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q || `${c.name} ${c.email} ${c.ind} ${c.loc}`.toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || c.verified === statusFilter;
    return matchSearch && matchStatus;
  });

  const openCreate = () => {
    setForm(BLANK);
    setModal({});
  };

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

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const vPayload = mapUiVerificationPayload(form.verified, form.status);

      if (modal.id) {
        await updateAdminCompany(modal.id, {
          company_name: form.name.trim(),
          email: form.email.trim(),
          industry: form.ind,
          location: form.loc,
          ...vPayload,
        });
      } else {
        const emailPrefix = (form.email || "company")
          .split("@")[0]
          .replace(/[^a-zA-Z0-9_]/g, "_")
          .toLowerCase();
        const username = `${emailPrefix}_${Math.floor(100 + Math.random() * 900)}`;
        const regRes = await registerApi({
          username,
          email: form.email.trim(),
          password: "CareerLens2026!Demo",
          first_name: form.name.trim(),
          role: "COMPANY",
          company_name: form.name.trim(),
          industry: form.ind,
          location: form.loc,
        });
        const newUserId = regRes.data?.id;
        if (newUserId && form.verified !== "Pending Verification") {
          const allRes = await getAdminCompanies();
          const createdProfile = extractResults(allRes).find(
            (item) => Number(item.user?.id) === Number(newUserId)
          );
          if (createdProfile) {
            await updateAdminCompany(createdProfile.id, vPayload);
          }
        }
      }
      setModal(null);
      await loadCompanies();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to save company changes.");
    } finally {
      setSaving(false);
    }
  };

  const setVerification = async (c, verified) => {
    try {
      const payload = mapUiVerificationPayload(verified);
      await updateAdminCompany(c.id, payload);
      await loadCompanies();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to update company verification.");
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteAdminCompany(deleteTarget.id);
      setDeleteTarget(null);
      await loadCompanies();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to delete company.");
      setDeleteTarget(null);
    }
  };

  const f = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));
  const badgeClass = (v) =>
    v === "Verified"
      ? "workspace-status-success"
      : v === "Pending Verification"
      ? "workspace-status-warning"
      : "workspace-status-danger";

  return (
    <section className="workspace-page">
      <div className="workspace-heading">
        <div>
          <h1>Company Management</h1>
          <p>Create, review and manage company accounts.</p>
        </div>
        <button className="workspace-button workspace-button-primary" onClick={openCreate}>
          + Add Company
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
          placeholder="Search companies..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="companies-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="Verified">Verified</option>
          <option value="Pending Verification">Pending</option>
          <option value="Rejected">Rejected</option>
          <option value="Suspended">Suspended</option>
        </select>
        <span className="workspace-muted">
          {loading
            ? "Loading..."
            : `${filtered.length} compan${filtered.length !== 1 ? "ies" : "y"}`}
        </span>
      </div>

      <div className="workspace-table-wrap">
        <table className="workspace-table">
          <thead>
            <tr>
              <th>Company Name</th>
              <th>Email</th>
              <th>Industry</th>
              <th>Location</th>
              <th>Verification</th>
              <th style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="workspace-empty">
                  Loading companies from database...
                </td>
              </tr>
            ) : (
              <>
                {filtered.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <strong>{c.name}</strong>
                    </td>
                    <td>{c.email || "—"}</td>
                    <td>{c.ind || "—"}</td>
                    <td>{c.loc || "—"}</td>
                    <td>
                      <span className={`workspace-status ${badgeClass(c.verified)}`}>
                        {c.verified || "Pending Verification"}
                      </span>
                    </td>
                    <td>
                      <div className="workspace-table-actions">
                        <button
                          type="button"
                          className="workspace-button"
                          onClick={() => openEdit(c)}
                        >
                          Edit
                        </button>
                        {c.verified !== "Verified" && (
                          <button
                            type="button"
                            className="workspace-button workspace-button-primary"
                            onClick={() => setVerification(c, "Verified")}
                          >
                            Verify
                          </button>
                        )}
                        {c.verified !== "Rejected" && (
                          <button
                            type="button"
                            className="workspace-button"
                            onClick={() => setVerification(c, "Rejected")}
                          >
                            Reject
                          </button>
                        )}
                        {c.verified !== "Suspended" && (
                          <button
                            type="button"
                            className="workspace-button"
                            onClick={() => setVerification(c, "Suspended")}
                          >
                            Suspend
                          </button>
                        )}
                        <button
                          type="button"
                          className="workspace-button workspace-button-danger"
                          onClick={() => setDeleteTarget(c)}
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
                      No companies found.
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
          title={modal.id ? "Edit Company" : "Add Company"}
          onClose={() => setModal(null)}
        >
          <form onSubmit={handleSave} className="admin-form">
            <p className="admin-form-section">Company Information</p>

            <div className="admin-field">
              <label className="admin-label">
                Company Name <span className="admin-required">*</span>
              </label>
              <input
                className="admin-input"
                required
                value={form.name}
                onChange={f("name")}
                placeholder="e.g. Acme Corp"
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
                placeholder="e.g. contact@acme.com"
              />
            </div>

            <div className="admin-form-grid">
              <div className="admin-field">
                <label className="admin-label">Industry</label>
                <input
                  className="admin-input"
                  value={form.ind}
                  onChange={f("ind")}
                  placeholder="e.g. Technology"
                />
              </div>

              <div className="admin-field">
                <label className="admin-label">Location</label>
                <input
                  className="admin-input"
                  value={form.loc}
                  onChange={f("loc")}
                  placeholder="e.g. Phnom Penh"
                />
              </div>
            </div>

            <div className="admin-field">
              <label className="admin-label">Verification Status</label>
              <select
                className="admin-input admin-select"
                value={form.verified}
                onChange={f("verified")}
              >
                <option>Pending Verification</option>
                <option>Verified</option>
                <option>Rejected</option>
                <option>Suspended</option>
              </select>
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
                {saving ? "Saving..." : modal.id ? "Save Changes" : "Create Company"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {deleteTarget && (
        <Modal title="Confirm Delete" onClose={() => setDeleteTarget(null)}>
          <p style={{ margin: "0 0 20px", color: "var(--color-text-secondary)" }}>
            Delete <strong>{deleteTarget.name}</strong>? This cannot be undone.
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