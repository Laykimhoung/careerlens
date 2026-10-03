import { Link } from "react-router-dom";
import { getDemoCollection } from '../../../services/member3DemoStore';
import ApplicantCard from '../../../components/company/ApplicantCard';
import JobCard from '../../../components/company/JobCard';
import './Dashboard.css';


export default function Dashboard() {
	const jobs = getDemoCollection("jobs");
	const applicants = getDemoCollection("applicants");
	const interviews = getDemoCollection("interviews");
	const stats = [
		["Live postings", jobs.filter((job) => job.status === "Published").length],
		["Applicants", applicants.length],
		["In review", applicants.filter((applicant) => applicant.status === "Reviewing").length],
		["Upcoming interviews", interviews.filter((interview) => interview.status === "Scheduled").length],
	];

	return (
		<section className="workspace-page">
			<div className="demo-label">Demo data · Not connected to the backend</div>
			<div className="workspace-heading">
				<div><h1>Recruitment overview</h1><p>Keep your open roles and candidate pipeline moving.</p></div>
				<Link className="workspace-button workspace-button-primary" to="/company/jobs/create">Create a job</Link>
			</div>
			<div className="workspace-grid workspace-grid-stats">
				{stats.map(([label, value]) => <div className="workspace-stat" key={label}><span>{label}</span><strong>{value}</strong></div>)}
			</div>
			<div className="workspace-split">
				<section className="workspace-panel">
					<div className="workspace-heading"><div><h1>Recent applicants</h1><p>Latest activity across your roles.</p></div><Link className="workspace-button" to="/company/applicants">All applicants</Link></div>
					<div className="workspace-list">{applicants.slice(0, 3).map((applicant) => <ApplicantCard key={applicant.id} applicant={applicant} />)}</div>
				</section>
				<section className="workspace-panel">
					<h2>Open roles</h2>
					<div className="workspace-list">{jobs.filter((job) => job.status === "Published").slice(0, 4).map((job) => <JobCard key={job.id} job={job} />)}</div>
					{!jobs.some((job) => job.status === "Published") && <p className="workspace-empty">No published roles yet.</p>}
				</section>
			</div>
		</section>
	);
}