import { useState } from "react";
import { readStore, saveDemoCollection } from '../../../services/member3DemoStore';
import { useAuth } from "../../../hooks/useAuth";
import { Link } from "react-router-dom";

export default function Applicants() {
  const { user } = useAuth();
  const [store, setStore] = useState(() => readStore());
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All statuses");

  const companyId = user?.id === 2 ? "usr-c1" : user?.id;
  const companyName = user?.full_name || "TechNova Cambodia";

  const companyJobs = (store.jobs || []).filter(j => j.cid === companyId || j.co === companyName || companyId === "usr-c1");
  const jobIds = companyJobs.map(j => j.id);
  const companyApps = (store.apps || []).filter(a => jobIds.includes(a.jid));

  const filteredApps = companyApps.filter((app) => {
    const student = store.users.find(u => u.id === app.sid) || {};
    const job = store.jobs.find(j => j.id === app.jid) || {};
    const matchQ = `${student.name} ${student.email} ${job.title}`.toLowerCase().includes(query.toLowerCase());
    return matchQ && (statusFilter === "All statuses" || app.status === statusFilter);
  });

  const updateStatus = (app, nextStatus) => {
    const nextApps = store.apps.map(item => item.id === app.id ? { ...item, status: nextStatus, hist: [...item.hist, [nextStatus, new Date().toISOString().slice(0, 10)]] } : item);
    saveDemoCollection("apps", nextApps);
    setStore(s => ({ ...s, apps: nextApps }));
  };

  const badgeClass = (s) => {
    const v = s.toLowerCase();
    if (v === 'applied') return 'applied';
    if (v === 'screening') return 'screening';
    if (v === 'shortlisted') return 'shortlisted';
    if (v === 'interviewing' || v === 'interview') return 'interview';
    if (v === 'offered' || v === 'offer') return 'offer';
    if (v === 'hired') return 'hired';
    return 'rejected';
  };

  return (
    <section className="workspace-page">
      <div className="workspace-heading">
        <div>
          <h1>Applicants</h1>
          <p>Review candidates across your open roles.</p>
        </div>
      </div>
      
      <div className="workspace-toolbar" style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
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
          style={{ width: 'auto', marginBottom: 0, paddingRight: '36px' }}
          aria-label="Filter applicants by status" 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option>All statuses</option>
          <option>Applied</option>
          <option>Screening</option>
          <option>Shortlisted</option>
          <option>Interviewing</option>
          <option>Offered</option>
          <option>Hired</option>
          <option>Rejected</option>
        </select>
      </div>

      <div className="dashboard-panel" style={{ padding: 0, overflow: "hidden" }}>
        <table className="workspace-table">
          <thead>
            <tr>
              <th>Applicant</th>
              <th>Applied Role</th>
              <th>Status</th>
              <th style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredApps.map((app) => {
              const student = store.users.find(u => u.id === app.sid) || {};
              const job = store.jobs.find(j => j.id === app.jid) || {};
              
              return (
                <tr key={app.id}>
                  <td>
                    <strong>{student.name || "Unknown Candidate"}</strong>
                    <div style={{ color: "#666", fontSize: "12px", marginTop: "4px" }}>
                      {student.email || "No email"}
                    </div>
                  </td>
                  <td>{job.title || "Unknown Role"}</td>
                  <td>
                    <span className={`status-badge ${badgeClass(app.status)}`}>
                      {app.status}
                    </span>
                  </td>
                  <td>
                    <div className="workspace-table-actions">
                      <select 
                        className="admin-input" 
                        style={{ width: '120px', padding: '4px 8px', minHeight: '30px', fontSize: '12px' }}
                        value={app.status} 
                        onChange={(e) => updateStatus(app, e.target.value)}
                      >
                        <option>Applied</option>
                        <option>Screening</option>
                        <option>Shortlisted</option>
                        <option>Interviewing</option>
                        <option>Offered</option>
                        <option>Hired</option>
                        <option>Rejected</option>
                      </select>
                      <Link className="workspace-button" to={`/company/applicants/${app.id}`}>View</Link>
                    </div>
                  </td>
                </tr>
              );
            })}
            {!filteredApps.length && (
              <tr><td colSpan="4" style={{ textAlign: "center", padding: "40px", color: "#666" }}>No applicants found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
