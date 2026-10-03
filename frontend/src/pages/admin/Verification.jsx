import { useState } from "react";
import { readStore, saveDemoCollection, logAudit, notifyUser } from "../../services/member3DemoStore";
import "./Verification.css";

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

export default function Verification() {
  const [store, setStore] = useState(() => readStore());
  const [rejectModal, setRejectModal] = useState(null); // holds the company object to reject

  const users = store.users || [];
  const companies = users.filter((u) => u.role === "company");
  
  // Only show companies that are currently "Pending Verification"
  const pending = companies.filter((c) => c.verified === "Pending Verification");

  const updateCompanyStatus = (companyId, newStatus) => {
    const updatedUsers = users.map(u => u.id === companyId ? { ...u, verified: newStatus } : u);
    saveDemoCollection("users", updatedUsers);
    setStore(s => ({ ...s, users: updatedUsers }));
    
    // Log audit and notify
    const company = users.find(u => u.id === companyId);
    if (company) {
      logAudit(`Admin changed verification status for company ${company.name} to ${newStatus}`);
      notifyUser(companyId, `Your company verification status has been updated to: ${newStatus}`);
    }
  };

  const handleVerify = (c) => {
    updateCompanyStatus(c.id, "Verified");
  };

  const handleRejectConfirm = (e) => {
    e.preventDefault();
    updateCompanyStatus(rejectModal.id, "Rejected");
    setRejectModal(null);
  };

  return (
    <section className="workspace-page">
      <div className="workspace-heading">
        <div>
          <h1>Verification Queue</h1>
          <p>Review and approve new company registrations.</p>
        </div>
        <span className="workspace-status">{pending.length} pending</span>
      </div>

      <div className="workspace-panel">
        {pending.length === 0 ? (
          <div className="workspace-empty">No companies pending verification.</div>
        ) : (
          <div className="workspace-grid" style={{ gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            {pending.map((c) => (
              <div key={c.id} className="workspace-card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <h3 style={{ margin: "0 0 4px", fontSize: "16px", color: "#111827" }}>{c.name}</h3>
                    <div className="workspace-muted" style={{ fontSize: "13px" }}>{c.email}</div>
                  </div>
                  <span className="workspace-status workspace-status-warning" style={{ fontSize: "11px" }}>Pending</span>
                </div>
                
                <div style={{ fontSize: "13px", color: "#374151" }}>
                  <div><strong>Industry:</strong> {c.ind || "Not provided"}</div>
                  <div><strong>Location:</strong> {c.loc || "Not provided"}</div>
                </div>

                <div className="workspace-actions" style={{ marginTop: "auto", paddingTop: "16px", borderTop: "1px solid #e5e7eb" }}>
                  <button type="button" className="workspace-button workspace-button-primary" style={{ flex: 1, justifyContent: "center" }} onClick={() => handleVerify(c)}>
                    Approve
                  </button>
                  <button type="button" className="workspace-button workspace-button-danger" style={{ flex: 1, justifyContent: "center" }} onClick={() => setRejectModal(c)}>
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
            <p style={{ margin: "0 0 16px", fontSize: "14px", color: "#374151" }}>
              Are you sure you want to reject the application for <strong>{rejectModal.name}</strong>?
            </p>
            <div className="workspace-field">
              <label>Reason for rejection (Optional)</label>
              <textarea placeholder="Please provide details for the rejection..." style={{ minHeight: "80px" }} />
            </div>
            <div className="workspace-actions">
              <button type="submit" className="workspace-button workspace-button-danger">Confirm Rejection</button>
              <button type="button" className="workspace-button" onClick={() => setRejectModal(null)}>Cancel</button>
            </div>
          </form>
        </Modal>
      )}
    </section>
  );
}