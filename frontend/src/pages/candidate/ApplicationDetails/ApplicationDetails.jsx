import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useLanguage } from "../../../context/LanguageContext";
import Button from "../../../components/common/Button";
import {
  getApplicationById,
  normalizeApplicationRecord,
  getApplicationHistory,
  getOffers,
  updateOffer,
  deleteApplication,
} from "../../../services/applicationService";
import { fetchInterviewsList } from "../../../services/interviewService";
import { extractResults } from "../../../services/api";
import "./ApplicationDetails.css";

export default function CandidateApplicationDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [app, setApp] = useState(null);
  const [history, setHistory] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [offer, setOffer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: "", text: "" });

  const loadApplicationDetails = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [appRes, histRes, intList, offerRes] = await Promise.all([
        getApplicationById(id),
        getApplicationHistory().catch(() => ({ data: [] })),
        fetchInterviewsList().catch(() => []),
        getOffers().catch(() => ({ data: [] })),
      ]);
      const normalizedApp = normalizeApplicationRecord(appRes.data);
      setApp(normalizedApp);

      const allHist = extractResults(histRes);
      setHistory(allHist.filter((h) => Number(h.application) === Number(id)));

      setInterviews(intList.filter((iv) => Number(iv.application) === Number(id)));

      const allOffers = extractResults(offerRes);
      const matchingOffer = allOffers.find(
        (o) => Number(o.application) === Number(id)
      );
      setOffer(matchingOffer || null);
    } catch (err) {
      setError(err.response?.data?.detail || "Application not found.");
      setApp(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadApplicationDetails();
  }, [loadApplicationDetails]);

  const timeline = useMemo(() => {
    if (!app) return [];
    const findDateFor = (backendStatus) => {
      const found = history.find((h) => h.new_status === backendStatus);
      if (found?.created_at) {
        return new Date(found.created_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
      }
      return null;
    };

    const raw = app.rawStatus;
    const isReviewed = ["REVIEWING", "INTERVIEW", "OFFERED", "REJECTED"].includes(raw) || Boolean(findDateFor("REVIEWING"));
    const isInterview = ["INTERVIEW", "OFFERED"].includes(raw) || Boolean(findDateFor("INTERVIEW")) || interviews.length > 0;
    const isOffered = raw === "OFFERED" || Boolean(offer);
    const isRejected = raw === "REJECTED";

    const steps = [
      {
        status: "Applied",
        date: findDateFor("APPLIED") || app.appliedDate,
        active: true,
      },
      {
        status: "Review",
        date: findDateFor("REVIEWING") || (isReviewed ? app.updatedDate : null),
        active: isReviewed,
      },
      {
        status: "Interview",
        date: findDateFor("INTERVIEW") || (interviews[0]?.scheduled_at ? new Date(interviews[0].scheduled_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : null),
        active: isInterview,
      },
    ];

    if (isRejected) {
      steps.push({
        status: "Rejected",
        date: findDateFor("REJECTED") || app.updatedDate,
        active: true,
      });
    } else {
      steps.push({
        status: "Offer",
        date: findDateFor("OFFERED") || (offer?.sent_at ? new Date(offer.sent_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : null),
        active: isOffered,
      });
    }

    return steps;
  }, [app, history, interviews, offer]);

  const handleOfferResponse = async (newStatus) => {
    if (!offer?.id) return;
    setActionLoading(true);
    setStatusMsg({ type: "", text: "" });
    try {
      const res = await updateOffer(offer.id, { status: newStatus });
      setOffer(res.data);
      setStatusMsg({
        type: "success",
        text: `Offer ${newStatus === "ACCEPTED" ? "accepted" : "declined"} successfully.`,
      });
    } catch (err) {
      setStatusMsg({
        type: "error",
        text: err.response?.data?.detail || "Failed to update offer response.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!app?.id) return;
    if (!window.confirm(`Withdraw your application for ${app.jobTitle} at ${app.company}?`)) {
      return;
    }
    setActionLoading(true);
    try {
      await deleteApplication(app.id);
      navigate("/candidate/applications");
    } catch (err) {
      setStatusMsg({
        type: "error",
        text: err.response?.data?.detail || "Could not withdraw application.",
      });
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="app-details-page">
        <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
          Loading application details...
        </div>
      </div>
    );
  }

  if (!app || error) {
    return (
      <div className="app-details-page">
        <div className="app-not-found">
          <h2 style={{ fontSize: "24px", fontWeight: "700", marginBottom: "16px" }}>
            Application not found
          </h2>
          <p style={{ marginBottom: "24px", color: "#6b7280" }}>
            {error || "We couldn't find the application you're looking for."}
          </p>
          <Link to="/candidate/applications">
            <Button variant="primary">Back to Applications</Button>
          </Link>
        </div>
      </div>
    );
  }

  const badgeClass = `app-badge--${app.status.toLowerCase()}`;

  return (
    <div className="app-details-page">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <Link to="/candidate/applications" className="app-details__back" style={{ marginBottom: 0 }}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            style={{ width: "16px", height: "16px" }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
            />
          </svg>
          {t("candidate.backToApplications", "Back to Applications")}
        </Link>

        <Button
          variant="danger"
          size="sm"
          onClick={handleWithdraw}
          disabled={actionLoading}
        >
          {t("candidate.withdrawApplication", "Withdraw Application")}
        </Button>
      </div>

      {statusMsg.text && (
        <div
          style={{
            marginBottom: "16px",
            padding: "12px 16px",
            borderRadius: "8px",
            backgroundColor: statusMsg.type === "error" ? "#fef2f2" : "#f0fdf4",
            color: statusMsg.type === "error" ? "#b91c1c" : "#15803d",
            fontSize: "14px",
          }}
        >
          {statusMsg.text}
        </div>
      )}

      {/* Hero Section */}
      <div className="app-details__hero">
        <h1>{app.jobTitle}</h1>
        <p>
          {app.company} &middot; {t("candidate.appliedOn", "Applied on")} {app.appliedDate}
        </p>
        <span className={`app-badge-large ${badgeClass}`}>
          {t("candidate.currentStatus", "Current Status")}: {app.status}
        </span>
      </div>

      {/* Progress Tracker */}
      <div className="app-details__section">
        <h2 className="app-details__section-title">{t("candidate.applicationProgress", "Application Progress")}</h2>

        <div className="progress-tracker">
          {timeline.map((step, index) => {
            const isRejectedStep = step.status === "Rejected" && step.active;

            return (
              <div
                key={index}
                className={`progress-step ${step.active ? "progress-step--active" : ""} ${
                  isRejectedStep ? "progress-step--rejected" : ""
                }`}
              >
                <div className="progress-step__circle">
                  {step.active && !isRejectedStep && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                  {isRejectedStep && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
                <div>
                  <div className="progress-step__label">{step.status}</div>
                  <div className="progress-step__date">{step.date}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Offer Section (if extended) */}
      {offer && (
        <div className="app-details__section">
          <h2 className="app-details__section-title">{t("candidate.jobOfferDetails", "Job Offer Details")}</h2>
          <div
            style={{
              backgroundColor: "rgba(16, 185, 129, 0.12)",
              border: "1px solid rgba(16, 185, 129, 0.28)",
              borderRadius: "8px",
              padding: "16px",
            }}
          >
            <p style={{ margin: "0 0 8px 0", fontWeight: 600, color: "#166534" }}>
              {t("candidate.offeredCompensation", "Offered Compensation")}: {offer.currency || "USD"}{" "}
              {Number(offer.salary || 0).toLocaleString()} / month
            </p>
            {offer.message && (
              <p style={{ margin: "0 0 12px 0", color: "#15803d", fontSize: "14px" }}>
                {offer.message}
              </p>
            )}
            <p style={{ margin: "0 0 12px 0", fontSize: "13px", color: "var(--color-text-secondary)" }}>
              {t("common.status", "Status")}: <strong>{offer.status}</strong>
            </p>
            {offer.status === "PENDING" && (
              <div style={{ display: "flex", gap: "10px" }}>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleOfferResponse("ACCEPTED")}
                  disabled={actionLoading}
                >
                  {t("candidate.acceptOffer", "Accept Offer")}
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleOfferResponse("DECLINED")}
                  disabled={actionLoading}
                >
                  {t("candidate.declineOffer", "Decline Offer")}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Scheduled Interviews Section */}
      {interviews.length > 0 && (
        <div className="app-details__section">
          <h2 className="app-details__section-title">{t("candidate.scheduledInterviews", "Scheduled Interviews")}</h2>
          <div style={{ display: "grid", gap: "12px" }}>
            {interviews.map((iv) => (
              <div
                key={iv.id}
                style={{
                  padding: "14px",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  backgroundColor: "#f8fafc",
                }}
              >
                <div style={{ fontWeight: 600, color: "#0f172a" }}>
                  Date:{" "}
                  {new Date(iv.scheduled_at).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}{" "}
                  ({iv.status})
                </div>
                {iv.location && (
                  <div style={{ fontSize: "13px", color: "#475569", marginTop: "4px" }}>
                    Location: {iv.location}
                  </div>
                )}
                {iv.meeting_link && (
                  <div style={{ marginTop: "6px" }}>
                    <a
                      href={iv.meeting_link}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: "#0d9488", fontWeight: 600, fontSize: "13px" }}
                    >
                      Join Video Interview &rarr;
                    </a>
                  </div>
                )}
                {iv.feedback && (
                  <div style={{ fontSize: "13px", color: "#334155", marginTop: "6px" }}>
                    Feedback: {iv.feedback}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cover Letter & Status History Notes */}
      <div className="app-details__section">
        <h2 className="app-details__section-title">Updates & Notes</h2>
        <div className="app-details__notes">
          {history.length > 0 ? (
            <ul style={{ margin: 0, paddingLeft: "18px" }}>
              {history.map((h) => (
                <li key={h.id} style={{ marginBottom: "6px" }}>
                  <strong>{h.new_status}</strong>:{" "}
                  {h.note || `Status changed to ${h.new_status}`} (
                  {new Date(h.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                  )
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ margin: 0 }}>
              Your application for {app.jobTitle} at {app.company} is currently in{" "}
              <strong>{app.status}</strong> status.
            </p>
          )}
          {app.coverLetter && (
            <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #e2e8f0" }}>
              <strong>Submitted Cover Letter:</strong>
              <p style={{ margin: "6px 0 0 0", whiteSpace: "pre-line" }}>{app.coverLetter}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}