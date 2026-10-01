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
    <div className="workspace-card">
      <div className="workspace-heading">
        <div>
          <p className="text-xs uppercase tracking-wide text-[#0f5a4a] font-bold">
            Company Verification
          </p>
          <h3 className="font-bold text-lg mt-1">{company.name}</h3>
          <p className="text-sm text-[#5b6b65]">{company.email}</p>
          <p className="text-sm mt-2">
            {company.ind || "Industry not provided"} · {company.loc || "Location not provided"}
          </p>
        </div>

        <span className={`text-xs font-semibold px-2 py-1 rounded ${
          company.verified === "Verified"
            ? "bg-green-100 text-green-800"
            : company.verified === "Rejected" || company.verified === "Suspended"
              ? "bg-red-100 text-red-800"
              : "bg-amber-100 text-amber-800"
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
        <p className="text-xs text-[#5b6b65] mt-3">
          This company is waiting for administrator verification.
        </p>
      )}
    </div>
  );
}
