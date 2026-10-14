import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useLanguage } from "../../context/LanguageContext";
import { getNotifications } from "../../services/candidateService";
import { extractResults } from "../../services/api";
import logoIcon from "../../assets/logo/logo.webp";
import "./CandidateSidebar.css";

export default function CandidateSidebar({ isOpen, open, onClose }) {
  const isMenuOpen = Boolean(open || isOpen);
  const { user, logout, switchRole } = useAuth();
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
    ["/candidate", t("nav.dashboard"), true],
    ["/candidate/jobs", t("nav.findJobs")],
    ["/candidate/applications", t("nav.myApplications")],
    ["/candidate/saved-jobs", t("nav.savedJobs")],
    ["/candidate/interviews", t("nav.interviews")],
    ["/candidate/messages", t("nav.messages")],
    ["/candidate/profile", t("nav.myProfile")],
    ["/candidate/resume", t("nav.resume")],
    ["/candidate/notifications", t("nav.notifications"), false, unreadCount > 0 ? unreadCount : null],
    ["/candidate/settings", t("nav.settings")],
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
          <div className="demo-mode-label">{t("common.roleSwitcher")}</div>
          <select
            className="role-selector"
            value={user?.role || "candidate"}
            onChange={(e) => switchRole(e.target.value)}
          >
            <option value="candidate">{t("auth.roleCandidate")}</option>
            <option value="company">{t("auth.roleCompany")}</option>
            <option value="admin">{t("common.platformAdmin")}</option>
          </select>

          <div className="user-info-row">
            <div className="user-details">
              <div className="user-name">
                {user?.full_name || user?.username || "Candidate"}
              </div>
              <div className="user-role">{user?.role || "candidate"}</div>
            </div>
            <button type="button" className="logout-btn" onClick={logout}>
              {t("common.logOut")}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}