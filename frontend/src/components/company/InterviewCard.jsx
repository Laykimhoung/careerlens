import "./InterviewCard.css";

export default function InterviewCard({ interview, onCancel }) {
	return (
		<article className="workspace-card">
			<div className="workspace-heading">
				<div><h3>{interview.candidate}</h3><p>{interview.role}</p></div>
				<span className={`workspace-status ${interview.status === "Scheduled" ? "workspace-status-success" : ""}`}>{interview.status}</span>
			</div>
			<div className="workspace-row"><span>{interview.date} · {interview.time}</span><span className="workspace-muted">{interview.format}</span></div>
			{interview.status === "Scheduled" && <button className="workspace-button workspace-button-danger" type="button" onClick={() => onCancel?.(interview)}>Cancel interview</button>}
		</article>
	);
}