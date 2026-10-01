import "./ApplicationStatus.css";

const statuses = ["New", "Reviewing", "Interview", "Offer", "Rejected"];

export default function ApplicationStatus({ status, onChange }) {
	return (
		<label className="workspace-field">
			<span>Application status</span>
			<select value={status} onChange={(event) => onChange?.(event.target.value)}>
				{statuses.map((value) => <option key={value}>{value}</option>)}
			</select>
		</label>
	);
}