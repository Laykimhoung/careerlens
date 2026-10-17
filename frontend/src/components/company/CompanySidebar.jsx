import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Briefcase,
  Users,
  CalendarCheck,
  MessageSquare,
  Building2,
  Compass,
  BarChart3,
  Bell,
  Settings,
} from 'lucide-react';
import CollapsibleSidebar from '../common/CollapsibleSidebar';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../context/LanguageContext';
import { getNotifications } from '../../services/candidateService';
import { extractResults } from '../../services/api';

export default function CompanySidebar({ isOpen = false, open, onClose }) {
  const isMenuOpen = Boolean(open || isOpen);
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
    { to: '/company', label: t('nav.dashboard') || 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/company/jobs', label: t('nav.jobs') || 'Jobs', icon: Briefcase },
    { to: '/company/applicants', label: t('nav.applicants') || 'Applicants', icon: Users },
    { to: '/company/interviews', label: t('nav.interviews') || 'Interviews', icon: CalendarCheck },
    { to: '/company/messages', label: t('nav.messages') || 'Messages', icon: MessageSquare },
    { to: '/company/profile', label: t('nav.companyProfile') || 'Company Profile', icon: Building2 },
    { to: '/company/talent-pool', label: t('nav.talentPool') || 'Talent Pool', icon: Compass },
    { to: '/company/reports', label: t('nav.reports') || 'Reports', icon: BarChart3 },
    {
      to: '/company/notifications',
      label: t('nav.notifications') || 'Notifications',
      icon: Bell,
      badge: unreadCount > 0 ? unreadCount : null,
    },
    { to: '/company/settings', label: t('nav.settings') || 'Settings', icon: Settings },
  ];

  return (
    <CollapsibleSidebar
      brandHref="/company"
      items={items}
      isOpen={isMenuOpen}
      onClose={onClose}
      user={user}
      onLogout={logout}
      switchRole={switchRole}
      currentRole="company"
    />
  );
}