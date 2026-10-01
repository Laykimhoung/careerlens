import { NavLink } from "react-router-dom";
import "./CompanySidebar.css";


const items = [
	["/company", "Overview", true],
	["/company/profile", "Company profile"],
	["/company/jobs", "Job postings"],
	["/company/applicants", "Applicants"],
	["/company/interviews", "Interviews"],
];

export default function CompanySidebar() {
	return (
		<aside className="company-sidebar">
			<a className="company-brand" href="/company">Career<span>Lens</span></a>
			<nav className="company-nav" aria-label="Company navigation">
				{items.map(([to, label, end]) => (
					<NavLink key={to} to={to} end={end}>{label}</NavLink>
				))}
			</nav>
			<div className="company-sidebar-foot">Company workspace · Demo data</div>
		</aside>
	);
}