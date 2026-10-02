import { NavLink } from "react-router-dom";
import "./AdminSidebar.css";

const items = [
  ["/admin", "Dashboard", true],
  ["/admin/users", "Users"],
  ["/admin/companies", "Companies"],
  ["/admin/jobs", "Jobs"],
  ["/admin/applications", "Applications"],
  ["/admin/reports", "Reports"],
  ["/admin/categories", "Categories"],
  ["/admin/skills", "Skills"],
  ["/admin/audit-logs", "Audit Logs"],
  ["/admin/notifications", "Notifications", false, 1], // The '1' is the notification badge
  ["/admin/settings", "Settings"],
];

export default function AdminSidebar({ open, onClose, adminName, onLogout }) {
  return (
    <>
      <button className={`admin-overlay ${open ? "open" : ""}`} onClick={onClose} aria-label="Close navigation" />
      <aside className={`admin-sidebar ${open ? "open" : ""}`}>
        <a className="admin-brand" href="/admin">CareerLens</a>
        
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
          <select className="demo-select" defaultValue="admin">
            <option value="admin">admin</option>
          </select>
          
          <div className="user-profile">
            <div className="user-info">
              <strong>Platform Admin</strong>
              <span>{adminName || "admin"}</span>
            </div>
            <button className="logout-btn" onClick={onLogout}>Log out</button>
          </div>
        </div>
      </aside>
    </>
  );
}
