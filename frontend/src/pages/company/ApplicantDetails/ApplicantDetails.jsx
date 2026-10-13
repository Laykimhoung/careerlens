import { useState, useEffect, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
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
        text: `Application status updated to ${nextDisplayStatus}.`,
      });
    } catch (err) {
      setStatusMsg({
        type: "error",
        text: err.response?.data?.detail || "Failed to update status.",
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
      alert(err.response?.data?.detail || "Failed to save note.");
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
        text: "Job offer sent to candidate and status updated to Offered!",
      });
    } catch (err) {
      const detail =
        err.response?.data?.detail ||
        Object.values(err.response?.data || {})?.[0] ||
        "Failed to send job offer.";
      setStatusMsg({ type: "error", text: String(detail) });
    } finally {
      setSavingOffer(false);
    }
  };

  if (loading) {
    return (
      <section className="workspace-page">
        <div className="workspace-panel">
          <p className="workspace-muted">Loading applicant details...</p>
        </div>
      </section>
    );
  }

  if (!applicant || error) {
    return (
      <section className="workspace-page">
        <div className="workspace-panel">
          <h1>Applicant not found</h1>
          <p className="workspace-muted">{error}</p>
          <Link className="workspace-button" to="/company/applicants">
            Back to applicants
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
            {applicant.jobTitle} &middot; Applied {applicant.appliedDate}
          </p>
        </div>
        <Link className="workspace-button" to="/company/applicants">
          Back to applicants
        </Link>
      </div>

      {statusMsg.text && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "8px",
            marginBottom: "16px",
            backgroundColor: statusMsg.type === "error" ? "#fef2f2" : "#f0fdf4",
            color: statusMsg.type === "error" ? "#b91c1c" : "#15803d",
            fontSize: "14px",
          }}
        >
          {statusMsg.text}
        </div>
      )}

      <div className="workspace-split">
        <section className="workspace-panel">
          <h2>Candidate profile</h2>
          <div className="workspace-row">
            <span className="workspace-muted">Email</span>
            <strong>{applicant.candidateEmail || "Not provided"}</strong>
          </div>
          <div className="workspace-row">
            <span className="workspace-muted">Phone</span>
            <strong>{applicant.candidatePhone || "Not provided"}</strong>
          </div>
          <div className="workspace-row">
            <span className="workspace-muted">University</span>
            <strong>{applicant.candidateUniversity || "Not provided"}</strong>
          </div>
          <div className="workspace-row">
            <span className="workspace-muted">Major</span>
            <strong>
              {applicant.candidateMajor || "Not provided"}
              {applicant.candidateGraduationYear
                ? ` (${applicant.candidateGraduationYear})`
                : ""}
            </strong>
          </div>
          {applicant.resumeFile && (
            <div className="workspace-row">
              <span className="workspace-muted">Resume</span>
              <a
                href={applicant.resumeFile}
                target="_blank"
                rel="noreferrer"
                style={{ color: "#0d9488", fontWeight: 600 }}
              >
                View / Download Resume &rarr;
              </a>
            </div>
          )}
          {applicant.candidateBio && (
            <div style={{ marginTop: "12px" }}>
              <span className="workspace-muted" style={{ display: "block", marginBottom: "4px" }}>
                About Candidate
              </span>
              <p style={{ margin: 0, fontSize: "14px", lineHeight: 1.5 }}>
                {applicant.candidateBio}
              </p>
            </div>
          )}
          {applicant.coverLetter && (
            <div style={{ marginTop: "12px" }}>
              <span className="workspace-muted" style={{ display: "block", marginBottom: "4px" }}>
                Cover Letter
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
            <h2>Skills</h2>
            {applicant.candidateSkills && applicant.candidateSkills.length > 0 ? (
              <div className="workspace-list">
                {applicant.candidateSkills.map((skill) => (
                  <div className="workspace-row" key={skill}>
                    {skill}
                  </div>
                ))}
              </div>
            ) : (
              <p className="workspace-muted">No skills listed on candidate profile.</p>
            )}
          </section>

          {/* Job Offer Section */}
          <section className="workspace-panel">
            <h2>Job Offer</h2>
            {offer ? (
              <div>
                <div className="workspace-row">
                  <span className="workspace-muted">Offered Salary</span>
                  <strong>
                    {offer.currency || "USD"}{" "}
                    {Number(offer.salary || 0).toLocaleString()} / month
                  </strong>
                </div>
                <div className="workspace-row">
                  <span className="workspace-muted">Offer Status</span>
                  <strong>{offer.status}</strong>
                </div>
                {offer.message && (
                  <p style={{ fontSize: "13px", color: "#475569", marginTop: "8px" }}>
                    {offer.message}
                  </p>
                )}
              </div>
            ) : (
              <form onSubmit={handleSendOffer} style={{ display: "grid", gap: "10px" }}>
                <input
                  type="number"
                  placeholder="Monthly salary offer in USD (e.g. 950)"
                  value={offerForm.salary}
                  onChange={(e) =>
                    setOfferForm({ ...offerForm, salary: e.target.value })
                  }
                  required
                  style={{
                    padding: "9px 12px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "6px",
                    fontSize: "14px",
                  }}
                />
                <textarea
                  rows={2}
                  placeholder="Offer message / terms..."
                  value={offerForm.message}
                  onChange={(e) =>
                    setOfferForm({ ...offerForm, message: e.target.value })
                  }
                  style={{
                    padding: "9px 12px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "6px",
                    fontSize: "14px",
                  }}
                />
                <Button type="submit" variant="primary" size="sm" loading={savingOffer}>
                  Extend Job Offer
                </Button>
              </form>
            )}
          </section>

          {/* Internal Recruiter Notes Section */}
          <section className="workspace-panel">
            <h2>Recruiter Notes</h2>
            <form onSubmit={handleAddNote} style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>
              <input
                type="text"
                placeholder="Add internal evaluation note..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  border: "1px solid #cbd5e1",
                  borderRadius: "6px",
                  fontSize: "14px",
                }}
              />
              <Button type="submit" variant="primary" size="sm" loading={savingNote}>
                Add Note
              </Button>
            </form>
            {notes.length > 0 ? (
              <div style={{ display: "grid", gap: "8px" }}>
                {notes.map((n) => (
                  <div
                    key={n.id}
                    style={{
                      padding: "10px 12px",
                      backgroundColor: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      borderRadius: "6px",
                      fontSize: "13px",
                    }}
                  >
                    <div>{n.note}</div>
                    <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>
                      {n.created_at
                        ? new Date(n.created_at).toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })
                        : ""}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="workspace-muted">No internal notes recorded yet.</p>
            )}
          </section>
        </div>
      </div>
    </section>
  );
}