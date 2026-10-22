import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Sparkles,
  Search,
  FileText,
  Bookmark,
  CalendarCheck,
  MessageSquare,
  User,
  FileUser,
  FileCheck,
  History,
  Compass,
  Bell,
  Settings,
} from 'lucide-react';
import CollapsibleSidebar from '../common/CollapsibleSidebar';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../context/LanguageContext';
import { getNotifications } from '../../services/candidateService';
import { extractResults } from '../../services/api';

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
    { to: '/candidate', label: t('nav.dashboard') || 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/candidate/career-roadmap', label: 'Career Roadmap', icon: Compass },
    { to: '/candidate/best-fit-jobs', label: 'Best-Fit Jobs', icon: Sparkles },
    { to: '/candidate/jobs', label: t('nav.findJobs') || 'Find Jobs', icon: Search },
    { to: '/candidate/applications', label: t('nav.myApplications') || 'My Applications', icon: FileText },
    { to: '/candidate/saved-jobs', label: t('nav.savedJobs') || 'Saved Jobs', icon: Bookmark },
    { to: '/candidate/interviews', label: t('nav.interviews') || 'Interviews', icon: CalendarCheck },
    { to: '/candidate/messages', label: t('nav.messages') || 'Messages', icon: MessageSquare },
    { to: '/candidate/profile', label: t('nav.myProfile') || 'My Profile', icon: User },
    { to: '/candidate/resume', label: t('nav.resume') || 'Resume', icon: FileUser },
    { to: '/candidate/cv-studio', label: 'CV Studio', icon: FileCheck },
    { to: '/candidate/cv-versions', label: 'CV Versions', icon: History },
    {
      to: '/candidate/notifications',
      label: t('nav.notifications') || 'Notifications',
      icon: Bell,
      badge: unreadCount > 0 ? unreadCount : null,
    },
    { to: '/candidate/settings', label: t('nav.settings') || 'Settings', icon: Settings },
  ];

  return (
    <CollapsibleSidebar
      brandHref="/candidate"
      items={items}
      isOpen={isMenuOpen}
      onClose={onClose}
      user={user}
      onLogout={logout}
      switchRole={switchRole}
      currentRole="candidate"
    />
  );
}