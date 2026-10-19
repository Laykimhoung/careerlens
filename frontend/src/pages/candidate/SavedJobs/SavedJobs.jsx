import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../../../context/LanguageContext";
import Button from "../../../components/common/Button";
import SavedJobCard from "../../../components/candidate/SavedJobCard";
import {
  fetchSavedJobRecords,
  deleteSavedJobApi,
} from "../../../services/candidateService";
import { normalizeJobRecord } from "../../../services/jobService";
import "./SavedJobs.css";

export default function CandidateSavedJobs() {
  const { t } = useLanguage();
  const [savedItems, setSavedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadSavedJobs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const records = await fetchSavedJobRecords();
      const mapped = records
        .filter((r) => r.job)
        .map((r) => ({
          ...normalizeJobRecord(r.job),
          savedRecordId: r.id,
        }));
      setSavedItems(mapped);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load saved jobs.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSavedJobs();
  }, [loadSavedJobs]);

  const handleRemove = async (jobIdToRemove) => {
    const target = savedItems.find((j) => Number(j.id) === Number(jobIdToRemove));
    if (!target) return;
    try {
      if (target.savedRecordId) {
        await deleteSavedJobApi(target.savedRecordId);
      }
      setSavedItems((prev) =>
        prev.filter((job) => Number(job.id) !== Number(jobIdToRemove))
      );
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to remove saved job.");
    }
  };

  return (
    <div className="saved-jobs-page">
      {error && (
        <div
          style={{
            padding: "12px 16px",
            backgroundColor: "rgba(239, 68, 68, 0.15)",
            color: "#ef4444",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            borderRadius: "8px",
            marginBottom: "16px",
          }}
        >
          {error}
        </div>
      )}

      <div className="saved-jobs__header">
        <span className="saved-jobs__count">
          {loading
            ? t("common.loading")
            : `${savedItems.length} ${t("candidate.savedJobs")}`}
        </span>
      </div>

      <div className="saved-jobs__list">
        {loading ? (
          <div className="saved-jobs__empty">
            <p>{t("common.loading")}</p>
          </div>
        ) : savedItems.length > 0 ? (
          savedItems.map((job) => (
            <SavedJobCard key={job.id} job={job} onRemove={handleRemove} />
          ))
        ) : (
          <div className="saved-jobs__empty">
            <h3>{t("candidate.noSavedJobs")}</h3>
            <p>
              {t("candidate.noSavedJobsDesc")}
            </p>
            <Link to="/candidate/jobs">
              <Button variant="primary">{t("candidate.browseJobs")}</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}