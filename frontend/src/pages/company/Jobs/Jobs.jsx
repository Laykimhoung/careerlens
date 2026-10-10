import { useState } from "react";
import { Link } from "react-router-dom";
import { readStore, saveDemoCollection } from '../../../services/member3DemoStore';
import { useAuth } from "../../../hooks/useAuth";
import './Jobs.css';

export default function Jobs() {
  const { user } = useAuth();
  const [store, setStore] = useState(() => readStore());
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All statuses");

  const companyId = user?.id === 2 ? "usr-c1" : user?.id;
  const companyName = user?.full_name || "TechNova Cambodia";

  // Filter jobs for this company
  const companyJobs = (store.jobs || []).filter(j => j.cid === companyId || j.co === companyName || companyId === "usr-c1");

  const filteredJobs = companyJobs.filter((job) => {
    const matchQ = `${job.title} ${job.dept} ${job.loc}`.toLowerCase().includes(query.toLowerCase());
    return matchQ && (statusFilter === "All statuses" || job.status === statusFilter);
  });

  const updateJob = (job, changes) => {
    const nextJobs = store.jobs.map(item => item.id === job.id ? { ...item, ...changes } : item);
    saveDemoCollection("jobs", nextJobs);
    setStore(s => ({ ...s, jobs: nextJobs }));
  };

  const removeJob = (job) => {
    const nextJobs = store.jobs.filter(item => item.id !== job.id);
    saveDemoCollection("jobs", nextJobs);
    setStore(s => ({ ...s, jobs: nextJobs }));
  };

  return (
    <section className="workspace-page">
      <div className="workspace-heading">
        <div>
          <h1>Job postings</h1>
          <p>Create roles and manage your hiring pipeline.</p>
        </div>
        <Link className="workspace-button workspace-button-primary" to="/company/jobs/create">
          + Create a job
        </Link>
      </div>

      <div className="workspace-toolbar" style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <input 
          type="search"
          className="workspace-search"
          aria-label="Search jobs" 
          placeholder="Search roles" 
          value={query} 
          onChange={(e) => setQuery(e.target.value)} 
          style={{ marginBottom: 0 }}
        />
        <select 
          className="workspace-search" 
          style={{ width: 'auto', marginBottom: 0, paddingRight: '36px' }}
          aria-label="Filter by status" 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option>All statuses</option>
          <option>Published</option>
          <option>Draft</option>
          <option>Paused</option>
          <option>Closed</option>
        </select>
      </div>

      <div className="dashboard-panel" style={{ padding: 0, overflow: "hidden" }}>
        <table className="workspace-table">
          <thead>
            <tr>
              <th>Role</th>
              <th>Location</th>
              <th>Status</th>
              <th style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredJobs.map((job) => (
              <tr key={job.id}>
                <td>
                  <strong>{job.title}</strong>
                  <div style={{ color: "#666", fontSize: "12px", marginTop: "4px" }}>
                    {job.dept} &middot; {job.type}
                  </div>
                </td>
                <td>{job.loc}</td>
                <td>
                  <span className={`status-badge ${job.status === "Published" ? "hired" : "rejected"}`}>
                    {job.status}
                  </span>
                </td>
                <td>
                  <div className="workspace-table-actions">
                    <Link className="workspace-button" to={`/company/jobs/${job.id}/edit`}>Edit</Link>
                    <button 
                      className="workspace-button" 
                      type="button" 
                      onClick={() => updateJob(job, { status: job.status === "Published" ? "Paused" : "Published" })}
                    >
                      {job.status === "Published" ? "Pause" : "Publish"}
                    </button>
                    <button 
                      className="workspace-button workspace-button-danger" 
                      type="button" 
                      onClick={() => removeJob(job)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!filteredJobs.length && (
              <tr><td colSpan="4" style={{ textAlign: "center", padding: "40px", color: "#666" }}>No roles found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}