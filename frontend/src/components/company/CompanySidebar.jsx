import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import "./CompanySidebar.css";
import { useAuth } from "../../hooks/useAuth";
import { useLanguage } from "../../context/LanguageContext";
import { getNotifications } from "../../services/candidateService";
import { extractResults } from "../../services/api";
import logoIcon from "../../assets/logo/logo.webp";

export default function CompanySidebar() {
  const { user, switchRole, logout } = useAuth();
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
    ["/company", t("nav.dashboard"), true],
    ["/company/jobs", t("nav.jobs")],
    ["/company/applicants", t("nav.applicants")],
    ["/company/interviews", t("nav.interviews")],
    ["/company/messages", t("nav.messages")],
    ["/company/profile", t("nav.companyProfile")],
    ["/company/talent-pool", t("nav.talentPool")],
    ["/company/reports", t("nav.reports")],
    ["/company/notifications", t("nav.notifications"), false, unreadCount > 0 ? unreadCount : null],
    ["/company/settings", t("nav.settings")],
  ];

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
        {items.map(([to, label, end, badge]) => (
          <NavLink key={to} to={to} end={end}>
            {label}
            {badge && <span className="nav-badge">{badge}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="company-sidebar-foot">
        <div className="demo-mode-label">{t("common.roleSwitcher")}</div>
        <select
          className="role-selector"
          value={user?.role || "company"}
          onChange={(e) => switchRole(e.target.value)}
        >
          <option value="candidate">{t("auth.roleCandidate")}</option>
          <option value="company">{t("auth.roleCompany")}</option>
          <option value="admin">{t("common.platformAdmin")}</option>
        </select>

        <div className="user-info-row">
          <div className="user-details">
            <div className="user-name">
              {user?.full_name || user?.username || "Company"}
            </div>
            <div className="user-role">{user?.role || "company"}</div>
          </div>
          <button className="logout-btn" onClick={logout}>
            {t("common.logOut")}
          </button>
        </div>
      </div>
    </aside>
  );
}