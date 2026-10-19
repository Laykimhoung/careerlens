import "./CompanyProfileCard.css";

export default function CompanyProfileCard({ profile, logo }) {
	if (!profile) return null;

	const companyLogo = logo || (typeof window !== "undefined" ? localStorage.getItem("careerlens_company_logo") : null);

	return (
		<section className="workspace-panel">
			<h2>Public company profile</h2>
			<div style={{ display: "flex", alignItems: "center", gap: "14px", margin: "16px 0" }}>
				{companyLogo ? (
					<img
						src={companyLogo}
						alt={profile.companyName || "Company Logo"}
						style={{
							width: "60px",
							height: "60px",
							borderRadius: "10px",
							objectFit: "cover",
							border: "1px solid var(--color-border)",
							backgroundColor: "var(--color-surface)",
						}}
					/>
				) : (
					<div
						style={{
							width: "60px",
							height: "60px",
							borderRadius: "10px",
							background: "rgba(1, 107, 251, 0.12)",
							color: "var(--color-primary, #016BFB)",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							fontSize: "24px",
							fontWeight: 700,
							border: "1px solid rgba(1, 107, 251, 0.25)",
						}}
					>
						{profile.companyName ? profile.companyName.charAt(0).toUpperCase() : "C"}
					</div>
				)}
				<div>
					<h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700 }}>{profile.companyName || "Company Name"}</h3>
					<p style={{ margin: "2px 0 0", fontSize: "13px", color: "var(--color-text-secondary)" }}>
						{profile.industry || "Industry"} · {profile.size || "Company Size"}
					</p>
				</div>
			</div>
			<div className="workspace-row"><span className="workspace-muted">Location</span><strong>{profile.location || "Not set"}</strong></div>
			<div className="workspace-row"><span className="workspace-muted">Contact</span><strong>{profile.contactEmail || "Not set"}</strong></div>
			{profile.website && <a className="workspace-button" href={profile.website} target="_blank" rel="noreferrer">Visit website</a>}
			<p style={{ marginTop: "14px" }}>{profile.description}</p>
		</section>
	);
}