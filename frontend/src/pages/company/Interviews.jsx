import { useState } from "react";
import InterviewCard from "../../components/company/InterviewCard";
import { getDemoCollection, saveDemoCollection } from "../../services/member3DemoStore";
import "./Interviews.css";


export default function Interviews() {
	const [interviews, setInterviews] = useState(() => getDemoCollection("interviews"));
	const applicants = getDemoCollection("applicants");

	const scheduleInterview = (event) => {
		event.preventDefault();
		const form = new FormData(event.currentTarget);
		const applicant = applicants.find((item) => item.id === form.get("applicantId"));
		if (!applicant) return;
		const interview = {
			id: `int-${Date.now()}`,
			candidate: applicant.name,
			role: applicant.jobTitle,
			date: form.get("date"),
			time: form.get("time"),
			format: form.get("format"),
			status: "Scheduled",
		};
		const nextInterviews = [interview, ...interviews];
		setInterviews(nextInterviews);
		saveDemoCollection("interviews", nextInterviews);
		event.currentTarget.reset();
	};

	const cancelInterview = (interview) => {
		const nextInterviews = interviews.map((item) => item.id === interview.id ? { ...item, status: "Cancelled" } : item);
		setInterviews(nextInterviews);
		saveDemoCollection("interviews", nextInterviews);
	};

	return (
		<section className="workspace-page">
			<div className="demo-label">Demo data · Changes stay in this browser</div>
			<div className="workspace-heading"><div><h1>Interviews</h1><p>Coordinate candidate conversations and interview times.</p></div><span className="workspace-status">{interviews.filter((item) => item.status === "Scheduled").length} scheduled</span></div>
			<div className="workspace-split">
				<section className="workspace-panel">
					<h2>Schedule an interview</h2>
					<form onSubmit={scheduleInterview}>
						<div className="workspace-field"><label htmlFor="applicantId">Candidate</label><select id="applicantId" name="applicantId" required defaultValue=""><option value="" disabled>Select a candidate</option>{applicants.map((applicant) => <option key={applicant.id} value={applicant.id}>{applicant.name} · {applicant.jobTitle}</option>)}</select></div>
						<div className="workspace-form-grid">
							<div className="workspace-field"><label htmlFor="date">Date</label><input id="date" name="date" type="date" min={new Date().toISOString().slice(0, 10)} required /></div>
							<div className="workspace-field"><label htmlFor="time">Time</label><input id="time" name="time" type="time" required /></div>
						</div>
						<div className="workspace-field"><label htmlFor="format">Format</label><select id="format" name="format"><option>Video call</option><option>On-site</option><option>Phone call</option></select></div>
						<button className="workspace-button workspace-button-primary" type="submit">Schedule interview</button>
					</form>
				</section>
				<section className="workspace-panel"><h2>Interview schedule</h2><div className="workspace-list">{interviews.map((interview) => <InterviewCard key={interview.id} interview={interview} onCancel={cancelInterview} />)}{!interviews.length && <p className="workspace-empty">No interviews have been scheduled.</p>}</div></section>
			</div>
		</section>
	);
}