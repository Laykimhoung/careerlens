import { Link } from "react-router-dom";
import "./ApplicantTable.css";


export default function ApplicantTable({ applicants = [], onStatusChange }) {
	return (
		<div className="workspace-table-wrap">
			<table className="workspace-table">
				<thead><tr><th>Candidate</th><th>Applied role</th><th>Experience</th><th>Applied</th><th>Status</th><th>Review</th></tr></thead>
				<tbody>
					{applicants.map((applicant) => (
						<tr key={applicant.id}>
							<td><strong>{applicant.name}</strong><div className="workspace-muted">{applicant.email}</div></td>
							<td>{applicant.jobTitle}</td><td>{applicant.experience}</td><td>{applicant.appliedAt}</td>
							<td><select aria-label={`Status for ${applicant.name}`} value={applicant.status} onChange={(event) => onStatusChange?.(applicant, event.target.value)}><option>New</option><option>Reviewing</option><option>Interview</option><option>Offer</option><option>Rejected</option></select></td>
							<td><Link className="workspace-button" to={`/company/applicants/${applicant.id}`}>View</Link></td>
						</tr>
					))}
					{!applicants.length && <tr><td colSpan="6" className="workspace-empty">No applicants match these filters.</td></tr>}
				</tbody>
			</table>
		</div>
	);
}