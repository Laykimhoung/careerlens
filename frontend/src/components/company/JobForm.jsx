import Input from "../common/Input";
import Select from "../common/Select";
import Textarea from "../common/Textarea";
import Button from "../common/Button";
import "./JobForm.css";

export default function JobForm({ initialJob = {}, onSubmit, submitLabel = "Save job" }) {
	const handleSubmit = (event) => {
		event.preventDefault();
		const formData = new FormData(event.currentTarget);
		onSubmit?.(Object.fromEntries(formData.entries()));
	};

	return (
		<form className="workspace-panel company-job-form" onSubmit={handleSubmit}>
			<div className="job-form-grid">
				<Input id="title" label="Job title" defaultValue={initialJob.title || ""} required />
				<Input id="department" label="Department" defaultValue={initialJob.department || ""} required />
				<Select 
					id="type" 
					label="Employment type" 
					defaultValue={initialJob.type || "Full-time"} 
					options={["Full-time", "Part-time", "Contract", "Internship"]}
				/>
				<Input id="location" label="Location" defaultValue={initialJob.location || ""} required />
			</div>
			<Textarea id="description" label="Role description" defaultValue={initialJob.description || ""} required />
			<div className="job-form-actions">
				<Button type="submit" variant="primary">{submitLabel}</Button>
			</div>
		</form>
	);
}