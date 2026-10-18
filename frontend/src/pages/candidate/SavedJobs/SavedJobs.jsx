import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import Button from "../../../components/common/Button";
import SavedJobCard from "../../../components/candidate/SavedJobCard";
import {
  fetchSavedJobRecords,
  deleteSavedJobApi,
} from "../../../services/candidateService";
import { normalizeJobRecord } from "../../../services/jobService";
import "./SavedJobs.css";

export default function CandidateSavedJobs() {
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
            backgroundColor: "#fef2f2",
            color: "#b91c1c",
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
            ? "Loading saved jobs..."
            : `You have ${savedItems.length} saved job${savedItems.length !== 1 ? "s" : ""}`}
        </span>
      </div>

      <div className="saved-jobs__list">
        {loading ? (
          <div className="saved-jobs__empty">
            <p>Loading your saved jobs from the server...</p>
          </div>
        ) : savedItems.length > 0 ? (
          savedItems.map((job) => (
            <SavedJobCard key={job.id} job={job} onRemove={handleRemove} />
          ))
        ) : (
          <div className="saved-jobs__empty">
            <h3>No saved jobs</h3>
            <p>
              You haven&apos;t saved any jobs yet. When you save a job, it will
              appear here so you can easily apply later.
            </p>
            <Link to="/candidate/jobs">
              <Button variant="primary">Browse Jobs</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}