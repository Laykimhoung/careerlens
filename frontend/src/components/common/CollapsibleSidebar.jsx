import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import logoIcon from '../../assets/logo/logo.webp';
import './CollapsibleSidebar.css';

/**
 * CollapsibleSidebar — Modern icon-only sidebar that smoothly expands on hover.
 * When hovered, the page responds by transitioning its margin-left to prevent overlap.
 */
export default function CollapsibleSidebar({
  brandHref = '/',
  items = [],
  isOpen = false,
  onClose,
  user,
  onLogout,
  switchRole,
  currentRole = 'admin',
}) {
  const { t } = useLanguage();
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseEnter = () => {
    setIsHovered(true);
    document.documentElement.classList.add('sidebar-is-hovered');
    document.body.classList.add('sidebar-is-hovered');
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    document.documentElement.classList.remove('sidebar-is-hovered');
    document.body.classList.remove('sidebar-is-hovered');
  };

  useEffect(() => {
    return () => {
      document.documentElement.classList.remove('sidebar-is-hovered');
      document.body.classList.remove('sidebar-is-hovered');
    };
  }, []);

  const displayName =
    user?.full_name ||
    user?.first_name ||
    user?.username ||
    (currentRole === 'admin'
      ? (t('common.platformAdmin') || 'Platform Admin')
      : currentRole === 'company'
      ? (t('auth.roleCompany') || 'Company')
      : (t('auth.roleCandidate') || 'Candidate'));

  const avatarInitial = displayName.charAt(0).toUpperCase();

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      <button
        type="button"
        className={`collapsible-sidebar-overlay ${isOpen ? 'is-visible' : ''}`}
        onClick={onClose}
        aria-label="Close navigation menu"
      />

      {/* Main Sidebar Element */}
      <aside
        className={`collapsible-sidebar ${isOpen ? 'is-open' : ''} ${isHovered ? 'is-hovered' : ''}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        aria-label="Main Navigation"
      >
        {/* Brand / Logo Section */}
        <a href={brandHref} className="collapsible-sidebar-brand" title="CareerLens Home">
          <div className="brand-icon-wrapper">
            <img src={logoIcon} alt="CareerLens" className="brand-icon-img" />
          </div>
          <div className="brand-text-wrapper">
            <span className="brand-career">Career</span>
            <span className="brand-lens">Lens</span>
          </div>
        </a>

        {/* Navigation Items */}
        <nav className="collapsible-sidebar-nav">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.to} className="nav-item-wrapper">
                <NavLink
                  to={item.to}
                  end={item.end}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `nav-item-link ${isActive ? 'is-active' : ''}`
                  }
                  title={!isHovered && !isOpen ? item.label : undefined}
                >
                  <div className="nav-icon-box" aria-hidden="true">
                    {Icon && <Icon className="nav-icon-svg" size={20} strokeWidth={2} />}
                  </div>

                  <span className="nav-label-text">{item.label}</span>

                  {item.badge && (
                    <span className="nav-badge-pill" aria-label={`${item.badge} notifications`}>
                      {item.badge}
                    </span>
                  )}
                </NavLink>

                {/* Accessible Floating Tooltip (shown when collapsed on desktop) */}
                {!isHovered && !isOpen && (
                  <span className="nav-floating-tooltip" role="tooltip">
                    {item.label}
                    {item.badge && ` (${item.badge})`}
                  </span>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer Section: Role Switcher & User Profile */}
        <div className="collapsible-sidebar-foot">
          {/* Role Switcher */}
          {switchRole && (
            <div className="sidebar-role-box">
              <label htmlFor="sidebar-role-select" className="sidebar-role-label">
                {t('common.roleSwitcher') || t('roleSwitcher') || 'Role Switcher'}
              </label>
              <select
                id="sidebar-role-select"
                className="sidebar-role-select"
                value={user?.role || currentRole}
                onChange={(e) => switchRole(e.target.value)}
              >
                <option value="candidate">{t('auth.roleCandidate') || 'Candidate'}</option>
                <option value="company">{t('auth.roleCompany') || 'Company'}</option>
                <option value="admin">{t('common.platformAdmin') || 'Platform Admin'}</option>
              </select>
            </div>
          )}

          {/* User Profile Info & Logout */}
          <div className="sidebar-user-row">
            <div className="sidebar-user-avatar" title={displayName}>
              {avatarInitial}
              <span className="sidebar-status-dot" aria-hidden="true" />
            </div>

            <div className="sidebar-user-meta">
              <strong className="sidebar-user-name">{displayName}</strong>
              <span className="sidebar-user-role">
                {currentRole === 'admin'
                  ? (t('common.platformAdmin') || 'Platform Admin')
                  : currentRole === 'company'
                  ? (t('auth.roleCompany') || 'Company')
                  : (t('auth.roleCandidate') || 'Candidate')}
              </span>
            </div>

            {onLogout && (
              <button
                type="button"
                className="sidebar-logout-btn"
                onClick={onLogout}
                title={t('common.logOut') || 'Log Out'}
                aria-label="Log out of CareerLens"
              >
                <LogOut size={18} strokeWidth={2} />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
