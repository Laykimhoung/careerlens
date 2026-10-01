import { useState } from "react";
import ApplicantTable from "../../components/company/ApplicantTable";
import ApplicantBoard from "../../components/company/ApplicantBoard";
import { getDemoCollection, saveDemoCollection } from "../../services/member3DemoStore";
import "./Applicants.css";


export default function Applicants() {
	const [applicants, setApplicants] = useState(() => getDemoCollection("applicants"));
	const [query, setQuery] = useState("");
	const [status, setStatus] = useState("All statuses");
	const [viewMode, setViewMode] = useState("board"); // "table" or "board"

	const filteredApplicants = applicants.filter((applicant) => {
		const matchesQuery = `${applicant.name} ${applicant.email} ${applicant.jobTitle}`.toLowerCase().includes(query.toLowerCase());
		return matchesQuery && (status === "All statuses" || applicant.status === status);
	});

	const updateStatus = (applicant, nextStatus) => {
		const updated = applicants.map((item) => item.id === applicant.id ? { ...item, status: nextStatus } : item);
		setApplicants(updated);
		saveDemoCollection("applicants", updated);
	};

	return (
		<section className="workspace-page">
			<div className="demo-label">Demo data • Changes stay in this browser</div>
			<div className="workspace-heading">
				<div>
					<h1>Applicants</h1>
					<p>Review candidates across your open roles.</p>
				</div>
				<span className="workspace-status">{applicants.length} total</span>
			</div>
			
			<div className="workspace-toolbar" style={{ justifyContent: "space-between", display: "flex" }}>
				<div style={{ display: "flex", gap: "10px" }}>
					<input aria-label="Search applicants" placeholder="Search name, email, or role" value={query} onChange={(event) => setQuery(event.target.value)} />
					<select aria-label="Filter applicants by status" value={status} onChange={(event) => setStatus(event.target.value)}>
						<option>All statuses</option>
						<option>New</option>
						<option>Reviewing</option>
						<option>Interview</option>
						<option>Offer</option>
						<option>Rejected</option>
					</select>
				</div>
				
				<div className="view-toggle">
					<button 
						className={viewMode === "board" ? "active" : ""} 
						onClick={() => setViewMode("board")}
					>
						Board
					</button>
					<button 
						className={viewMode === "table" ? "active" : ""} 
						onClick={() => setViewMode("table")}
					>
						Table
					</button>
				</div>
			</div>

			{viewMode === "board" ? (
				<ApplicantBoard applicants={filteredApplicants} onStatusChange={updateStatus} />
			) : (
				<ApplicantTable applicants={filteredApplicants} onStatusChange={updateStatus} />
			)}
		</section>
	);
}
