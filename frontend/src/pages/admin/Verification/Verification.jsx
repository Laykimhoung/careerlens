import { useState, useEffect, useCallback } from "react";
import { extractResults } from "../../../services/api";
import {
  getAdminCompanies,
  updateAdminCompany,
} from "../../../services/adminService";
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
          <h1>Verification Queue</h1>
          <p>Review and approve new company registrations.</p>
        </div>
        <span className="workspace-status workspace-status-warning">
          {pending.length} pending
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
          <div className="workspace-empty">Loading verification queue...</div>
        ) : pending.length === 0 ? (
          <div className="workspace-empty">
            No companies pending verification.
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
                    Pending
                  </span>
                </div>

                <div className="verification-card-meta">
                  <div>
                    <strong>Industry:</strong> {c.ind}
                  </div>
                  <div>
                    <strong>Location:</strong> {c.loc}
                  </div>
                </div>

                <div className="workspace-actions verification-card-actions">
                  <button
                    type="button"
                    className="workspace-button workspace-button-primary"
                    onClick={() => handleVerify(c)}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    className="workspace-button workspace-button-danger"
                    onClick={() => setRejectModal(c)}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {rejectModal && (
        <Modal title="Reject Company" onClose={() => setRejectModal(null)}>
          <form onSubmit={handleRejectConfirm}>
            <p
              style={{
                margin: "0 0 18px",
                fontSize: "14px",
                color: "var(--color-text-secondary)",
              }}
            >
              Are you sure you want to reject the application for{" "}
              <strong>{rejectModal.name}</strong>?
            </p>
            <div className="workspace-field">
              <label>Reason for rejection (Optional)</label>
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
                Cancel
              </button>
              <button
                type="submit"
                className="workspace-button workspace-button-danger"
              >
                Confirm Rejection
              </button>
            </div>
          </form>
        </Modal>
      )}
    </section>
  );
}