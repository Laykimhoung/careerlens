import "./InterviewCard.css";

export default function InterviewCard({ interview, onCancel, onComplete }) {
  const isScheduled =
    interview.status === "Scheduled" || interview.rawStatus === "SCHEDULED";

  return (
    <article className="workspace-card">
      <div className="workspace-heading">
        <div>
          <h3>{interview.candidate}</h3>
          <p>{interview.role}</p>
        </div>
        <span
          className={`workspace-status ${
            isScheduled ? "workspace-status-success" : ""
          }`}
        >
          {interview.status}
        </span>
      </div>
      <div className="workspace-row">
        <span>
          {interview.date} &middot; {interview.time}
        </span>
        <span className="workspace-muted">{interview.format}</span>
      </div>
      {(interview.meetingLink || String(interview.format || "").toLowerCase().includes("video")) && (
        <div style={{ marginTop: "10px" }}>
          <a
            href={interview.meetingLink || `https://meet.jit.si/CareerLens-Interview-${interview.appId || interview.id}`}
            target="_blank"
            rel="noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 14px",
              borderRadius: "8px",
              background: "linear-gradient(135deg, #016BFB 0%, #2563eb 100%)",
              color: "#ffffff",
              fontSize: "12.5px",
              fontWeight: 700,
              textDecoration: "none",
              boxShadow: "0 2px 6px rgba(1, 107, 251, 0.25)",
            }}
          >
            <span>🎥 Join Video Call</span> &rarr;
          </a>
        </div>
      )}
      {isScheduled && (
        <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
          {onComplete && (
            <button
              className="workspace-button"
              type="button"
              onClick={() => onComplete(interview)}
            >
              Mark Completed
            </button>
          )}
          <button
            className="workspace-button workspace-button-danger"
            type="button"
            onClick={() => onCancel?.(interview)}
          >
            Cancel interview
          </button>
        </div>
      )}
    </article>
  );
}