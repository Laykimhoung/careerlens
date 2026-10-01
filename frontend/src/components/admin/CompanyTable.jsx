import "./CompanyTable.css";

export default function CompanyTable({
  companies = [],
  onVerify,
  onReject,
  onSuspend,
  onView,
}) {
  return (
    <div className="workspace-table-wrap">
      <table className="workspace-table">
        <thead>
          <tr>
            <th>Company</th>
            <th>Email</th>
            <th>Industry</th>
            <th>Verification</th>
            <th className="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {companies.map((company) => (
            <tr key={company.id}>
              <td>
                {onView ? <button type="button" onClick={() => onView(company)}>{company.name}</button> : <strong>{company.name}</strong>}
              </td>
              <td>{company.email}</td>
              <td>{company.ind || "—"}</td>
              <td>
                <span className={`workspace-status ${company.verified === "Verified" ? "workspace-status-success" : company.verified === "Pending Verification" ? "workspace-status-warning" : "workspace-status-danger"}`}>
                  {company.verified || "Pending Verification"}
                </span>
              </td>
              <td>
                <div className="workspace-table-actions">
                  <button type="button" onClick={() => onVerify?.(company)}>
                    Verify
                  </button>
                  <button type="button" onClick={() => onReject?.(company)}>
                    Reject
                  </button>
                  <button type="button" onClick={() => onSuspend?.(company)}>
                    Suspend
                  </button>
                </div>
              </td>
            </tr>
            ))}
            {companies.length === 0 && <tr><td colSpan="5" className="workspace-empty">No companies yet.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
