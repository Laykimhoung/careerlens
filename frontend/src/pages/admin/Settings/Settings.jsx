import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../../hooks/useAuth";
import { useLanguage } from "../../../context/LanguageContext";
import { getMeApi, updateMeApi } from "../../../services/authService";
import { extractResults } from "../../../services/api";
import {
  fetchAdminDashboardData,
  getUsers,
} from "../../../services/adminService";
import "./Settings.css";

function Settings() {
  const { user, refreshUser } = useAuth();
  const { t } = useLanguage();
  const [firstName, setFirstName] = useState(user?.first_name || "");
  const [lastName, setLastName] = useState(user?.last_name || "");
  const [email, setEmail] = useState(user?.email || "admin@careerlens.kh");
  const [session, setSession] = useState(
    () => localStorage.getItem("careerlens_admin_session_timeout") || "60"
  );
  const [adminAvatar, setAdminAvatar] = useState(() => {
    return (
      (user?.id ? localStorage.getItem(`careerlens_admin_avatar_${user.id}`) : null) ||
      localStorage.getItem("careerlens_admin_avatar") ||
      ""
    );
  });

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      setError("Image file size must be less than 3MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      setAdminAvatar(dataUrl);
      if (user?.id) {
        localStorage.setItem(`careerlens_admin_avatar_${user.id}`, dataUrl);
      }
      localStorage.setItem("careerlens_admin_avatar", dataUrl);
      window.dispatchEvent(new CustomEvent("careerlens_profile_image_updated"));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setAdminAvatar("");
    if (user?.id) {
      localStorage.removeItem(`careerlens_admin_avatar_${user.id}`);
    }
    localStorage.removeItem("careerlens_admin_avatar");
    window.dispatchEvent(new CustomEvent("careerlens_profile_image_updated"));
  };
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
          <h1>{t("admin.systemSettings", "System Settings")}</h1>
          <p>{t("admin.settingsDesc", "Configure administrator account details and inspect live database metrics.")}</p>
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
          <h2>{t("admin.adminProfilePrefs", "Administrator Profile & Preferences")}</h2>

          {/* Admin Avatar Upload Section */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "18px",
              marginBottom: "20px",
              paddingBottom: "18px",
              borderBottom: "1px solid var(--color-border)",
            }}
          >
            <div
              style={{
                width: "68px",
                height: "68px",
                borderRadius: "50%",
                backgroundColor: "rgba(1, 107, 251, 0.12)",
                color: "var(--color-primary, #016BFB)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "24px",
                fontWeight: 700,
                border: "2px solid rgba(1, 107, 251, 0.3)",
                overflow: "hidden",
                flexShrink: 0,
              }}
            >
              {adminAvatar ? (
                <img
                  src={adminAvatar}
                  alt="Admin Avatar"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                (firstName ? firstName.charAt(0) : "A").toUpperCase()
              )}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: "14px", color: "var(--color-text-primary)" }}>
                {t("admin.adminAvatar", "Administrator Avatar")}
              </div>
              <div style={{ fontSize: "12.5px", color: "var(--color-text-secondary)", marginTop: "2px" }}>
                {t("admin.avatarSpecs", "Upload a square PNG or JPG image (up to 3MB).")}
              </div>
              <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                <label
                  htmlFor="admin-avatar-file-input"
                  className="workspace-button"
                  style={{
                    fontSize: "12px",
                    padding: "4px 12px",
                    minHeight: "30px",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <span>📷</span> {t("admin.uploadPhoto", "Upload Photo")}
                </label>
                <input
                  id="admin-avatar-file-input"
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handleAvatarChange}
                />
                {adminAvatar && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="workspace-button"
                    style={{
                      fontSize: "12px",
                      padding: "4px 10px",
                      minHeight: "30px",
                      color: "#ef4444",
                      borderColor: "rgba(239, 68, 68, 0.3)",
                    }}
                  >
                    {t("common.remove", "Remove")}
                  </button>
                )}
              </div>
            </div>
          </div>

          <form onSubmit={handleSave}>
            <div className="workspace-field">
              <label>{t("candidate.firstName", "First Name")}</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            <div className="workspace-field">
              <label>{t("candidate.lastName", "Last Name")}</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
            <div className="workspace-field">
              <label>{t("admin.adminEmail", "Admin Email Address")}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="workspace-field">
              <label>{t("admin.sessionTimeout", "Admin Session Timeout (Minutes)")}</label>
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
                {saving ? t("admin.saving", "Saving...") : t("admin.saveSettings", "Save Settings")}
              </button>
              {saved && (
                <span className="settings-saved-msg">
                  &#10003; {t("admin.savedToDb", "Saved to database")}
                </span>
              )}
            </div>
          </form>
        </div>

        <div className="workspace-panel">
          <h2>{t("admin.databaseMetrics", "PostgreSQL Database Metrics")}</h2>
          <p className="workspace-muted" style={{ marginBottom: "20px" }}>
            {t("admin.dbMetricsDesc", "Live record counts retrieved from the CareerLens Django REST + PostgreSQL backend.")}
          </p>

          <table className="workspace-table" style={{ marginBottom: "24px" }}>
            <tbody>
              <tr>
                <td>{t("admin.totalUsers", "Total Users")}</td>
                <td>
                  <strong>{loading ? "…" : counts.users}</strong>
                </td>
              </tr>
              <tr>
                <td>{t("admin.candidateProfiles", "Candidate Profiles")}</td>
                <td>
                  <strong>{loading ? "…" : counts.candidates}</strong>
                </td>
              </tr>
              <tr>
                <td>{t("admin.companyProfiles", "Company Profiles")}</td>
                <td>
                  <strong>{loading ? "…" : counts.companies}</strong>
                </td>
              </tr>
              <tr>
                <td>{t("admin.totalJobs", "Total Jobs")}</td>
                <td>
                  <strong>{loading ? "…" : counts.jobs}</strong>
                </td>
              </tr>
              <tr>
                <td>{t("admin.totalApplications", "Total Applications")}</td>
                <td>
                  <strong>{loading ? "…" : counts.applications}</strong>
                </td>
              </tr>
              <tr>
                <td>{t("admin.auditLogEntries", "Audit Log Entries")}</td>
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
