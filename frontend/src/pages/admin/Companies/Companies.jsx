import { useState, useEffect, useCallback } from "react";
import { extractResults } from "../../../services/api";
import {
  getAdminCompanies,
  updateAdminCompany,
  deleteAdminCompany,
} from "../../../services/adminService";
import { registerApi } from "../../../services/authService";
import { useLanguage } from "../../../context/LanguageContext";
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
  const { t } = useLanguage();
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

  const getBadgeLabel = (v) => {
    if (v === "Verified") return t("admin.verified", "Verified");
    if (v === "Rejected") return t("admin.rejected", "Rejected");
    if (v === "Suspended") return t("admin.suspended", "Suspended");
    return t("admin.pendingVerification", "Pending Verification");
  };

  return (
    <section className="workspace-page">
      <div className="workspace-heading">
        <div>
          <h1>{t("admin.companyManagement", "Company Management")}</h1>
          <p>{t("admin.companyManagementDesc", "Create, review and manage company accounts.")}</p>
        </div>
        <button className="workspace-button workspace-button-primary" onClick={openCreate}>
          {t("admin.addCompany", "+ Add Company")}
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
          placeholder={t("admin.searchCompanies", "Search companies...")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="companies-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">{t("admin.allStatuses", "All Statuses")}</option>
          <option value="Verified">{t("admin.verified", "Verified")}</option>
          <option value="Pending Verification">{t("admin.pending", "Pending")}</option>
          <option value="Rejected">{t("admin.rejected", "Rejected")}</option>
          <option value="Suspended">{t("admin.suspended", "Suspended")}</option>
        </select>
        <span className="workspace-muted">
          {loading
            ? t("common.loading", "Loading...")
            : `${filtered.length} ${t("admin.companiesCount", "companies")}`}
        </span>
      </div>

      <div className="workspace-table-wrap">
        <table className="workspace-table">
          <thead>
            <tr>
              <th>{t("admin.companyName", "Company Name")}</th>
              <th>{t("common.email", "Email")}</th>
              <th>{t("admin.industry", "Industry")}</th>
              <th>{t("admin.location", "Location")}</th>
              <th>{t("admin.verification", "Verification")}</th>
              <th style={{ textAlign: "right" }}>{t("common.actions", "Actions")}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="workspace-empty">
                  {t("common.loading", "Loading...")}
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
                        {getBadgeLabel(c.verified)}
                      </span>
                    </td>
                    <td>
                      <div className="workspace-table-actions">
                        <button
                          type="button"
                          className="workspace-button"
                          onClick={() => openEdit(c)}
                        >
                          {t("common.edit", "Edit")}
                        </button>
                        {c.verified !== "Verified" && (
                          <button
                            type="button"
                            className="workspace-button workspace-button-primary"
                            onClick={() => setVerification(c, "Verified")}
                          >
                            {t("admin.verify", "Verify")}
                          </button>
                        )}
                        {c.verified !== "Rejected" && (
                          <button
                            type="button"
                            className="workspace-button"
                            onClick={() => setVerification(c, "Rejected")}
                          >
                            {t("admin.reject", "Reject")}
                          </button>
                        )}
                        {c.verified !== "Suspended" && (
                          <button
                            type="button"
                            className="workspace-button"
                            onClick={() => setVerification(c, "Suspended")}
                          >
                            {t("admin.suspend", "Suspend")}
                          </button>
                        )}
                        <button
                          type="button"
                          className="workspace-button workspace-button-danger"
                          onClick={() => setDeleteTarget(c)}
                        >
                          {t("common.delete", "Delete")}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan="6" className="workspace-empty">
                      {t("common.noResults", "No companies found.")}
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
          title={modal.id ? t("admin.editCompany", "Edit Company") : t("admin.addCompany", "Add Company")}
          onClose={() => setModal(null)}
        >
          <form onSubmit={handleSave} className="admin-form">
            <p className="admin-form-section">{t("admin.companyInfo", "Company Information")}</p>

            <div className="admin-field">
              <label className="admin-label">
                {t("admin.companyName", "Company Name")} <span className="admin-required">*</span>
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
                {t("common.email", "Email")} <span className="admin-required">*</span>
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
                <label className="admin-label">{t("admin.industry", "Industry")}</label>
                <input
                  className="admin-input"
                  value={form.ind}
                  onChange={f("ind")}
                  placeholder="e.g. Technology"
                />
              </div>

              <div className="admin-field">
                <label className="admin-label">{t("admin.location", "Location")}</label>
                <input
                  className="admin-input"
                  value={form.loc}
                  onChange={f("loc")}
                  placeholder="e.g. Phnom Penh"
                />
              </div>
            </div>

            <div className="admin-field">
              <label className="admin-label">{t("admin.verification", "Verification Status")}</label>
              <select
                className="admin-input admin-select"
                value={form.verified}
                onChange={f("verified")}
              >
                <option value="Pending Verification">{t("admin.pending", "Pending Verification")}</option>
                <option value="Verified">{t("admin.verified", "Verified")}</option>
                <option value="Rejected">{t("admin.rejected", "Rejected")}</option>
                <option value="Suspended">{t("admin.suspended", "Suspended")}</option>
              </select>
            </div>

            <div className="admin-form-actions">
              <button
                type="button"
                className="workspace-button"
                onClick={() => setModal(null)}
              >
                {t("common.cancel", "Cancel")}
              </button>
              <button
                type="submit"
                className="workspace-button workspace-button-primary"
                disabled={saving}
              >
                {saving ? t("common.loading", "Saving...") : modal.id ? t("admin.saveChanges", "Save Changes") : t("admin.addCompany", "Create Company")}
              </button>
            </div>
          </form>
        </Modal>
      )}

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