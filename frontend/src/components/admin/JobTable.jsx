import "./JobTable.css";

export default function JobTable({
  jobs = [],
  onApprove,
  onReject,
  onSuspend,
  onRemove,
  onView,
}) {
  return (
    <div className="workspace-table-wrap">
      <table className="workspace-table">
        <thead>
          <tr>
            <th>Job</th>
            <th>Company</th>
            <th>Location</th>
            <th>Status</th>
            <th className="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <tr key={job.id}>
              <td>
                {onView ? <button type="button" onClick={() => onView(job)}>{job.title}</button> : <strong>{job.title}</strong>}
              </td>
              <td>{job.co || job.company}</td>
              <td>{job.loc || job.location || "—"}</td>
              <td>
                <span className={`workspace-status ${job.status === "Published" ? "workspace-status-success" : job.status === "Rejected" ? "workspace-status-danger" : "workspace-status-warning"}`}>
                  {job.status}
                </span>
              </td>
              <td>
                <div className="workspace-table-actions">
                  <button type="button" onClick={() => onApprove?.(job)}>
                    Approve
                  </button>
                  <button type="button" onClick={() => onReject?.(job)}>
                    Reject
                  </button>
                  <button type="button" onClick={() => onSuspend?.(job)}>
                    Suspend
                  </button>
                  <button type="button" onClick={() => onRemove?.(job)}>
                    Remove
                  </button>
                </div>
              </td>
            </tr>
            ))}
            {jobs.length === 0 && <tr><td colSpan="5" className="workspace-empty">No jobs yet.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
