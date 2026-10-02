import { Link } from "react-router-dom";
import "./ApplicantCard.css";


export default function ApplicantCard({ applicant }) {
	return (
		<article className="workspace-card">
			<div className="workspace-heading">
				<div><h3>{applicant.name}</h3><p>{applicant.jobTitle}</p></div>
				<span className="workspace-status">{applicant.status}</span>
			</div>
			<div className="workspace-row"><span className="workspace-muted">{applicant.experience}</span><span className="workspace-muted">Applied {applicant.appliedAt}</span></div>
			<Link className="workspace-button" to={`/company/applicants/${applicant.id}`}>Review applicant</Link>
		</article>
	);
}