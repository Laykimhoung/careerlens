import "./CompanyProfileCard.css";

export default function CompanyProfileCard({ profile }) {
	if (!profile) return null;

	return (
		<section className="workspace-panel">
			<h2>Public company profile</h2>
			<h3>{profile.companyName}</h3>
			<p>{profile.industry} · {profile.size}</p>
			<div className="workspace-row"><span className="workspace-muted">Location</span><strong>{profile.location || "Not set"}</strong></div>
			<div className="workspace-row"><span className="workspace-muted">Contact</span><strong>{profile.contactEmail || "Not set"}</strong></div>
			{profile.website && <a className="workspace-button" href={profile.website} target="_blank" rel="noreferrer">Visit website</a>}
			<p>{profile.description}</p>
		</section>
	);
}