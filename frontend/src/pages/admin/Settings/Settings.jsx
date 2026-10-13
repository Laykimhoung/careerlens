import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../../hooks/useAuth";
import { getMeApi, updateMeApi } from "../../../services/authService";
import { extractResults } from "../../../services/api";
import {
  fetchAdminDashboardData,
  getUsers,
} from "../../../services/adminService";
import "./Settings.css";

function Settings() {
  const { user, refreshUser } = useAuth();
  const [firstName, setFirstName] = useState(user?.first_name || "");
  const [lastName, setLastName] = useState(user?.last_name || "");
  const [email, setEmail] = useState(user?.email || "admin@careerlens.kh");
  const [session, setSession] = useState(
    () => localStorage.getItem("careerlens_admin_session_timeout") || "60"
  );
  const [counts, setCounts] = useState({
    users: 0,
    candidates: 0,
    companies: 0,
    jobs: 0,
    applications: 0,
    auditLogs: 0,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  const loadSettingsData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [meRes, dashRes, usersRes] = await Promise.all([
        getMeApi(),
        fetchAdminDashboardData({ dateRange: "all" }),
        getUsers(),
      ]);
      const me = meRes.data || {};
      setFirstName(me.first_name || "");
      setLastName(me.last_name || "");
      setEmail(me.email || "");

      const norm = dashRes.normalized || {};
      setCounts({
        users: extractResults(usersRes).length,
        candidates: (norm.candidates || []).length,
        companies: (norm.companies || []).length,
        jobs: (norm.jobs || []).length,
        applications: (norm.applications || []).length,
        auditLogs: (norm.auditLogs || []).length,
      });
    } catch (err) {
      setError(
        err.response?.data?.detail || "Failed to load system settings."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettingsData();
  }, [loadSettingsData]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await updateMeApi({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
      });
      localStorage.setItem("careerlens_admin_session_timeout", session);
      await refreshUser();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(
        err.response?.data?.detail || "Failed to save account settings."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="workspace-page">
      <div className="workspace-heading">
        <div>
          <h1>System Settings</h1>
          <p>Configure administrator account details and inspect live database metrics.</p>
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: "12px 16px",
            marginBottom: "16px",
            borderRadius: "8px",
            background: "#FEF2F2",
            color: "#B91C1C",
            border: "1px solid #FECACA",
            fontSize: "14px",
          }}
        >
          {error}
        </div>
      )}

      <div className="settings-grid">
        <div className="workspace-panel">
          <h2>Administrator Profile & Preferences</h2>
          <form onSubmit={handleSave}>
            <div className="workspace-field">
              <label>First Name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            <div className="workspace-field">
              <label>Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
            <div className="workspace-field">
              <label>Admin Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="workspace-field">
              <label>Admin Session Timeout (Minutes)</label>
              <input
                type="number"
                value={session}
                onChange={(e) => setSession(e.target.value)}
                required
              />
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginTop: "24px",
              }}
            >
              <button
                type="submit"
                className="workspace-button workspace-button-primary"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Settings"}
              </button>
              {saved && (
                <span className="settings-saved-msg">
                  &#10003; Saved to database
                </span>
              )}
            </div>
          </form>
        </div>

        <div className="workspace-panel">
          <h2>PostgreSQL Database Metrics</h2>
          <p className="workspace-muted" style={{ marginBottom: "20px" }}>
            Live record counts retrieved from the CareerLens Django REST + PostgreSQL backend.
          </p>

          <table className="workspace-table" style={{ marginBottom: "24px" }}>
            <tbody>
              <tr>
                <td>Total Users</td>
                <td>
                  <strong>{loading ? "…" : counts.users}</strong>
                </td>
              </tr>
              <tr>
                <td>Candidate Profiles</td>
                <td>
                  <strong>{loading ? "…" : counts.candidates}</strong>
                </td>
              </tr>
              <tr>
                <td>Company Profiles</td>
                <td>
                  <strong>{loading ? "…" : counts.companies}</strong>
                </td>
              </tr>
              <tr>
                <td>Total Jobs</td>
                <td>
                  <strong>{loading ? "…" : counts.jobs}</strong>
                </td>
              </tr>
              <tr>
                <td>Total Applications</td>
                <td>
                  <strong>{loading ? "…" : counts.applications}</strong>
                </td>
              </tr>
              <tr>
                <td>Audit Log Entries</td>
                <td>
                  <strong>{loading ? "…" : counts.auditLogs}</strong>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

export default Settings;
