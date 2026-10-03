import { NavLink, Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import "./CandidateSidebar.css";

// SVG Icons for navigation
const icons = {
  dashboard: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
  ),
  profile: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  ),
  resume: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  ),
  jobs: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
  ),
  applications: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
    </svg>
  ),
  saved: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
    </svg>
  ),
  logout: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
    </svg>
  )
};

export default function CandidateSidebar({ isOpen, onClose }) {
  const { user, logout, switchRole } = useAuth();

  const navLinks = [
    { to: "/candidate", label: "Dashboard", icon: icons.dashboard, end: true },
    { to: "/candidate/profile", label: "My Profile", icon: icons.profile },
    { to: "/candidate/resume", label: "My Resume", icon: icons.resume },
    { to: "/candidate/jobs", label: "Find Jobs", icon: icons.jobs },
    { to: "/candidate/applications", label: "Applications", icon: icons.applications },
    { to: "/candidate/saved-jobs", label: "Saved Jobs", icon: icons.saved },
  ];

  // Helper to safely handle the role dropdown change
  const handleRoleChange = (e) => {
    switchRole(e.target.value);
  };

  return (
    <>
      <aside className={`sidebar ${isOpen ? "sidebar--open" : ""}`}>
        <div className="sidebar__header">
          <Link to="/" className="sidebar__logo">
            <div className="sidebar__logo-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" d="M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 002.576 2.576l2.846.813a.75.75 0 010 1.442l-2.846.813a3.75 3.75 0 00-2.576 2.576l-.813 2.846a.75.75 0 01-1.442 0l-.813-2.846a3.75 3.75 0 00-2.576-2.576l-2.846-.813a.75.75 0 010-1.442l2.846-.813A3.75 3.75 0 007.466 7.89l.813-2.846A.75.75 0 019 4.5zM18 1.5a.75.75 0 01.728.568l.258 1.036a2.25 2.25 0 001.91 1.91l1.036.258a.75.75 0 010 1.456l-1.036.258a2.25 2.25 0 00-1.91 1.91l-.258 1.036a.75.75 0 01-1.456 0l-.258-1.036a2.25 2.25 0 00-1.91-1.91l-1.036-.258a.75.75 0 010-1.456l1.036-.258a2.25 2.25 0 001.91-1.91l.258-1.036A.75.75 0 0118 1.5z" clipRule="evenodd" />
              </svg>
            </div>
            <span>CareerLens</span>
          </Link>
          <button className="sidebar__close" onClick={onClose} aria-label="Close menu">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: "24px", height: "24px" }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="sidebar__nav">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) => `sidebar__link ${isActive ? "active" : ""}`}
            >
              {link.icon}
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar__footer">
          <select 
            className="sidebar__role-switcher" 
            value={user?.role === "candidate" ? "student" : (user?.role || "student")} 
            onChange={(e) => handleRoleChange(e.target.value === "student" ? "candidate" : e.target.value)}
          >
            <option value="student">student</option>
            <option value="company">company</option>
            <option value="admin">admin</option>
          </select>

          <div className="sidebar__user-profile">
            <div className="sidebar__user-info">
              <span className="sidebar__user-name">{user?.full_name || "Dara Sok"}</span>
              <span className="sidebar__user-role">{user?.role === "candidate" ? "student" : (user?.role || "student")}</span>
            </div>
            <button onClick={logout} className="sidebar__logout-btn">
              Log out
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      <div 
        className={`sidebar-overlay ${isOpen ? "sidebar-overlay--visible" : ""}`} 
        onClick={onClose}
        aria-hidden="true"
      />
    </>
  );
}