import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { getNotifications } from "../../services/candidateService";
import { extractResults } from "../../services/api";
import logoIcon from "../../assets/logo/logo.webp";
import "./CandidateSidebar.css";

export default function CandidateSidebar({ isOpen, open, onClose }) {
  const isMenuOpen = Boolean(open || isOpen);
  const { user, logout, switchRole } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    getNotifications()
      .then((res) => {
        const list = extractResults(res);
        setUnreadCount(list.filter((n) => !n.is_read).length);
      })
      .catch(() => {});
  }, []);

  const items = [
    ["/candidate", "Dashboard", true],
    ["/candidate/jobs", "Find Jobs"],
    ["/candidate/applications", "My Applications"],
    ["/candidate/saved-jobs", "Saved Jobs"],
    ["/candidate/interviews", "Interviews"],
    ["/candidate/messages", "Messages"],
    ["/candidate/profile", "My Profile"],
    ["/candidate/resume", "Resume"],
    ["/candidate/notifications", "Notifications", false, unreadCount > 0 ? unreadCount : null],
    ["/candidate/settings", "Settings"],
  ];

  return (
    <>
      <button
        type="button"
        className={`candidate-overlay ${isMenuOpen ? "open" : ""}`}
        onClick={onClose}
        aria-label="Close navigation"
      />
      <aside className={`candidate-sidebar ${isMenuOpen ? "open" : ""}`}>
        <a className="candidate-brand" href="/candidate">
          <img src={logoIcon} alt="CareerLens Logo" className="brand-logo" />
          <span className="brand-text">
            <span className="brand-career">Career</span>
            <span className="brand-lens">Lens</span>
          </span>
        </a>

        <nav className="candidate-nav" aria-label="Candidate navigation">
          {items.map(([to, label, end, badge]) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onClose}
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              {label}
              {badge && <span className="nav-badge">{badge}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="candidate-sidebar-foot">
          <div className="demo-mode-label">ROLE SWITCHER</div>
          <select
            className="role-selector"
            value={user?.role || "candidate"}
            onChange={(e) => switchRole(e.target.value)}
          >
            <option value="candidate">candidate</option>
            <option value="company">company</option>
            <option value="admin">admin</option>
          </select>

          <div className="user-info-row">
            <div className="user-details">
              <div className="user-name">
                {user?.full_name || user?.username || "Candidate"}
              </div>
              <div className="user-role">{user?.role || "candidate"}</div>
            </div>
            <button type="button" className="logout-btn" onClick={logout}>
              Log out
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}