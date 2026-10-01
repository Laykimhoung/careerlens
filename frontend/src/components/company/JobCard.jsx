import { Link } from "react-router-dom";
import "./JobCard.css";


export default function JobCard({ job }) {
	return (
		<article className="workspace-card">
			<div className="workspace-heading">
				<div><h3>{job.title}</h3><p>{job.department} · {job.type}</p></div>
				<span className={`workspace-status ${job.status === "Published" ? "workspace-status-success" : "workspace-status-warning"}`}>{job.status}</span>
			</div>
			<div className="workspace-row"><span>{job.location}</span><span className="workspace-muted">{job.applications || 0} applicants</span></div>
			<Link className="workspace-button" to={`/company/jobs/${job.id}/edit`}>Manage posting</Link>
		</article>
	);
}