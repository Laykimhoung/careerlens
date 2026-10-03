import { useState } from "react";
import { readStore, resetDemoStore } from "../../services/member3DemoStore";
import "./Settings.css";

function Settings() {
  const [store] = useState(() => readStore());
  const [email, setEmail] = useState("admin@careerlens.edu");
  const [session, setSession] = useState("60");
  const [saved, setSaved] = useState(false);

  const totalUsers = (store.users || []).length;
  const totalJobs = (store.jobs || []).length;
  const totalApps = (store.apps || []).length;
  const dbSize = JSON.stringify(store).length;

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    if (confirm("WARNING: This will wipe all current data and restore the initial factory demo state. Are you absolutely sure?")) {
      resetDemoStore();
      window.location.reload();
    }
  };

  return (
    <section className="workspace-page">
      <div className="workspace-heading">
        <div>
          <h1>System Settings</h1>
          <p>Configure platform preferences and manage database storage.</p>
        </div>
      </div>

      <div className="settings-grid">
        <div className="workspace-panel">
          <h2>General Configuration</h2>
          <form onSubmit={handleSave}>
            <div className="workspace-field">
              <label>System Email Address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="workspace-field">
              <label>Admin Session Timeout (Minutes)</label>
              <input type="number" value={session} onChange={(e) => setSession(e.target.value)} required />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "24px" }}>
              <button type="submit" className="workspace-button workspace-button-primary">Save Settings</button>
              {saved && <span className="settings-saved-msg">&#10003; Saved successfully</span>}
            </div>
          </form>
        </div>

        <div className="workspace-panel">
          <h2>Database Storage</h2>
          <p className="workspace-muted" style={{ marginBottom: "20px" }}>
            The current system operates via browser LocalStorage. Below are the live metrics for your current browser.
          </p>

          <table className="workspace-table" style={{ marginBottom: "24px" }}>
            <tbody>
              <tr><td>Total Users</td><td><strong>{totalUsers}</strong></td></tr>
              <tr><td>Total Jobs</td><td><strong>{totalJobs}</strong></td></tr>
              <tr><td>Total Applications</td><td><strong>{totalApps}</strong></td></tr>
              <tr><td>Estimated Size</td><td><strong>{(dbSize / 1024).toFixed(2)} KB</strong></td></tr>
            </tbody>
          </table>

          <div className="settings-danger-zone">
            <h2>&#9888; Danger Zone</h2>
            <p>Perform a factory reset to wipe all custom modifications and restore the original seed data.</p>
            <button type="button" className="workspace-button workspace-button-danger mt-3" onClick={handleReset}>
              Factory Reset Demo Data
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Settings;
