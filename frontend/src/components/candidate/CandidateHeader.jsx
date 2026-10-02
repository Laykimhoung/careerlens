import { useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import "./CandidateHeader.css";

export default function CandidateHeader({ onMenuClick }) {
  const { user } = useAuth();
  const location = useLocation();

  // Helper to determine page title from URL
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === "/candidate") return "Dashboard";
    if (path.includes("/profile")) return "My Profile";
    if (path.includes("/resume")) return "My Resume";
    if (path.includes("/jobs")) return "Find Jobs";
    if (path.includes("/applications")) return "Applications";
    if (path.includes("/saved-jobs")) return "Saved Jobs";
    return "Dashboard";
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
        <h1 className="header__title">{getPageTitle()}</h1>
      </div>
      
      <div className="header__right">
        <div className="header__user">
          <span className="header__user-name">{user?.full_name || "User"}</span>
          <div className="header__avatar">{initial}</div>
        </div>
      </div>
    </header>
  );
}