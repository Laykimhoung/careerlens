import "./JobForm.css";

export default function JobForm({ initialJob = {}, onSubmit, submitLabel = "Save job" }) {
	const handleSubmit = (event) => {
		event.preventDefault();
		const formData = new FormData(event.currentTarget);
		onSubmit?.(Object.fromEntries(formData.entries()));
	};

	return (
		<form className="workspace-panel" onSubmit={handleSubmit}>
			<div className="workspace-form-grid">
				<div className="workspace-field"><label htmlFor="title">Job title</label><input id="title" name="title" defaultValue={initialJob.title || ""} required /></div>
				<div className="workspace-field"><label htmlFor="department">Department</label><input id="department" name="department" defaultValue={initialJob.department || ""} required /></div>
				<div className="workspace-field"><label htmlFor="type">Employment type</label><select id="type" name="type" defaultValue={initialJob.type || "Full-time"}><option>Full-time</option><option>Part-time</option><option>Contract</option><option>Internship</option></select></div>
				<div className="workspace-field"><label htmlFor="location">Location</label><input id="location" name="location" defaultValue={initialJob.location || ""} required /></div>
			</div>
			<div className="workspace-field"><label htmlFor="description">Role description</label><textarea id="description" name="description" defaultValue={initialJob.description || ""} required /></div>
			<div className="workspace-actions"><button className="workspace-button workspace-button-primary" type="submit">{submitLabel}</button></div>
		</form>
	);
}