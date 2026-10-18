import { useState, useEffect, useCallback } from "react";
import { extractResults } from "../../../services/api";
import {
  getAdminCompanies,
  updateAdminCompany,
} from "../../../services/adminService";
import { useLanguage } from "../../../context/LanguageContext";
import "./Verification.css";
import "../../../styles/adminForms.css";

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

export default function Verification() {
  const { t } = useLanguage();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  const loadPendingCompanies = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminCompanies();
      const raw = extractResults(res);
      setCompanies(
        raw.map((co) => ({
          id: co.id,
          userId: co.user?.id,
          name: co.company_name || co.user?.username || "Unnamed Company",
          email: co.user?.email || "—",
          ind: co.industry || "Not provided",
          loc: co.location || "Not provided",
          verification_status: co.verification_status || "PENDING",
        }))
      );
    } catch (err) {
      setError(
        err.response?.data?.detail || "Failed to load verification queue."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPendingCompanies();
  }, [loadPendingCompanies]);

  const pending = companies.filter((c) => c.verification_status === "PENDING");

  const updateCompanyStatus = async (companyId, newStatus) => {
    setError(null);
    try {
      await updateAdminCompany(companyId, { verification_status: newStatus });
      await loadPendingCompanies();
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Failed to update company verification status."
      );
    }
  };

  const handleVerify = (c) => {
    updateCompanyStatus(c.id, "VERIFIED");
  };

  const handleRejectConfirm = async (e) => {
    e.preventDefault();
    if (!rejectModal) return;
    await updateCompanyStatus(rejectModal.id, "REJECTED");
    setRejectModal(null);
    setRejectReason("");
  };

  return (
    <section className="workspace-page">
      <div className="workspace-heading">
        <div>
          <h1>{t("admin.verificationQueue", "Verification Queue")}</h1>
          <p>{t("admin.verificationDesc", "Review and approve new company registrations.")}</p>
        </div>
        <span className="workspace-status workspace-status-warning">
          {pending.length} {t("admin.pending", "pending")}
        </span>
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

      <div className="workspace-panel">
        {loading ? (
          <div className="workspace-empty">{t("common.loading", "Loading verification queue...")}</div>
        ) : pending.length === 0 ? (
          <div className="workspace-empty">
            {t("admin.noPendingVerification", "No companies pending verification.")}
          </div>
        ) : (
          <div className="workspace-grid verification-grid">
            {pending.map((c) => (
              <div key={c.id} className="workspace-card verification-card">
                <div className="verification-card-header">
                  <div>
                    <h3 className="verification-company-name">{c.name}</h3>
                    <div className="workspace-muted">{c.email}</div>
                  </div>
                  <span className="workspace-status workspace-status-warning">
                    {t("admin.pending", "Pending")}
                  </span>
                </div>

                <div className="verification-card-meta">
                  <div>
                    <strong>{t("admin.industry", "Industry")}:</strong> {c.ind}
                  </div>
                  <div>
                    <strong>{t("admin.location", "Location")}:</strong> {c.loc}
                  </div>
                </div>

                <div className="workspace-actions verification-card-actions">
                  <button
                    type="button"
                    className="workspace-button workspace-button-primary"
                    onClick={() => handleVerify(c)}
                  >
                    {t("admin.verify", "Approve")}
                  </button>
                  <button
                    type="button"
                    className="workspace-button workspace-button-danger"
                    onClick={() => setRejectModal(c)}
                  >
                    {t("admin.reject", "Reject")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {rejectModal && (
        <Modal title={t("admin.rejectCompany", "Reject Company")} onClose={() => setRejectModal(null)}>
          <form onSubmit={handleRejectConfirm}>
            <p
              style={{
                margin: "0 0 18px",
                fontSize: "14px",
                color: "var(--color-text-secondary)",
              }}
            >
              {rejectModal.name}?
            </p>
            <div className="workspace-field">
              <label>{t("rejectReason", "Reason for rejection (Optional)")}</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Please provide details for the rejection..."
              />
            </div>
            <div className="workspace-actions">
              <button
                type="button"
                className="workspace-button"
                onClick={() => setRejectModal(null)}
              >
                {t("common.cancel", "Cancel")}
              </button>
              <button
                type="submit"
                className="workspace-button workspace-button-danger"
              >
                {t("admin.confirmRejection", "Confirm Rejection")}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </section>
  );
}