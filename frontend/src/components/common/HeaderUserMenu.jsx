import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogOut, User, Settings, ChevronDown, Shield, Building2, Briefcase } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../context/LanguageContext';
import './HeaderUserMenu.css';

/**
 * HeaderUserMenu — Universal interactive user profile dropdown & logout control
 * with prominent icon + text logout button for all CareerLens roles.
 */
export default function HeaderUserMenu({ role = 'candidate' }) {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  // Universal avatar resolver across Candidate, Company, and Admin roles
  const getStoredAvatar = (usr) => {
    if (typeof window === 'undefined') return '';
    const uid = usr?.id;
    return (
      (uid ? localStorage.getItem(`careerlens_avatar_${uid}`) : null) ||
      (uid ? localStorage.getItem(`careerlens_admin_avatar_${uid}`) : null) ||
      (uid ? localStorage.getItem(`careerlens_company_logo_${uid}`) : null) ||
      localStorage.getItem('careerlens_avatar') ||
      localStorage.getItem('careerlens_admin_avatar') ||
      localStorage.getItem('careerlens_company_logo') ||
      usr?.avatar ||
      usr?.profile_picture ||
      usr?.logo ||
      ''
    );
  };

  const [avatar, setAvatar] = useState(() => getStoredAvatar(user));

  useEffect(() => {
    const handleUpdate = (e) => {
      if (e?.detail?.avatar !== undefined) {
        setAvatar(e.detail.avatar);
      } else {
        setAvatar(getStoredAvatar(user));
      }
    };

    handleUpdate();
    window.addEventListener('careerlens_profile_image_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('careerlens_profile_image_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [user]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setIsOpen(false);
    try {
      await logout();
    } catch {
      // ignore API logout errors
    } finally {
      navigate('/login');
    }
  };

  const displayName = user?.full_name || user?.name || user?.username || (role === 'admin' ? 'Administrator' : 'User');
  const initial = displayName.charAt(0).toUpperCase() || 'U';

  const roleLabels = {
    admin: { label: t('admin.role', 'Administrator'), icon: Shield, badgeClass: 'role-badge--admin' },
    company: { label: t('company.role', 'Employer / Recruiter'), icon: Building2, badgeClass: 'role-badge--company' },
    candidate: { label: t('candidate.role', 'Candidate'), icon: Briefcase, badgeClass: 'role-badge--candidate' },
  };

  const roleInfo = roleLabels[role] || roleLabels.candidate;
  const RoleIcon = roleInfo.icon;

  const profilePath = role === 'admin' ? '/admin/settings' : role === 'company' ? '/company/profile' : '/candidate/profile';
  const settingsPath = role === 'admin' ? '/admin/settings' : role === 'company' ? '/company/settings' : '/candidate/settings';

  return (
    <div className="header-user-wrapper" ref={menuRef}>
      {/* ── Profile Toggle Button ── */}
      <button
        type="button"
        className={`header-user-pill ${isOpen ? 'header-user-pill--active' : ''}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <div className="header-user-avatar">
          {avatar ? (
            <img src={avatar} alt={displayName} />
          ) : (
            <span>{initial}</span>
          )}
        </div>
        <span className="header-user-display-name">{displayName}</span>
        <ChevronDown size={14} className={`header-user-chevron ${isOpen ? 'header-user-chevron--open' : ''}`} />
      </button>

      {/* ── Prominent Dedicated Log Out Button (Icon + Label) ── */}
      <button
        type="button"
        className="header-logout-btn"
        onClick={handleLogout}
        title={t('auth.logout', 'Log Out')}
      >
        <LogOut size={16} className="header-logout-icon" />
        <span className="header-logout-text">{t('auth.logout', 'Log Out')}</span>
      </button>

      {/* ── Interactive Profile Dropdown ── */}
      {isOpen && (
        <div className="header-user-dropdown" role="menu">
          <div className="header-user-dropdown-header">
            <div className="header-user-avatar header-user-avatar--lg">
              {avatar ? (
                <img src={avatar} alt={displayName} />
              ) : (
                <span>{initial}</span>
              )}
            </div>
            <div className="header-user-details">
              <strong className="header-user-full-name">{displayName}</strong>
              <span className="header-user-email">{user?.email || (user?.username ? `@${user.username}` : '')}</span>
              <span className={`header-user-role-badge ${roleInfo.badgeClass}`}>
                <RoleIcon size={11} />
                {roleInfo.label}
              </span>
            </div>
          </div>

          <div className="header-user-dropdown-divider" />

          <div className="header-user-dropdown-links">
            <Link
              to={profilePath}
              className="header-user-dropdown-item"
              onClick={() => setIsOpen(false)}
            >
              <User size={15} />
              <span>{t('nav.myProfile', 'My Profile')}</span>
            </Link>

            <Link
              to={settingsPath}
              className="header-user-dropdown-item"
              onClick={() => setIsOpen(false)}
            >
              <Settings size={15} />
              <span>{t('nav.settings', 'Settings')}</span>
            </Link>
          </div>

          <div className="header-user-dropdown-divider" />

          <button
            type="button"
            className="header-user-dropdown-item header-user-dropdown-item--logout"
            onClick={handleLogout}
          >
            <LogOut size={16} className="header-logout-icon" />
            <span>{t('auth.logout', 'Log Out')}</span>
          </button>
        </div>
      )}
    </div>
  );
}
