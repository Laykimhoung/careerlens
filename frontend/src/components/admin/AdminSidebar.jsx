import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import logoIcon from "../../assets/logo/logo.webp";
import "./AdminSidebar.css";
import { useAuth } from "../../hooks/useAuth";
import { useLanguage } from "../../context/LanguageContext";
import { getNotifications } from "../../services/candidateService";
import { extractResults } from "../../services/api";

export default function AdminSidebar({ open, onClose, adminName, onLogout }) {
  const { user, switchRole } = useAuth();
  const { t } = useLanguage();
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
    ["/admin", t("nav.dashboard"), true],
    ["/admin/users", t("nav.users")],
    ["/admin/candidates", t("nav.candidates")],
    ["/admin/companies", t("nav.companies")],
    ["/admin/verification", t("nav.verification")],
    ["/admin/jobs", t("nav.jobs")],
    ["/admin/applications", t("nav.applications")],
    ["/admin/reports", t("nav.reports")],
    ["/admin/categories", t("nav.categories")],
    ["/admin/skills", t("nav.skills")],
    ["/admin/audit-logs", t("nav.auditLogs")],
    ["/admin/notifications", t("nav.notifications"), false, unreadCount > 0 ? unreadCount : null],
    ["/admin/settings", t("nav.settings")],
  ];

  return (
    <>
      <button
        className={`admin-overlay ${open ? "open" : ""}`}
        onClick={onClose}
        aria-label="Close navigation"
      />
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

        <div className="admin-sidebar-foot">
          <div className="demo-mode-label">{t("common.roleSwitcher")}</div>
          <select
            className="demo-select"
            value={user?.role || "admin"}
            onChange={(e) => switchRole(e.target.value)}
          >
            <option value="candidate">{t("auth.roleCandidate")}</option>
            <option value="company">{t("auth.roleCompany")}</option>
            <option value="admin">{t("common.platformAdmin")}</option>
          </select>

          <div className="user-profile">
            <div className="user-info">
              <strong>{t("common.platformAdmin")}</strong>
              <span>{user?.full_name || adminName || user?.username || "admin"}</span>
            </div>
            <button type="button" className="logout-btn" onClick={onLogout}>
              {t("common.logOut")}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
