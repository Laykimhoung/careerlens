import { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";
import { getCurrentCompanyProfile } from "../../../services/companyService";
import {
  fetchNormalizedJobs,
  updateJob as updateJobApi,
  deleteJob as deleteJobApi,
  normalizeJobRecord,
} from "../../../services/jobService";
import "./Jobs.css";

export default function Jobs() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const loadJobs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [compProf, allJobs] = await Promise.all([
        getCurrentCompanyProfile(user?.id).catch(() => null),
        fetchNormalizedJobs(),
      ]);
      const ownJobs = allJobs.filter(
        (j) =>
          (compProf?.id && Number(j.companyId) === Number(compProf.id)) ||
          (user?.id && Number(j.companyUserId) === Number(user.id))
      );
      setJobs(ownJobs);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load job postings.");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const matchQ = `${job.title} ${job.industry} ${job.location} ${(job.tags || []).join(" ")}`
        .toLowerCase()
        .includes(query.toLowerCase());
      return (
        matchQ &&
        (statusFilter === "All statuses" || job.status === statusFilter)
      );
    });
  }, [jobs, query, statusFilter]);

  const handleToggleStatus = async (job, nextBackendStatus) => {
    setActionLoadingId(job.id);
    try {
      const res = await updateJobApi(job.id, { status: nextBackendStatus });
      const updated = normalizeJobRecord(res.data);
      setJobs((prev) => prev.map((item) => (item.id === job.id ? updated : item)));
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to update job status.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRemoveJob = async (job) => {
    if (!window.confirm(`Delete job posting "${job.title}"?`)) return;
    setActionLoadingId(job.id);
    try {
      await deleteJobApi(job.id);
      setJobs((prev) => prev.filter((item) => item.id !== job.id));
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to delete job posting.");
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <section className="workspace-page">
      <div className="workspace-heading">
        <div>
          <h1>Job postings</h1>
          <p>Create roles and manage your hiring pipeline.</p>
        </div>
        <Link
          className="workspace-button workspace-button-primary"
          to="/company/jobs/create"
        >
          + Create a job
        </Link>
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
          aria-label="Search jobs"
          placeholder="Search roles, skills, or locations"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ marginBottom: 0 }}
        />
        <select
          className="workspace-search"
          style={{ width: "auto", marginBottom: 0, paddingRight: "36px" }}
          aria-label="Filter by status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option>All statuses</option>
          <option>Published</option>
          <option>Draft</option>
          <option>Closed</option>
        </select>
      </div>

      <div className="dashboard-panel" style={{ padding: 0, overflow: "hidden" }}>
        <table className="workspace-table">
          <thead>
            <tr>
              <th>Role</th>
              <th>Location & Setup</th>
              <th>Compensation</th>
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
                  Loading job postings...
                </td>
              </tr>
            ) : filteredJobs.length > 0 ? (
              filteredJobs.map((job) => (
                <tr key={job.id}>
                  <td>
                    <strong>{job.title}</strong>
                    <div style={{ color: "#666", fontSize: "12px", marginTop: "4px" }}>
                      {job.type}
                      {job.tags?.length ? ` · ${job.tags.slice(0, 3).join(", ")}` : ""}
                    </div>
                  </td>
                  <td>
                    {job.location} &middot; {job.setup}
                  </td>
                  <td>{job.salary}</td>
                  <td>
                    <span
                      className={`status-badge ${
                        job.rawStatus === "PUBLISHED"
                          ? "hired"
                          : job.rawStatus === "DRAFT"
                          ? "screening"
                          : "rejected"
                      }`}
                    >
                      {job.status}
                    </span>
                  </td>
                  <td>
                    <div className="workspace-table-actions">
                      <Link
                        className="workspace-button"
                        to={`/company/jobs/${job.id}/edit`}
                      >
                        Edit
                      </Link>
                      {job.rawStatus === "PUBLISHED" ? (
                        <button
                          className="workspace-button"
                          type="button"
                          disabled={actionLoadingId === job.id}
                          onClick={() => handleToggleStatus(job, "CLOSED")}
                        >
                          Close
                        </button>
                      ) : (
                        <button
                          className="workspace-button"
                          type="button"
                          disabled={actionLoadingId === job.id}
                          onClick={() => handleToggleStatus(job, "PUBLISHED")}
                        >
                          Publish
                        </button>
                      )}
                      <button
                        className="workspace-button workspace-button-danger"
                        type="button"
                        disabled={actionLoadingId === job.id}
                        onClick={() => handleRemoveJob(job)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="5"
                  style={{ textAlign: "center", padding: "40px", color: "#666" }}
                >
                  No roles found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}