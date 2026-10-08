import { NavLink } from "react-router-dom";
import "./CompanySidebar.css";
import { useAuth } from "../../hooks/useAuth";

const items = [
  ["/company", "Dashboard", true],
  ["/company/jobs", "Jobs"],
  ["/company/applicants", "Applicants"],
  ["/company/interviews", "Interviews"],
  ["/company/messages", "Messages"],
  ["/company/profile", "Company Profile"],
  ["/company/talent-pool", "Talent Pool"],
  ["/company/reports", "Reports"],
  ["/company/notifications", "Notifications", false, 3], // 3 is the badge
  ["/company/settings", "Settings"],
];

export default function CompanySidebar() {
  const { user, switchRole, logout } = useAuth();

  return (
    <aside className="company-sidebar">
      <a className="company-brand" href="/company">
        <span className="brand-text">
          <span className="brand-career">Career</span>
          <span className="brand-lens">Lens</span>
        </span>
      </a>
      
      <nav className="company-nav" aria-label="Company navigation">
        {items.map(([to, label, end, badge]) => (
          <NavLink key={to} to={to} end={end}>
            {label}
            {badge && <span className="nav-badge">{badge}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="company-sidebar-foot">
        <div className="demo-mode-label">DEMO MODE</div>
        <select 
          className="role-selector"
          value={user?.role || "company"}
          onChange={(e) => switchRole(e.target.value)}
        >
          <option value="candidate">candidate</option>
          <option value="company">company</option>
          <option value="admin">admin</option>
        </select>
        
        <div className="user-info-row">
          <div className="user-details">
            <div className="user-name">{user?.full_name || "TechNova Cambodia"}</div>
            <div className="user-role">{user?.role || "company"}</div>
          </div>
          <button className="logout-btn" onClick={logout}>Log out</button>
        </div>
      </div>
    </aside>
  );
}