import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  History,
  FileText,
  Sparkles,
  Download,
  RotateCcw,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Crown,
  FileCheck,
  AlertCircle,
  TrendingUp,
  Layout,
  ExternalLink,
  ChevronRight,
  Eye,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "../../../hooks/useAuth";
import { useLanguage } from "../../../context/LanguageContext";
import {
  getResumeVersions,
  approveResumeVersion,
  exportResumeVersionDocx,
  restoreResumeVersion,
  getUsageSummary,
} from "../../../services/resumeImprovementService";
import { getLatestResume } from "../../../services/resumeService";
import UpgradeModal from "../../../components/candidate/UpgradeModal";
import "./CVVersions.css";

export default function CVVersions() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [versions, setVersions] = useState([]);
  const [latestResume, setLatestResume] = useState(null);
  const [usage, setUsage] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [selectedVersionForPreview, setSelectedVersionForPreview] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [versionsRes, resumeRes, usageRes] = await Promise.allSettled([
        getResumeVersions(),
        getLatestResume(),
        getUsageSummary(),
      ]);

      if (versionsRes.status === "fulfilled") {
        setVersions(versionsRes.value.data || []);
      }
      if (resumeRes.status === "fulfilled") {
        setLatestResume(resumeRes.value.data || null);
      }
      if (usageRes.status === "fulfilled") {
        setUsage(usageRes.value.data || null);
      }
    } catch (err) {
      setError("Failed to load CV versions history.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRestore = async (version) => {
    if (!window.confirm(`Restore Version ${version.version_number} as a new editable draft? Your existing versions will remain untouched.`)) {
      return;
    }
    setActionLoading(`restore-${version.id}`);
    try {
      const res = await restoreResumeVersion(version.id);
      setSuccessMessage(res.data?.message || `Version ${version.version_number} restored as new draft!`);
      await loadData();
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to restore version.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleApprove = async (version) => {
    setActionLoading(`approve-${version.id}`);
    try {
      await approveResumeVersion(version.id);
      setSuccessMessage(`Version ${version.version_number} is now your active approved CV!`);
      await loadData();
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err) {
      alert("Failed to set as active CV.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleExportDocx = async (version) => {
    setActionLoading(`docx-${version.id}`);
    try {
      const filename = `CareerLens_CV_v${version.version_number}_${(version.template || 'modern')}.docx`;
      await exportResumeVersionDocx(version.id, filename);
    } catch (err) {
      alert("Failed to export Word document.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleOpenStudio = (versionId) => {
    navigate(`/candidate/cv-studio?version=${versionId}&step=editor`);
  };

  return (
    <div className="cv-versions-page">
      {/* Header Bar */}
      <div className="cv-versions-header">
        <div className="header-left">
          <div className="header-icon-wrap">
            <History className="w-6 h-6 text-indigo-500" />
          </div>
          <div>
            <h1 className="cv-versions-title">My CV Versions & History</h1>
            <p className="cv-versions-subtitle">
              Inspect your revision history, compare quality scores, restore previous drafts, and manage AI usage credits.
            </p>
          </div>
        </div>

        <div className="header-actions">
          <Link to="/candidate/cv-studio" className="btn-primary-studio">
            <Sparkles className="w-4 h-4" />
            <span>Open AI CV Studio</span>
          </Link>
        </div>
      </div>

      {/* Usage & Plan Quota Banner */}
      {usage && (
        <div className={`usage-quota-card ${usage.plan_tier === "PREMIUM" ? "usage-card-premium" : ""}`}>
          <div className="usage-left">
            <div className="tier-pill">
              {usage.plan_tier === "PREMIUM" ? (
                <>
                  <Crown className="w-4 h-4 text-amber-400" />
                  <span className="font-semibold">PREMIUM CANDIDATE</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-slate-400" />
                  <span className="font-semibold">FREE PLAN</span>
                </>
              )}
            </div>
            <div className="usage-details">
              <span className="usage-stat-label">AI CV Improvements:</span>
              <span className="usage-stat-val">
                <strong>{usage.improvements_used}</strong> / {usage.improvements_limit} used
              </span>
              <span className="usage-separator">•</span>
              <span className="usage-remaining">
                <strong>{usage.improvements_remaining}</strong> remaining
              </span>
            </div>
          </div>

          <div className="usage-right">
            <div className="usage-progress-bar">
              <div
                className="usage-progress-fill"
                style={{
                  width: `${Math.min(100, (usage.improvements_used / (usage.improvements_limit || 1)) * 100)}%`,
                }}
              />
            </div>
            <button
              type="button"
              className="btn-quota-upgrade"
              onClick={() => setIsUpgradeModalOpen(true)}
            >
              {usage.plan_tier === "PREMIUM" ? "Manage Plan ($3.99/op)" : "Upgrade ($3.99/op)"}
            </button>
          </div>
        </div>
      )}

      {/* Success Notification */}
      {successMessage && (
        <div className="version-alert-success">
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="version-alert-error">
          <AlertCircle className="w-5 h-5 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="versions-loading-skeleton">
          <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
          <p>Loading your CV version history...</p>
        </div>
      ) : (
        <div className="versions-content-layout">
          {/* Timeline of Versions */}
          <div className="versions-list-section">
            <div className="section-title-row">
              <h2>All CV Versions ({versions.length + (latestResume ? 1 : 0)})</h2>
              <span className="text-sm text-slate-500">Sorted by newest first</span>
            </div>

            {versions.length === 0 && !latestResume ? (
              <div className="versions-empty-card">
                <FileText className="w-12 h-12 text-slate-400 mb-3" />
                <h3>No CV Uploaded Yet</h3>
                <p>Upload your resume first to analyze and generate improved AI versions.</p>
                <Link to="/candidate/resume" className="btn-empty-upload">
                  Upload Resume
                </Link>
              </div>
            ) : (
              <div className="versions-timeline">
                {/* AI Improved Versions */}
                {versions.map((ver) => {
                  const isCurrent = ver.is_current;
                  const isApproved = ver.is_approved;
                  const score = ver.reanalysis_score || ver.original_score;
                  const delta = ver.reanalysis_score && ver.original_score
                    ? (ver.reanalysis_score - ver.original_score).toFixed(1)
                    : null;

                  return (
                    <div
                      key={ver.id}
                      className={`version-card ${isApproved ? "version-card-approved" : ""} ${isCurrent ? "version-card-current" : ""}`}
                    >
                      <div className="version-card-header">
                        <div className="version-title-block">
                          <div className="version-number-tag">
                            v{ver.version_number}
                          </div>
                          <div>
                            <h3 className="version-heading">{ver.title}</h3>
                            <div className="version-meta">
                              <span className="meta-item">
                                <Clock className="w-3.5 h-3.5" />
                                {new Date(ver.created_at).toLocaleDateString(undefined, {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                              <span className="meta-item">
                                <Layout className="w-3.5 h-3.5" />
                                Template: <strong className="capitalize">{ver.template}</strong>
                              </span>
                              {ver.target_role && (
                                <span className="meta-item">
                                  Role: <strong>{ver.target_role}</strong>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Badges & Scores */}
                        <div className="version-score-badges">
                          {score && (
                            <div className="score-pill">
                              <span className="score-num">{score}/10</span>
                              {delta && parseFloat(delta) > 0 && (
                                <span className="score-delta">+{delta}</span>
                              )}
                            </div>
                          )}

                          {isApproved && (
                            <span className="badge-approved">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Active Approved
                            </span>
                          )}
                          {!isApproved && (
                            <span className="badge-draft">
                              Draft
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Changes Made Summary */}
                      {ver.changes_made && ver.changes_made.length > 0 && (
                        <div className="version-changes-box">
                          <span className="changes-label">Summary of AI Enhancements:</span>
                          <ul className="changes-list">
                            {ver.changes_made.map((ch, idx) => (
                              <li key={idx}>{ch}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Action Bar */}
                      <div className="version-actions-bar">
                        <div className="actions-left">
                          <button
                            type="button"
                            className="btn-action-outline"
                            onClick={() => handleOpenStudio(ver.id)}
                          >
                            <Eye className="w-4 h-4" />
                            <span>Edit in Studio</span>
                          </button>

                          <button
                            type="button"
                            className="btn-action-outline"
                            disabled={actionLoading === `docx-${ver.id}`}
                            onClick={() => handleExportDocx(ver)}
                          >
                            <Download className="w-4 h-4" />
                            <span>{actionLoading === `docx-${ver.id}` ? "Exporting..." : "Word (.docx)"}</span>
                          </button>
                        </div>

                        <div className="actions-right">
                          <button
                            type="button"
                            className="btn-action-restore"
                            title="Restore as a new draft version without consuming an AI credit"
                            disabled={actionLoading === `restore-${ver.id}`}
                            onClick={() => handleRestore(ver)}
                          >
                            <RotateCcw className="w-4 h-4" />
                            <span>{actionLoading === `restore-${ver.id}` ? "Restoring..." : "Restore as Draft"}</span>
                          </button>

                          {!isApproved && (
                            <button
                              type="button"
                              className="btn-action-approve"
                              disabled={actionLoading === `approve-${ver.id}`}
                              onClick={() => handleApprove(ver)}
                            >
                              <FileCheck className="w-4 h-4" />
                              <span>{actionLoading === `approve-${ver.id}` ? "Setting..." : "Set as Active"}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Original Document Entry (v0) */}
                {latestResume && (
                  <div className="version-card version-card-original">
                    <div className="version-card-header">
                      <div className="version-title-block">
                        <div className="version-number-tag v0-tag">
                          v0
                        </div>
                        <div>
                          <h3 className="version-heading">
                            Original Uploaded CV: {latestResume.file_name}
                          </h3>
                          <div className="version-meta">
                            <span className="meta-item">
                              <Clock className="w-3.5 h-3.5" />
                              Uploaded: {new Date(latestResume.created_at).toLocaleDateString()}
                            </span>
                            <span className="meta-item">
                              Type: <strong>{latestResume.file_type?.toUpperCase()}</strong>
                            </span>
                            <span className="meta-item">
                              Size: {(latestResume.file_size / 1024).toFixed(1)} KB
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="version-score-badges">
                        {latestResume.latest_analysis?.overall_score && (
                          <div className="score-pill score-pill-original">
                            <span className="score-num">
                              {latestResume.latest_analysis.overall_score}/10
                            </span>
                            <span className="score-label">Original Score</span>
                          </div>
                        )}
                        <span className="badge-original">Original Source File</span>
                      </div>
                    </div>

                    <div className="version-changes-box original-info-box">
                      <p className="text-sm text-slate-600 dark:text-slate-400 m-0">
                        This is your original uploaded file. It is permanently preserved in CareerLens and is never overwritten.
                      </p>
                    </div>

                    <div className="version-actions-bar">
                      <div className="actions-left">
                        {latestResume.file && (
                          <a
                            href={latestResume.file}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-action-outline"
                          >
                            <Download className="w-4 h-4" />
                            <span>Download Original</span>
                          </a>
                        )}
                      </div>
                      <div className="actions-right">
                        <Link to="/candidate/resume" className="btn-action-outline">
                          <span>Re-analyze Original</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        onUpgraded={(newUsage) => {
          if (newUsage) setUsage(newUsage);
          else loadData();
        }}
        usageSummary={usage}
      />
    </div>
  );
}
