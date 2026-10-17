import { useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useLanguage } from "../../context/LanguageContext";
import ThemeLanguageToggle from "../common/ThemeLanguageToggle";
import "./CandidateHeader.css";

export default function CandidateHeader({ onMenuClick }) {
  const { user } = useAuth();
  const location = useLocation();
  const { t } = useLanguage();

  // Helper to determine page title from URL
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === "/candidate") return t("nav.dashboard");
    if (path.includes("/profile")) return t("nav.myProfile");
    if (path.includes("/resume")) return t("nav.resume");
    if (path.includes("/jobs")) return t("nav.findJobs");
    if (path.includes("/applications")) return t("nav.myApplications");
    if (path.includes("/saved-jobs")) return t("nav.savedJobs");
    if (path.includes("/interviews")) return t("nav.interviews");
    if (path.includes("/messages")) return t("nav.messages");
    if (path.includes("/notifications")) return t("nav.notifications");
    if (path.includes("/settings")) return t("nav.settings");
    return t("nav.dashboard");
  };

  // Get first letter of full name for avatar
  const initial = user?.full_name ? user.full_name.charAt(0) : "U";

  return (
    <header className="header">
      <div className="header__left">
        <button
          className="header__menu-btn"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: "24px", height: "24px" }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>
      </div>

      <div className="header__right">
        <ThemeLanguageToggle />
        <div className="header__user">
          <span className="header__user-name">{user?.full_name || "User"}</span>
          <div className="header__avatar">{initial}</div>
        </div>
      </div>
    </header>
  );
}