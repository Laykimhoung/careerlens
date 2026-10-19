import { useState, useEffect, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import { useLanguage } from "../../../context/LanguageContext";
import ApplicationStatus from "../../../components/company/ApplicationStatus";
import Button from "../../../components/common/Button";
import {
  getApplicationById,
  updateApplication,
  normalizeApplicationRecord,
  toBackendApplicationStatus,
  getApplicationNotes,
  createApplicationNote,
  getOffers,
  createOffer,
} from "../../../services/applicationService";
import { extractResults } from "../../../services/api";
import "./ApplicantDetails.css";

export default function ApplicantDetails() {
  const { id } = useParams();
  const { t } = useLanguage();
  const [applicant, setApplicant] = useState(null);
  const [notes, setNotes] = useState([]);
  const [offer, setOffer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [noteText, setNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [offerForm, setOfferForm] = useState({ salary: "", message: "" });
  const [savingOffer, setSavingOffer] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: "", text: "" });

  const loadApplicant = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [appRes, notesRes, offersRes] = await Promise.all([
        getApplicationById(id),
        getApplicationNotes().catch(() => ({ data: [] })),
        getOffers().catch(() => ({ data: [] })),
      ]);
      setApplicant(normalizeApplicationRecord(appRes.data));

      const allNotes = extractResults(notesRes);
      setNotes(allNotes.filter((n) => Number(n.application) === Number(id)));

      const allOffers = extractResults(offersRes);
      const matchOffer = allOffers.find(
        (o) => Number(o.application) === Number(id)
      );
      setOffer(matchOffer || null);
    } catch (err) {
      setError(err.response?.data?.detail || "Applicant not found.");
      setApplicant(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadApplicant();
  }, [loadApplicant]);

  const handleUpdateStatus = async (nextDisplayStatus) => {
    if (!applicant) return;
    const backendStatus = toBackendApplicationStatus(nextDisplayStatus);
    setStatusMsg({ type: "", text: "" });
    try {
      await updateApplication(applicant.id, { status: backendStatus });
      setApplicant((prev) =>
        normalizeApplicationRecord({
          ...prev.raw,
          status: backendStatus,
        })
      );
      setStatusMsg({
        type: "success",
        text: t("common.success"),
      });
    } catch (err) {
      setStatusMsg({
        type: "error",
        text: err.response?.data?.detail || t("common.error"),
      });
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteText.trim() || !applicant) return;
    setSavingNote(true);
    try {
      const res = await createApplicationNote({
        application: applicant.id,
        note: noteText.trim(),
      });
      setNotes((prev) => [res.data, ...prev]);
      setNoteText("");
    } catch (err) {
      alert(err.response?.data?.detail || t("common.error"));
    } finally {
      setSavingNote(false);
    }
  };

  const handleSendOffer = async (e) => {
    e.preventDefault();
    if (!offerForm.salary || !applicant) return;
    setSavingOffer(true);
    setStatusMsg({ type: "", text: "" });
    try {
      const res = await createOffer({
        application: applicant.id,
        salary: Number(offerForm.salary),
        currency: "USD",
        message: offerForm.message.trim(),
      });
      setOffer(res.data);
      setApplicant((prev) =>
        normalizeApplicationRecord({
          ...prev.raw,
          status: "OFFERED",
        })
      );
      setStatusMsg({
        type: "success",
        text: t("common.success"),
      });
    } catch (err) {
      const detail =
        err.response?.data?.detail ||
        Object.values(err.response?.data || {})?.[0] ||
        t("common.error");
      setStatusMsg({ type: "error", text: String(detail) });
    } finally {
      setSavingOffer(false);
    }
  };

  if (loading) {
    return (
      <section className="workspace-page">
        <div className="workspace-panel">
          <p className="workspace-muted">{t("common.loading")}</p>
        </div>
      </section>
    );
  }

  if (!applicant || error) {
    return (
      <section className="workspace-page">
        <div className="workspace-panel">
          <h1>{t("common.error")}</h1>
          <p className="workspace-muted">{error}</p>
          <Link className="workspace-button" to="/company/applicants">
            {t("company.viewAllApplicants")}
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="workspace-page">
      <div className="workspace-heading">
        <div>
          <h1>{applicant.candidateName}</h1>
          <p>
            {applicant.jobTitle} &middot; {t("candidate.appliedOn")} {applicant.appliedDate}
          </p>
        </div>
        <Link className="workspace-button" to="/company/applicants">
          {t("company.viewAllApplicants")}
        </Link>
      </div>

      {statusMsg.text && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "8px",
            marginBottom: "16px",
            backgroundColor: statusMsg.type === "error" ? "rgba(239, 68, 68, 0.15)" : "rgba(16, 185, 129, 0.15)",
            color: statusMsg.type === "error" ? "#ef4444" : "#10b981",
            border: `1px solid ${statusMsg.type === "error" ? "rgba(239, 68, 68, 0.3)" : "rgba(16, 185, 129, 0.3)"}`,
            fontSize: "14px",
          }}
        >
          {statusMsg.text}
        </div>
      )}

      <div className="workspace-split">
        <section className="workspace-panel">
          <h2>{t("candidate.viewProfile")}</h2>
          <div className="workspace-row">
            <span className="workspace-muted">Email</span>
            <strong>{applicant.candidateEmail || t("common.noData")}</strong>
          </div>
          <div className="workspace-row">
            <span className="workspace-muted">{t("candidate.institution")}</span>
            <strong>{applicant.candidateUniversity || t("common.noData")}</strong>
          </div>
          <div className="workspace-row">
            <span className="workspace-muted">{t("candidate.majorField")}</span>
            <strong>
              {applicant.candidateMajor || t("common.noData")}
              {applicant.candidateGraduationYear
                ? ` (${applicant.candidateGraduationYear})`
                : ""}
            </strong>
          </div>
          {applicant.resumeFile && (
            <div className="workspace-row">
              <span className="workspace-muted">{t("candidate.resumeAttached")}</span>
              <a
                href={applicant.resumeFile}
                target="_blank"
                rel="noreferrer"
                style={{ color: "var(--color-primary, #016BFB)", fontWeight: 600 }}
              >
                {t("candidate.viewResumeFile")} &rarr;
              </a>
            </div>
          )}
          {applicant.candidateBio && (
            <div style={{ marginTop: "12px" }}>
              <span className="workspace-muted" style={{ display: "block", marginBottom: "4px" }}>
                {t("candidate.aboutMe")}
              </span>
              <p style={{ margin: 0, fontSize: "14px", lineHeight: 1.5 }}>
                {applicant.candidateBio}
              </p>
            </div>
          )}
          {applicant.coverLetter && (
            <div style={{ marginTop: "12px" }}>
              <span className="workspace-muted" style={{ display: "block", marginBottom: "4px" }}>
                {t("candidate.coverLetter")}
              </span>
              <p style={{ margin: 0, fontSize: "14px", lineHeight: 1.5 }}>
                {applicant.coverLetter}
              </p>
            </div>
          )}

          <div style={{ marginTop: "16px" }}>
            <ApplicationStatus
              status={applicant.companyStatus || applicant.status}
              onChange={handleUpdateStatus}
            />
          </div>
        </section>

        <div style={{ display: "grid", gap: "20px" }}>
          <section className="workspace-panel">
            <h2>{t("candidate.skillsLabel")}</h2>
            {applicant.candidateSkills && applicant.candidateSkills.length > 0 ? (
              <div className="workspace-list">
                {applicant.candidateSkills.map((skill) => (
                  <div className="workspace-row" key={skill}>
                    {skill}
                  </div>
                ))}
              </div>
            ) : (
              <p className="workspace-muted">{t("common.noData")}</p>
            )}
          </section>

          {/* Job Offer Section */}
          <section className="workspace-panel">
            <h2>{t("candidate.jobOfferDetails")}</h2>
            {offer ? (
              <div>
                <div className="workspace-row">
                  <span className="workspace-muted">{t("candidate.offeredCompensation")}</span>
                  <strong>
                    {offer.currency || "USD"}{" "}
                    {Number(offer.salary || 0).toLocaleString()} / month
                  </strong>
                </div>
                <div className="workspace-row">
                  <span className="workspace-muted">{t("candidate.currentStatus")}</span>
                  <strong>{offer.status}</strong>
                </div>
                {offer.message && (
                  <p style={{ fontSize: "13px", color: "var(--color-text-secondary, #475569)", marginTop: "8px" }}>
                    {offer.message}
                  </p>
                )}
              </div>
            ) : (
              <form onSubmit={handleSendOffer} style={{ display: "grid", gap: "10px" }}>
                <input
                  type="number"
                  placeholder={t("company.offeredSalary")}
                  value={offerForm.salary}
                  onChange={(e) =>
                    setOfferForm({ ...offerForm, salary: e.target.value })
                  }
                  required
                  style={{
                    padding: "9px 12px",
                    border: "1px solid var(--color-border, #cbd5e1)",
                    backgroundColor: "var(--color-surface, #fff)",
                    color: "var(--color-text, #0f172a)",
                    borderRadius: "6px",
                    fontSize: "14px",
                  }}
                />
                <textarea
                  rows={2}
                  placeholder={t("company.offerMessage")}
                  value={offerForm.message}
                  onChange={(e) =>
                    setOfferForm({ ...offerForm, message: e.target.value })
                  }
                  style={{
                    padding: "9px 12px",
                    border: "1px solid var(--color-border, #cbd5e1)",
                    backgroundColor: "var(--color-surface, #fff)",
                    color: "var(--color-text, #0f172a)",
                    borderRadius: "6px",
                    fontSize: "14px",
                  }}
                />
                <Button type="submit" variant="primary" size="sm" loading={savingOffer}>
                  {t("company.sendOfferBtn")}
                </Button>
              </form>
            )}
          </section>

          {/* Internal Recruiter Notes Section */}
          <section className="workspace-panel">
            <h2>{t("company.internalNotes")}</h2>
            <form onSubmit={handleAddNote} style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>
              <input
                type="text"
                placeholder={t("company.addNotePlaceholder")}
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  border: "1px solid var(--color-border, #cbd5e1)",
                  backgroundColor: "var(--color-surface, #fff)",
                  color: "var(--color-text, #0f172a)",
                  borderRadius: "6px",
                  fontSize: "14px",
                }}
              />
              <Button type="submit" variant="primary" size="sm" loading={savingNote}>
                {t("company.addNoteBtn")}
              </Button>
            </form>
            {notes.length > 0 ? (
              <div style={{ display: "grid", gap: "8px" }}>
                {notes.map((n) => (
                  <div
                    key={n.id}
                    style={{
                      padding: "10px 12px",
                      backgroundColor: "var(--color-surface-hover, #f8fafc)",
                      border: "1px solid var(--color-border, #e2e8f0)",
                      borderRadius: "6px",
                      fontSize: "13px",
                    }}
                  >
                    <div>{n.note}</div>
                    <div style={{ fontSize: "11px", color: "var(--color-text-secondary, #64748b)", marginTop: "4px" }}>
                      {n.created_at
                        ? new Date(n.created_at).toLocaleString()
                        : ""}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="workspace-muted">{t("common.noData")}</p>
            )}
          </section>
        </div>
      </div>
    </section>
  );
}