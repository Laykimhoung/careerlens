import { useState } from "react";
import { readStore } from '../../../services/member3DemoStore';
import './AuditLogs.css';

function AuditLogs() {
  const [store] = useState(() => readStore());
  const [search, setSearch] = useState("");

  const logs = store.audit || [];
  const filtered = logs.filter((log) =>
    log.text.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <section className="workspace-page">
      <div className="workspace-heading">
        <div>
          <h1>Audit Logs</h1>
          <p>A full history of system events and administrator actions.</p>
        </div>
        <span className="workspace-status">{logs.length} entries</span>
      </div>

      <div className="workspace-panel">
        <input
          type="search"
          className="workspace-search"
          placeholder="Search audit logs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ marginBottom: "16px", width: "380px" }}
        />

        <div className="workspace-table-wrap">
          <table className="workspace-table">
            <thead>
              <tr>
                <th style={{ width: "200px" }}>Timestamp</th>
                <th>Event Description</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((log, idx) => (
                <tr key={idx}>
                  <td className="audit-timestamp">{log.t}</td>
                  <td>{log.text}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="2" className="workspace-empty">No audit log entries found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

export default AuditLogs;
