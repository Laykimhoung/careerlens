import { useNavigate } from "react-router-dom";
import JobForm from "../../components/company/JobForm";
import { getDemoCollection, saveDemoCollection } from "../../services/member3DemoStore";
import "./CreateJob.css";


export default function CreateJob() {
	const navigate = useNavigate();

	const createJob = (values) => {
		const jobs = getDemoCollection("jobs");
		saveDemoCollection("jobs", [{
			...values,
			id: `job-${Date.now()}`,
			applications: 0,
			status: "Draft",
			createdAt: new Date().toISOString().slice(0, 10),
		}, ...jobs]);
		navigate("/company/jobs");
	};

	return (
		<section className="workspace-page">
			<div className="demo-label">Demo data · Changes stay in this browser</div>
			<div className="workspace-heading"><div><h1>Create a job</h1><p>Draft the role before publishing it to candidates.</p></div></div>
			<JobForm onSubmit={createJob} submitLabel="Save as draft" />
		</section>
	);
}