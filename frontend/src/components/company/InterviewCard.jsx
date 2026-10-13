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
      {interview.meetingLink && (
        <div style={{ marginTop: "6px" }}>
          <a
            href={interview.meetingLink}
            target="_blank"
            rel="noreferrer"
            style={{ color: "#0d9488", fontSize: "13px", fontWeight: 600 }}
          >
            Join Meeting Link &rarr;
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