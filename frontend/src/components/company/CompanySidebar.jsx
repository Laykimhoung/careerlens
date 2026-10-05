import { NavLink } from "react-router-dom";
import logoIcon from "../../assets/logo/logo.webp";
import "./CompanySidebar.css";
import { useAuth } from "../../hooks/useAuth";

const items = [
	["/company", "Overview", true],
	["/company/profile", "Company profile"],
	["/company/jobs", "Job postings"],
	["/company/applicants", "Applicants"],
	["/company/interviews", "Interviews"],
];

export default function CompanySidebar() {
    const { user, switchRole } = useAuth();

	return (
		<aside className="company-sidebar">
			<a className="company-brand" href="/company">
				<img src={logoIcon} alt="CareerLens Logo" className="brand-logo" />
				<span className="brand-text">
					<span className="brand-career">Career</span>
					<span className="brand-lens">Lens</span>
				</span>
			</a>
			<nav className="company-nav" aria-label="Company navigation">
				{items.map(([to, label, end]) => (
					<NavLink key={to} to={to} end={end}>{label}</NavLink>
				))}
			</nav>
			<div className="company-sidebar-foot" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <select 
                    style={{ padding: '6px', borderRadius: '4px', color: '#000', fontSize: '13px', width: '100%', cursor: 'pointer' }}
                    value={user?.role || "company"}
                    onChange={(e) => switchRole(e.target.value)}
                >
                    <option value="candidate">candidate</option>
                    <option value="company">company</option>
                    <option value="admin">admin</option>
                </select>
                <div style={{ opacity: 0.7, fontSize: '12px' }}>Company workspace &middot; Demo</div>
            </div>
		</aside>
	);
}