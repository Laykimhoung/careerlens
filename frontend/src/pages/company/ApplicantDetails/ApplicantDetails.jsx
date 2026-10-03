import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getDemoCollection, saveDemoCollection } from '../../../services/member3DemoStore';
import ApplicationStatus from '../../../components/company/ApplicationStatus';
import './ApplicantDetails.css';


export default function ApplicantDetails() {
	const { id } = useParams();
	const [applicant, setApplicant] = useState(() => getDemoCollection("applicants").find((item) => item.id === id));

	const updateStatus = (status) => {
		const applicants = getDemoCollection("applicants").map((item) => item.id === id ? { ...item, status } : item);
		saveDemoCollection("applicants", applicants);
		setApplicant(applicants.find((item) => item.id === id));
	};

	if (!applicant) {
		return <section className="workspace-page"><div className="workspace-panel"><h1>Applicant not found</h1><Link className="workspace-button" to="/company/applicants">Back to applicants</Link></div></section>;
	}

	return (
		<section className="workspace-page">
			<div className="demo-label">Demo data · Not connected to the backend</div>
			<div className="workspace-heading"><div><h1>{applicant.name}</h1><p>{applicant.jobTitle} · Applied {applicant.appliedAt}</p></div><Link className="workspace-button" to="/company/applicants">Back to applicants</Link></div>
			<div className="workspace-split">
				<section className="workspace-panel">
					<h2>Candidate profile</h2>
					<div className="workspace-row"><span className="workspace-muted">Email</span><strong>{applicant.email}</strong></div>
					<div className="workspace-row"><span className="workspace-muted">Location</span><strong>{applicant.location}</strong></div>
					<div className="workspace-row"><span className="workspace-muted">Experience</span><strong>{applicant.experience}</strong></div>
					  <ApplicationStatus status={applicant.status} onChange={updateStatus} />
				</section>
				<section className="workspace-panel"><h2>Skills</h2><div className="workspace-list">{applicant.skills.map((skill) => <div className="workspace-row" key={skill}>{skill}</div>)}</div><p className="workspace-muted">Resume and full profile details will be available when the candidate API is connected.</p></section>
			</div>
		</section>
	);
}