import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Building2,
  BadgeCheck,
  Briefcase,
  FileText,
  BarChart3,
  FolderTree,
  Sparkles,
  ScrollText,
  Bell,
  Settings,
} from 'lucide-react';
import CollapsibleSidebar from '../common/CollapsibleSidebar';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../context/LanguageContext';
import { getNotifications } from '../../services/candidateService';
import { extractResults } from '../../services/api';

export default function AdminSidebar({ open, onClose, adminName, onLogout }) {
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
    { to: '/admin', label: t('nav.dashboard') || 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/admin/users', label: t('nav.users') || 'Users', icon: Users },
    { to: '/admin/candidates', label: t('nav.candidates') || 'Candidates', icon: GraduationCap },
    { to: '/admin/companies', label: t('nav.companies') || 'Companies', icon: Building2 },
    { to: '/admin/verification', label: t('nav.verification') || 'Verification', icon: BadgeCheck },
    { to: '/admin/jobs', label: t('nav.jobs') || 'Jobs', icon: Briefcase },
    { to: '/admin/applications', label: t('nav.applications') || 'Applications', icon: FileText },
    { to: '/admin/reports', label: t('nav.reports') || 'Reports', icon: BarChart3 },
    { to: '/admin/categories', label: t('nav.categories') || 'Categories', icon: FolderTree },
    { to: '/admin/skills', label: t('nav.skills') || 'Skills', icon: Sparkles },
    { to: '/admin/audit-logs', label: t('nav.auditLogs') || 'Audit Logs', icon: ScrollText },
    {
      to: '/admin/notifications',
      label: t('nav.notifications') || 'Notifications',
      icon: Bell,
      badge: unreadCount > 0 ? unreadCount : null,
    },
    { to: '/admin/settings', label: t('nav.settings') || 'Settings', icon: Settings },
  ];

  return (
    <CollapsibleSidebar
      brandHref="/admin"
      items={items}
      isOpen={open}
      onClose={onClose}
      user={user}
      onLogout={onLogout || logout}
      switchRole={switchRole}
      currentRole="admin"
    />
  );
}
