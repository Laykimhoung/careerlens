import { useState, useEffect, useCallback } from "react";
import ApplicationCard from "../../../components/candidate/ApplicationCard";
import { fetchNormalizedApplications } from "../../../services/applicationService";
import { useLanguage } from "../../../context/LanguageContext";
import "./Applications.css";

export const MOCK_APPLICATIONS = [];

export default function CandidateApplications() {
  const { t } = useLanguage();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("All");

  const statuses = ["All", "Applied", "Review", "Interview", "Offer", "Rejected"];

  const loadApplications = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const list = await fetchNormalizedApplications();
      setApplications(list);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load your applications.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  const filteredApps = applications.filter(
    (app) => filter === "All" || app.status === filter
  );

  const getStatusLabel = (s) => {
    switch (s) {
      case "All":
        return t("common.all", "All");
      case "Applied":
        return t("candidate.applied", "Applied");
      case "Review":
        return t("candidate.reviewing", "Review");
      case "Interview":
        return t("common.interview", "Interview");
      case "Offer":
        return t("candidate.offered", "Offer");
      case "Rejected":
        return t("common.rejected", "Rejected");
      default:
        return s;
    }
  };

  return (
    <div className="applications-page">
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

      <div className="applications-filters">
        {statuses.map((status) => (
          <button
            key={status}
            className={`app-filter-btn ${filter === status ? "app-filter-btn--active" : ""}`}
            onClick={() => setFilter(status)}
          >
            {getStatusLabel(status)}
          </button>
        ))}
      </div>

      <div className="applications-list">
        <div className="applications-list__header">
          {loading
            ? t("candidate.loadingApplications", "Loading applications...")
            : filteredApps.length === 1
            ? t("candidate.showingApplications", { count: filteredApps.length })
            : t("candidate.showingApplicationsPlural", { count: filteredApps.length })}
        </div>

        {loading ? (
          <div
            style={{
              textAlign: "center",
              padding: "40px",
              color: "#6b7280",
              border: "1px dashed #d1d5db",
              borderRadius: "8px",
            }}
          >
            {t("candidate.loadingApplications", "Loading your applications from the server...")}
          </div>
        ) : filteredApps.length > 0 ? (
          filteredApps.map((app) => (
            <ApplicationCard key={app.id} application={app} />
          ))
        ) : (
          <div
            style={{
              textAlign: "center",
              padding: "40px",
              color: "#6b7280",
              border: "1px dashed #d1d5db",
              borderRadius: "8px",
            }}
          >
            {t("candidate.noApplicationsStatus", "You don't have any applications with this status.")}
          </div>
        )}
      </div>
    </div>
  );
}