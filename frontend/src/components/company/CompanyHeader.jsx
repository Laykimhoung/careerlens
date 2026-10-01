import "./CompanyHeader.css";

export default function CompanyHeader() {
	return (
		<header className="company-topbar">
			<div>
				<strong>Northstar Labs</strong>
				<small>Recruitment workspace</small>
			</div>
			<span className="workspace-status workspace-status-warning">Demo workspace</span>
		</header>
	);
}