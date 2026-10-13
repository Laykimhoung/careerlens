import { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  fetchNormalizedApplications,
  updateApplication,
  toBackendApplicationStatus,
  normalizeApplicationRecord,
} from "../../../services/applicationService";

export default function Applicants() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [updatingId, setUpdatingId] = useState(null);

  const loadApplicants = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const list = await fetchNormalizedApplications();
      setApplications(list);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load applicants.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadApplicants();
  }, [loadApplicants]);

  const filteredApps = useMemo(() => {
    return applications.filter((app) => {
      const matchQ = `${app.candidateName} ${app.candidateEmail} ${app.jobTitle}`
        .toLowerCase()
        .includes(query.toLowerCase());
      const displayStatus = app.companyStatus || app.status;
      const matchStatus =
        statusFilter === "All statuses" ||
        displayStatus.toLowerCase() === statusFilter.toLowerCase() ||
        app.rawStatus.toLowerCase() === statusFilter.toLowerCase();
      return matchQ && matchStatus;
    });
  }, [applications, query, statusFilter]);

  const handleUpdateStatus = async (app, nextDisplayStatus) => {
    const backendStatus = toBackendApplicationStatus(nextDisplayStatus);
    setUpdatingId(app.id);
    try {
      await updateApplication(app.id, { status: backendStatus });
      setApplications((prev) =>
        prev.map((item) =>
          item.id === app.id
            ? normalizeApplicationRecord({
                ...item.raw,
                status: backendStatus,
              })
            : item
        )
      );
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to update application status.");
    } finally {
      setUpdatingId(null);
    }
  };

  const badgeClass = (s) => {
    const v = String(s || "").toLowerCase();
    if (v === "applied") return "applied";
    if (v === "screening" || v === "reviewing" || v === "review") return "screening";
    if (v === "shortlisted") return "shortlisted";
    if (v === "interviewing" || v === "interview") return "interview";
    if (v === "offered" || v === "offer") return "offer";
    if (v === "hired") return "hired";
    return "rejected";
  };

  return (
    <section className="workspace-page">
      <div className="workspace-heading">
        <div>
          <h1>Applicants</h1>
          <p>Review candidates across your open roles.</p>
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: "12px 16px",
            backgroundColor: "#fef2f2",
            color: "#b91c1c",
            borderRadius: "8px",
            marginBottom: "16px",
          }}
        >
          {error}
        </div>
      )}

      <div
        className="workspace-toolbar"
        style={{ display: "flex", gap: "12px", marginBottom: "20px" }}
      >
        <input
          type="search"
          className="workspace-search"
          aria-label="Search applicants"
          placeholder="Search name, email, or role"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ marginBottom: 0 }}
        />
        <select
          className="workspace-search"
          style={{ width: "auto", marginBottom: 0, paddingRight: "36px" }}
          aria-label="Filter applicants by status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option>All statuses</option>
          <option>Applied</option>
          <option>Reviewing</option>
          <option>Interview</option>
          <option>Offered</option>
          <option>Rejected</option>
        </select>
      </div>

      <div className="dashboard-panel" style={{ padding: 0, overflow: "hidden" }}>
        <table className="workspace-table">
          <thead>
            <tr>
              <th>Applicant</th>
              <th>Applied Role</th>
              <th>Applied Date</th>
              <th>Status</th>
              <th style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan="5"
                  style={{ textAlign: "center", padding: "40px", color: "#666" }}
                >
                  Loading applicants...
                </td>
              </tr>
            ) : filteredApps.length > 0 ? (
              filteredApps.map((app) => {
                const displayStatus = app.companyStatus || app.status;
                return (
                  <tr key={app.id}>
                    <td>
                      <strong>{app.candidateName}</strong>
                      <div style={{ color: "#666", fontSize: "12px", marginTop: "4px" }}>
                        {app.candidateEmail || "No email"}
                      </div>
                    </td>
                    <td>{app.jobTitle}</td>
                    <td>{app.appliedDate}</td>
                    <td>
                      <span className={`status-badge ${badgeClass(displayStatus)}`}>
                        {displayStatus}
                      </span>
                    </td>
                    <td>
                      <div className="workspace-table-actions">
                        <select
                          className="admin-input"
                          style={{
                            width: "130px",
                            padding: "4px 8px",
                            minHeight: "30px",
                            fontSize: "12px",
                          }}
                          value={displayStatus}
                          disabled={updatingId === app.id}
                          onChange={(e) => handleUpdateStatus(app, e.target.value)}
                        >
                          <option value="Applied">Applied</option>
                          <option value="Reviewing">Reviewing</option>
                          <option value="Interview">Interview</option>
                          <option value="Offered">Offered</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                        <Link
                          className="workspace-button"
                          to={`/company/applicants/${app.id}`}
                        >
                          View
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan="5"
                  style={{ textAlign: "center", padding: "40px", color: "#666" }}
                >
                  No applicants found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
