import { NavLink } from "react-router-dom";
import logoIcon from "../../assets/logo/logo.webp";
import "./AdminSidebar.css";
import { useAuth } from "../../hooks/useAuth";

const items = [
  ["/admin", "Dashboard", true],
  ["/admin/users", "Users"],
  ["/admin/candidates", "Candidates"],
  ["/admin/companies", "Companies"],
  ["/admin/verification", "Verification"],
  ["/admin/jobs", "Jobs"],
  ["/admin/applications", "Applications"],
  ["/admin/reports", "Reports"],
  ["/admin/categories", "Categories"],
  ["/admin/skills", "Skills"],
  ["/admin/audit-logs", "Audit Logs"],
  ["/admin/notifications", "Notifications", false, 1],
  ["/admin/settings", "Settings"],
];

export default function AdminSidebar({ open, onClose, adminName, onLogout }) {
  const { user, switchRole } = useAuth();
  
  return (
    <>
      <button className={`admin-overlay ${open ? "open" : ""}`} onClick={onClose} aria-label="Close navigation" />
      <aside className={`admin-sidebar ${open ? "open" : ""}`}>
        <a className="admin-brand" href="/admin">
          <img src={logoIcon} alt="CareerLens Logo" className="brand-logo" />
          <span className="brand-text">
            <span className="brand-career">Career</span>
            <span className="brand-lens">Lens</span>
          </span>
        </a>
        
        <nav className="admin-nav" aria-label="Admin navigation">
          {items.map(([to, label, end, badge]) => (
            <NavLink key={to} to={to} end={end} onClick={onClose} className={({ isActive }) => isActive ? "active" : ""}>
              {label}
              {badge && <span className="nav-badge">{badge}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="admin-sidebar-foot">
          <div className="demo-mode-label">DEMO MODE</div>
          <select 
            className="demo-select" 
            value={user?.role || "admin"}
            onChange={(e) => switchRole(e.target.value)}
          >
            <option value="candidate">candidate</option>
            <option value="company">company</option>
            <option value="admin">admin</option>
          </select>
          
          <div className="user-profile">
            <div className="user-info">
              <strong>Platform Admin</strong>
              <span>{user?.full_name || adminName || "admin"}</span>
            </div>
            <button type="button" className="logout-btn" onClick={onLogout}>Log out</button>
          </div>
        </div>
      </aside>
    </>
  );
}
