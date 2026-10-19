import { useState, useEffect, useCallback } from "react";
import { useLanguage } from "../../../context/LanguageContext";
import { extractResults } from "../../../services/api";
import {
  fetchAdminDashboardData,
  getUsers,
} from "../../../services/adminService";
import "./Reports.css";

export default function Reports() {
  const { t } = useLanguage();
  const [data, setData] = useState({
    users: [],
    candidates: [],
    companies: [],
    jobs: [],
    applications: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadReportData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashRes, usersRes] = await Promise.all([
        fetchAdminDashboardData({ dateRange: "all" }),
        getUsers(),
      ]);
      const norm = dashRes.normalized || {};
      const rawUsers = extractResults(usersRes);
      setData({
        users: rawUsers,
        candidates: norm.candidates || [],
        companies: norm.companies || [],
        jobs: norm.jobs || [],
        applications: norm.applications || [],
      });
    } catch (err) {
      setError(
        err.response?.data?.detail || "Failed to load platform analytics."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReportData();
  }, [loadReportData]);

  const { users, candidates, companies, jobs, applications: apps } = data;
  const verifiedCo = companies.filter(
    (c) => c.verificationStatus === "Verified"
  );
  const publishedJobs = jobs.filter((j) => j.status === "Published");
  const offeredApps = apps.filter((a) => a.status === "Offered");
  const rejectedApps = apps.filter((a) => a.status === "Rejected");

  // Category / Employment Type breakdown
  const catCount = {};
  jobs.forEach((j) => {
    const cat = j.category || "General";
    catCount[cat] = (catCount[cat] || 0) + 1;
  });
  const topCats = Object.entries(catCount).sort((a, b) => b[1] - a[1]);

  // Status breakdown
  const statusCount = {};
  apps.forEach((a) => {
    const st = a.status || "Applied";
    statusCount[st] = (statusCount[st] || 0) + 1;
  });

  const handleExport = (label, rows) => {
    if (!rows || rows.length === 0) return;
    const headers = Object.keys(rows[0]).join(",");
    const csvRows = rows.map((r) =>
      Object.values(r)
        .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
        .join(",")
    );
    const csv = [headers, ...csvRows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${label}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="workspace-page">
      <div className="workspace-heading">
        <div>
          <h1>{t("admin.platformReports", "Platform Reports")}</h1>
          <p>{t("admin.reportsDesc", "Live analytics based on current platform data.")}</p>
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

      {/* Summary stats */}
      <div className="workspace-grid workspace-grid-stats">
        <div className="workspace-stat">
          <span>{t("admin.totalCandidates", "Total Candidates")}</span>
          <strong>{loading ? "…" : candidates.length}</strong>
        </div>
        <div className="workspace-stat">
          <span>{t("admin.verifiedCompanies", "Verified Companies")}</span>
          <strong>
            {loading ? "…" : `${verifiedCo.length} / ${companies.length}`}
          </strong>
        </div>
        <div className="workspace-stat">
          <span>{t("admin.activeJobs", "Active Jobs")}</span>
          <strong>{loading ? "…" : publishedJobs.length}</strong>
        </div>
        <div className="workspace-stat">
          <span>{t("admin.totalApplications", "Total Applications")}</span>
          <strong>{loading ? "…" : apps.length}</strong>
        </div>
        <div className="workspace-stat">
          <span>{t("admin.offersMade", "Offers Made")}</span>
          <strong>{loading ? "…" : offeredApps.length}</strong>
        </div>
        <div className="workspace-stat">
          <span>{t("admin.rejectedApps", "Rejected Apps")}</span>
          <strong>{loading ? "…" : rejectedApps.length}</strong>
        </div>
      </div>

      <div className="reports-row">
        {/* Category breakdown */}
        <div className="workspace-panel reports-panel">
          <h2>{t("admin.jobsByCategory", "Jobs by Category")}</h2>
          {topCats.length === 0 ? (
            <p className="workspace-empty">
              {loading ? t("common.loading", "Loading...") : t("candidate.noJobsFound", "No jobs yet.")}
            </p>
          ) : (
            <table className="workspace-table">
              <thead>
                <tr>
                  <th>{t("admin.categories", "Category")}</th>
                  <th>{t("admin.totalJobsCount", "Total Jobs")}</th>
                </tr>
              </thead>
              <tbody>
                {topCats.map(([cat, count]) => (
                  <tr key={cat}>
                    <td>{cat || "Uncategorized"}</td>
                    <td>
                      <strong>{count}</strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Application status breakdown */}
        <div className="workspace-panel reports-panel">
          <h2>{t("admin.applicationsByStatus", "Applications by Status")}</h2>
          {Object.keys(statusCount).length === 0 ? (
            <p className="workspace-empty">
              {loading ? t("common.loading", "Loading...") : t("candidate.noApplications", "No applications yet.")}
            </p>
          ) : (
            <table className="workspace-table">
              <thead>
                <tr>
                  <th>{t("common.status", "Status")}</th>
                  <th>{t("admin.count", "Count")}</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(statusCount).map(([st, count]) => (
                  <tr key={st}>
                    <td>{st}</td>
                    <td>
                      <strong>{count}</strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* CSV Exports */}
      <div className="workspace-panel">
        <h2>{t("admin.exportData", "Data Exports")}</h2>
        <div className="workspace-list">
          <div className="workspace-card reports-card">
            <div>
              <h3>{t("admin.users", "Users")}</h3>
              <p>{t("admin.userManagementDesc", "All user accounts (name, email, role, status).")}</p>
            </div>
            <button
              type="button"
              className="workspace-button"
              onClick={() =>
                handleExport(
                  "users",
                  users.map((u) => ({
                    name:
                      [u.first_name, u.last_name].filter(Boolean).join(" ") ||
                      u.username,
                    email: u.email,
                    role: u.role,
                    status: u.is_active ? "Active" : "Suspended",
                  }))
                )
              }
            >
              Download CSV
            </button>
          </div>
          <div className="workspace-card reports-card">
            <div>
              <h3>{t("admin.jobs", "Jobs")}</h3>
              <p>{t("admin.jobManagementDesc", "All job listings (title, company, status, category).")}</p>
            </div>
            <button
              type="button"
              className="workspace-button"
              onClick={() =>
                handleExport(
                  "jobs",
                  jobs.map((j) => ({
                    title: j.title,
                    company: j.companyName,
                    location: j.location,
                    status: j.status,
                    category: j.category,
                  }))
                )
              }
            >
              Download CSV
            </button>
          </div>
          <div className="workspace-card reports-card">
            <div>
              <h3>{t("admin.applications", "Applications")}</h3>
              <p>{t("admin.applicationManagementDesc", "All applications with candidate and job details.")}</p>
            </div>
            <button
              type="button"
              className="workspace-button"
              onClick={() =>
                handleExport(
                  "applications",
                  apps.map((a) => ({
                    id: a.id,
                    jobTitle: a.jobTitle,
                    company: a.companyName,
                    candidate: a.candidateName,
                    status: a.status,
                    date: a.appliedAt,
                  }))
                )
              }
            >
              Download CSV
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
