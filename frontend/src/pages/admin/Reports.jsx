import { useState } from "react";
import { readStore } from "../../services/member3DemoStore";
import "./Reports.css";

export default function Reports() {
  const [store] = useState(() => readStore());

  const users = store.users || [];
  const jobs  = store.jobs  || [];
  const apps  = store.apps  || [];

  const candidates = users.filter((u) => u.role === "student" || u.role === "candidate");
  const companies  = users.filter((u) => u.role === "company");
  const verifiedCo = companies.filter((c) => c.verified === "Verified");
  const publishedJobs = jobs.filter((j) => j.status === "Published");
  const offeredApps = apps.filter((a) => a.status === "Offered");
  const rejectedApps = apps.filter((a) => a.status === "Rejected");

  // Category breakdown
  const catCount = {};
  jobs.forEach((j) => { catCount[j.cat] = (catCount[j.cat] || 0) + 1; });
  const topCats = Object.entries(catCount).sort((a, b) => b[1] - a[1]);

  // Status breakdown
  const statusCount = {};
  apps.forEach((a) => { statusCount[a.status] = (statusCount[a.status] || 0) + 1; });

  const handleExport = (label, rows) => {
    const csv = rows.map((r) => Object.values(r).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `${label}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="workspace-page">
      <div className="workspace-heading">
        <div><h1>Platform Reports</h1><p>Live analytics based on current platform data.</p></div>
      </div>

      {/* Summary stats */}
      <div className="workspace-grid workspace-grid-stats">
        <div className="workspace-stat"><span>Total Candidates</span><strong>{candidates.length}</strong></div>
        <div className="workspace-stat"><span>Verified Companies</span><strong>{verifiedCo.length} / {companies.length}</strong></div>
        <div className="workspace-stat"><span>Active Jobs</span><strong>{publishedJobs.length}</strong></div>
        <div className="workspace-stat"><span>Total Applications</span><strong>{apps.length}</strong></div>
        <div className="workspace-stat"><span>Offers Made</span><strong>{offeredApps.length}</strong></div>
        <div className="workspace-stat"><span>Rejected Apps</span><strong>{rejectedApps.length}</strong></div>
      </div>

      <div className="reports-row">
        {/* Category breakdown */}
        <div className="workspace-panel reports-panel">
          <h2>Jobs by Category</h2>
          {topCats.length === 0 ? <p className="workspace-empty">No jobs yet.</p> : (
            <table className="workspace-table">
              <thead><tr><th>Category</th><th>Total Jobs</th></tr></thead>
              <tbody>
                {topCats.map(([cat, count]) => (
                  <tr key={cat}><td>{cat || "Uncategorized"}</td><td><strong>{count}</strong></td></tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Application status breakdown */}
        <div className="workspace-panel reports-panel">
          <h2>Applications by Status</h2>
          {Object.keys(statusCount).length === 0 ? <p className="workspace-empty">No applications yet.</p> : (
            <table className="workspace-table">
              <thead><tr><th>Status</th><th>Count</th></tr></thead>
              <tbody>
                {Object.entries(statusCount).map(([st, count]) => (
                  <tr key={st}><td>{st}</td><td><strong>{count}</strong></td></tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* CSV Exports */}
      <div className="workspace-panel">
        <h2>Data Exports</h2>
        <div className="workspace-list">
          <div className="workspace-card reports-card">
            <div><h3>Users Export</h3><p>All user accounts (name, email, role, status).</p></div>
            <button type="button" className="workspace-button" onClick={() => handleExport("users", users.map((u) => ({ name: u.name, email: u.email, role: u.role, status: u.status })))}>Download CSV</button>
          </div>
          <div className="workspace-card reports-card">
            <div><h3>Jobs Export</h3><p>All job listings (title, company, status, category).</p></div>
            <button type="button" className="workspace-button" onClick={() => handleExport("jobs", jobs.map((j) => ({ title: j.title, company: j.co, location: j.loc, status: j.status, category: j.cat })))}>Download CSV</button>
          </div>
          <div className="workspace-card reports-card">
            <div><h3>Applications Export</h3><p>All applications with status history.</p></div>
            <button type="button" className="workspace-button" onClick={() => handleExport("applications", apps.map((a) => ({ id: a.id, jobId: a.jid, candidateId: a.sid, status: a.status, date: a.date })))}>Download CSV</button>
          </div>
        </div>
      </div>
    </section>
  );
}
