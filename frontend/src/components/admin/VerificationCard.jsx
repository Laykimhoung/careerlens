import "./VerificationCard.css";

export default function VerificationCard({
  company,
  onVerify,
  onReject,
  onSuspend,
  onView,
}) {
  if (!company) return null;

  const pending = company.verified === "Pending Verification";

  return (
    <div className="workspace-card verif-card">
      <div className="workspace-heading">
        <div>
          <p className="verif-card-sub">
            Company Verification
          </p>
          <h3 className="verif-card-title">{company.name}</h3>
          <p className="verif-card-email">{company.email}</p>
          <p className="verif-card-meta">
            {company.ind || "Industry not provided"} · {company.loc || "Location not provided"}
          </p>
        </div>

        <span className={`verif-badge ${
          company.verified === "Verified"
            ? "verif-badge--verified"
            : company.verified === "Rejected" || company.verified === "Suspended"
              ? "verif-badge--rejected"
              : "verif-badge--pending"
        }`}>
          {company.verified || "Pending Verification"}
        </span>
      </div>

      <div className="workspace-actions">
        <button className="workspace-button workspace-button-primary" type="button" onClick={() => onVerify?.(company)}>
          Verify
        </button>
        <button className="workspace-button" type="button" onClick={() => onReject?.(company)}>
          Reject
        </button>
        {onSuspend && <button className="workspace-button workspace-button-danger" type="button" onClick={() => onSuspend(company)}>Suspend</button>}
        {onView && <button className="workspace-button" type="button" onClick={() => onView(company)}>View details</button>}
      </div>

      {pending && (
        <p className="verif-card-notice">
          This company is waiting for administrator verification.
        </p>
      )}
    </div>
  );
}
