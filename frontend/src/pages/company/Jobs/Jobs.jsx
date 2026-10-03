import { useState } from "react";
import { Link } from "react-router-dom";
import { getDemoCollection, saveDemoCollection } from '../../../services/member3DemoStore';
import './Jobs.css';


export default function Jobs() {
	const [jobs, setJobs] = useState(() => getDemoCollection("jobs"));
	const [query, setQuery] = useState("");
	const [status, setStatus] = useState("All statuses");
	const filteredJobs = jobs.filter((job) => {
		const matchesQuery = `${job.title} ${job.department} ${job.location}`.toLowerCase().includes(query.toLowerCase());
		return matchesQuery && (status === "All statuses" || job.status === status);
	});

	const updateJob = (job, changes) => {
		const nextJobs = jobs.map((item) => item.id === job.id ? { ...item, ...changes } : item);
		setJobs(nextJobs);
		saveDemoCollection("jobs", nextJobs);
	};

	const removeJob = (job) => {
		const nextJobs = jobs.filter((item) => item.id !== job.id);
		setJobs(nextJobs);
		saveDemoCollection("jobs", nextJobs);
	};

	return (
		<section className="workspace-page">
			<div className="demo-label">Demo data · Changes stay in this browser</div>
			<div className="workspace-heading">
				<div><h1>Job postings</h1><p>Create roles and manage your hiring pipeline.</p></div>
				<Link className="workspace-button workspace-button-primary" to="/company/jobs/create">Create a job</Link>
			</div>
			<div className="workspace-toolbar">
				<input aria-label="Search jobs" placeholder="Search roles" value={query} onChange={(event) => setQuery(event.target.value)} />
				<select aria-label="Filter by status" value={status} onChange={(event) => setStatus(event.target.value)}>
					<option>All statuses</option><option>Published</option><option>Draft</option><option>Paused</option><option>Closed</option>
				</select>
			</div>
			<div className="workspace-table-wrap">
				<table className="workspace-table">
					<thead><tr><th>Role</th><th>Location</th><th>Applicants</th><th>Status</th><th>Actions</th></tr></thead>
					<tbody>
						{filteredJobs.map((job) => (
							<tr key={job.id}>
								<td><strong>{job.title}</strong><div className="workspace-muted">{job.department} · {job.type}</div></td>
								<td>{job.location}</td><td>{job.applications || 0}</td><td><span className={`workspace-status ${job.status === "Published" ? "workspace-status-success" : ""}`}>{job.status}</span></td>
								<td><div className="workspace-table-actions"><Link className="workspace-button" to={`/company/jobs/${job.id}/edit`}>Edit</Link><button className="workspace-button" type="button" onClick={() => updateJob(job, { status: job.status === "Published" ? "Paused" : "Published" })}>{job.status === "Published" ? "Pause" : "Publish"}</button><button className="workspace-button workspace-button-danger" type="button" onClick={() => removeJob(job)}>Delete</button></div></td>
							</tr>
						))}
						{!filteredJobs.length && <tr><td colSpan="5" className="workspace-empty">No roles match these filters.</td></tr>}
					</tbody>
				</table>
			</div>
		</section>
	);
}