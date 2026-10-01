import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import JobForm from "../../components/company/JobForm";
import { getDemoCollection, saveDemoCollection } from "../../services/member3DemoStore";
import "./EditJob.css";


export default function EditJob() {
	const { id } = useParams();
	const navigate = useNavigate();
	const [job] = useState(() => getDemoCollection("jobs").find((item) => item.id === id));

	const updateJob = (values) => {
		const jobs = getDemoCollection("jobs").map((item) => item.id === id ? { ...item, ...values } : item);
		saveDemoCollection("jobs", jobs);
		navigate("/company/jobs");
	};

	return (
		<section className="workspace-page">
			<div className="demo-label">Demo data · Changes stay in this browser</div>
			{job ? <>
				<div className="workspace-heading"><div><h1>Edit job</h1><p>Update the role description and posting details.</p></div></div>
				<JobForm initialJob={job} onSubmit={updateJob} submitLabel="Save changes" />
			</> : <div className="workspace-panel"><h1>Job not found</h1><p className="workspace-muted">This role may have been removed.</p><Link className="workspace-button" to="/company/jobs">Back to jobs</Link></div>}
		</section>
	);
}