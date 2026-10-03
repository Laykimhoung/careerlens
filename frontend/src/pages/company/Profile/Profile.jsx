import { useState } from "react";
import { getDemoCollection, saveDemoCollection } from '../../../services/member3DemoStore';
import CompanyProfileCard from '../../../components/company/CompanyProfileCard';
import './Profile.css';


export default function Profile() {
	const [profile, setProfile] = useState(() => getDemoCollection("profile"));
	const [saved, setSaved] = useState(false);
	const updateField = (event) => {
		setSaved(false);
		setProfile({ ...profile, [event.target.name]: event.target.value });
	};

	const saveProfile = (event) => {
		event.preventDefault();
		saveDemoCollection("profile", profile);
		setSaved(true);
	};

	return (
		<section className="workspace-page">
			<div className="demo-label">Demo data · Changes stay in this browser</div>
			<div className="workspace-heading"><div><h1>Company profile</h1><p>Manage the information candidates see about your organization.</p></div></div>
			{saved && <p className="workspace-status workspace-status-success" role="status">Profile saved in this browser.</p>}
			<div className="workspace-split">
			<form className="workspace-panel" onSubmit={saveProfile}>
				<div className="workspace-form-grid">
					<div className="workspace-field"><label htmlFor="companyName">Company name</label><input id="companyName" name="companyName" value={profile.companyName || ""} onChange={updateField} required /></div>
					<div className="workspace-field"><label htmlFor="industry">Industry</label><input id="industry" name="industry" value={profile.industry || ""} onChange={updateField} required /></div>
					<div className="workspace-field"><label htmlFor="size">Company size</label><select id="size" name="size" value={profile.size || ""} onChange={updateField}><option>1-10 employees</option><option>11-50 employees</option><option>51-200 employees</option><option>201-500 employees</option><option>500+ employees</option></select></div>
					<div className="workspace-field"><label htmlFor="location">Location</label><input id="location" name="location" value={profile.location || ""} onChange={updateField} /></div>
					<div className="workspace-field"><label htmlFor="website">Website</label><input id="website" name="website" type="url" value={profile.website || ""} onChange={updateField} /></div>
					<div className="workspace-field"><label htmlFor="contactEmail">Recruitment email</label><input id="contactEmail" name="contactEmail" type="email" value={profile.contactEmail || ""} onChange={updateField} required /></div>
				</div>
				<div className="workspace-field"><label htmlFor="description">About the company</label><textarea id="description" name="description" value={profile.description || ""} onChange={updateField} /></div>
				<button className="workspace-button workspace-button-primary" type="submit">Save profile</button>
			</form>
			<CompanyProfileCard profile={profile} />
			</div>
		</section>
	);
}