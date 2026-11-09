import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import {
  Search,
  Bell,
  Star,
  Clock,
  ArrowUpRight,
  RotateCcw,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Building2,
  Users,
  Briefcase,
  TrendingUp,
  Activity,
  Send,
  ExternalLink,
} from 'lucide-react';
import { fetchAdminDashboardData, getAdminNotifications } from '../../../services/adminService';
import { extractResults } from '../../../services/api';
import { resetDemoStore } from '../../../services/member3DemoStore';
import { isDemoModeEnabled } from '../../../config/features';
import { useAuth } from '../../../hooks/useAuth';
import RecruitmentWorkspaceBanner from '../../../components/illustrations/RecruitmentWorkspaceBanner';
import CandidateCareerSpotlight from '../../../components/illustrations/CandidateCareerSpotlight';
import PlatformAnalyticsIllustration from '../../../components/illustrations/PlatformAnalyticsIllustration';
import { useLanguage } from '../../../context/LanguageContext';
import './Dashboard.css';

function CustomBarTooltip({ active, payload }) {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0];
  return (
    <div className="modern-dash-tooltip">
      <span
        className="modern-dash-tooltip-dot"
        style={{ backgroundColor: item.payload?.color || '#016BFB' }}
      />
      <span className="modern-dash-tooltip-label">{item.payload?.name}:</span>
      <strong className="modern-dash-tooltip-val">{item.value}</strong>
    </div>
  );
}

function getAuditBadge(text = '') {
  const upper = text.toUpperCase();
  if (upper.includes('LOGIN') || upper.includes('AUTH') || upper.includes('REGISTER') || upper.includes('USER')) {
    return { label: 'AUTH', color: '#0284C7', bg: 'rgba(2, 132, 199, 0.12)' };
  }
  if (upper.includes('JOB') || upper.includes('POST') || upper.includes('VACANCY')) {
    return { label: 'JOB', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)' };
  }
  if (upper.includes('APPLY') || upper.includes('APPLICATION') || upper.includes('INTERVIEW') || upper.includes('OFFER')) {
    return { label: 'ATS', color: '#10B981', bg: 'rgba(16, 185, 129, 0.12)' };
  }
  if (upper.includes('VERIF') || upper.includes('COMPANY')) {
    return { label: 'VERIFY', color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.12)' };
  }
  return { label: 'SYSTEM', color: '#64748B', bg: 'rgba(100, 116, 139, 0.12)' };
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState('all');
  const [state, setState] = useState({
    loading: true,
    error: null,
    analytics: null,
  });
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);

  const getAdminAvatar = (usr) => {
    const uid = usr?.id;
    return (
      (uid ? localStorage.getItem(`careerlens_admin_avatar_${uid}`) : null) ||
      (uid ? localStorage.getItem(`careerlens_avatar_${uid}`) : null) ||
      localStorage.getItem('careerlens_admin_avatar') ||
      localStorage.getItem('careerlens_avatar') ||
      usr?.avatar ||
      ''
    );
  };

  const [avatar, setAvatar] = useState(() => getAdminAvatar(user));

  useEffect(() => {
    const handleAvatarUpdate = (e) => {
      if (e?.detail?.avatar !== undefined) {
        setAvatar(e.detail.avatar);
      } else {
        setAvatar(getAdminAvatar(user));
      }
    };
    window.addEventListener('careerlens_profile_image_updated', handleAvatarUpdate);
    window.addEventListener('storage', handleAvatarUpdate);
    return () => {
      window.removeEventListener('careerlens_profile_image_updated', handleAvatarUpdate);
      window.removeEventListener('storage', handleAvatarUpdate);
    };
  }, [user]);

  const loadData = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true }));
    try {
      const [result, notifRes] = await Promise.all([
        fetchAdminDashboardData({ dateRange }),
        getAdminNotifications().catch(() => ({ data: [] })),
      ]);
      const notifs = extractResults(notifRes);
      setUnreadNotifCount(notifs.filter((n) => !n.is_read).length);
      setState({
        loading: false,
        error: null,
        analytics: result.analytics,
      });
    } catch (err) {
      setState({
        loading: false,
        error: err.message || 'Failed to load dashboard data.',
        analytics: null,
      });
    }
  }, [dateRange]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const onStorage = () => loadData();
    const handleNotifUpdate = (e) => {
      if (e?.detail?.unreadCount !== undefined) {
        setUnreadNotifCount(e.detail.unreadCount);
      }
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener('careerlens_notifications_updated', handleNotifUpdate);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('careerlens_notifications_updated', handleNotifUpdate);
    };
  }, [loadData]);

  const handleResetDemoData = () => {
    if (!isDemoModeEnabled()) return;
    resetDemoStore();
    loadData();
  };

  const { loading, error, analytics } = state;

  const kpis = analytics?.kpis || {
    totalCandidates: 0,
    totalCompanies: 0,
    verifiedCompanies: 0,
    pendingVerifications: 0,
    totalJobs: 0,
    activeJobs: 0,
    totalApplications: 0,
    interviewsCount: 0,
    hiresCount: 0,
    pendingReviewsTotal: 0,
  };

  const barData = analytics?.charts?.overviewBarData || [
    { name: 'Jan', value: 2, color: '#F97316' },
    { name: 'Feb', value: 3, color: '#F97316' },
    { name: 'Mar', value: 1, color: '#F97316' },
    { name: 'Apr', value: 4, color: '#F97316' },
    { name: 'May', value: 5, color: '#F97316' },
    { name: 'Jun', value: 3, color: '#F97316' },
  ];

  const maxVal = Math.max(5, ...barData.map((d) => d.value || 0));
  const yDomainMax = Math.ceil(maxVal);

  const topCompany =
    analytics?.charts?.topCompanies?.[0]?.company || 'Mekong Digital Labs';

  const logs = analytics?.recent?.auditLogs || [];

  // Active "On Process" Items from real data
  const inProcessItems = useMemo(() => {
    const list = [];
    (analytics?.recent?.applications || []).forEach((app) => {
      if (['Applied', 'Reviewing', 'Screening', 'Interviewing'].includes(app.status)) {
        list.push({
          id: `app-${app.id}`,
          title: app.candidateName,
          subtitle: `${app.jobTitle} · ${app.companyName}`,
          badge: app.status,
          time: app.appliedAt || 'Recent',
          color: app.status === 'Interviewing' ? '#8B5CF6' : '#F59E0B',
          link: '/admin/applications',
        });
      }
    });

    if (kpis.pendingVerifications > 0) {
      list.push({
        id: 'verify-pending',
        title: 'Company Verification Queue',
        subtitle: `${kpis.pendingVerifications} company awaiting review`,
        badge: 'Pending',
        time: 'Action Required',
        color: '#0284C7',
        link: '/admin/verification',
      });
    }

    return list.slice(0, 4);
  }, [analytics, kpis]);

  // Dynamic search filtering for real-time responsiveness
  const filteredProcessItems = useMemo(() => {
    if (!searchQuery.trim()) return inProcessItems;
    const q = searchQuery.toLowerCase().trim();
    return inProcessItems.filter(
      (item) =>
        item.title?.toLowerCase().includes(q) ||
        item.subtitle?.toLowerCase().includes(q) ||
        item.badge?.toLowerCase().includes(q)
    );
  }, [inProcessItems, searchQuery]);

  const filteredLogs = useMemo(() => {
    if (!searchQuery.trim()) return logs;
    const q = searchQuery.toLowerCase().trim();
    return logs.filter(
      (log) =>
        log.text?.toLowerCase().includes(q) ||
        log.timestamp?.toLowerCase().includes(q)
    );
  }, [logs, searchQuery]);

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="modern-dashboard-layout">
      {/* ── Top Header: User Greeting, Search, and Action Controls ─────────── */}
      <header className="modern-dash-header">
        <div className="modern-header-user">
          <div className="modern-avatar-badge" aria-hidden="true" style={{ overflow: 'hidden' }}>
            {avatar ? (
              <img
                src={avatar}
                alt="Admin"
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
              />
            ) : (
              'A'
            )}
          </div>
          <div>
            <div className="modern-greeting-badge-row">
              <h1 className="modern-greeting-title">Welcome, Admin</h1>
              <span className="modern-live-pill" title="Render Web Service active & monitored by UptimeRobot">
                <span className="modern-live-pulse" />
                Live Node
              </span>
            </div>
            <p className="modern-greeting-sub">Platform Operations &amp; Real-Time ATS Management</p>
          </div>
        </div>

        <div className="modern-header-controls">
          <div className="modern-search-box">
            <Search size={18} className="modern-search-icon" />
            <input
              type="search"
              placeholder={t('admin.searchAnything', 'Search anything ...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="modern-search-input"
            />
            {searchQuery && (
              <button
                type="button"
                className="modern-search-clear"
                onClick={() => setSearchQuery('')}
                title="Clear search"
              >
                &times;
              </button>
            )}
          </div>

          <div className="modern-filter-box">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="modern-range-select"
              aria-label="Filter analytics by date range"
            >
              <option value="all">{t('admin.allTime', 'All Time')}</option>
              <option value="90d">{t('admin.last90Days', 'Last 90 Days')}</option>
              <option value="30d">{t('admin.last30Days', 'Last 30 Days')}</option>
              <option value="7d">{t('admin.last7Days', 'Last 7 Days')}</option>
            </select>
          </div>

          <button
            type="button"
            className={`modern-refresh-btn ${loading ? 'modern-refresh-btn--loading' : ''}`}
            onClick={loadData}
            title="Refresh live dashboard"
            aria-label="Refresh live data"
          >
            <RotateCcw size={16} />
          </button>

          <Link to="/admin/notifications" className="modern-notif-bell" title="Notifications">
            <Bell size={20} />
            {unreadNotifCount > 0 && <span className="modern-notif-count">{unreadNotifCount}</span>}
          </Link>
        </div>
      </header>

      {error && (
        <div className="modern-error-banner" role="alert">
          <AlertCircle size={20} />
          <span>{error}</span>
          <button type="button" className="modern-retry-btn" onClick={loadData}>
            Retry
          </button>
        </div>
      )}

      {/* ── Main Workspace: 2-Column Responsive Layout ──────────────────────── */}
      <div className="modern-dash-grid">
        {/* ── LEFT COLUMN (Analytics, Cards & Schedules) ──────────────────── */}
        <div className="modern-left-column">
          {/* Top 3 Cards Row */}
          <div className="modern-cards-row">
            {/* 1. Feature Spotlight Card */}
            <div className="modern-spotlight-card">
              <span className="spotlight-pill">{t('admin.platformHealth', 'Platform Health')}</span>
              <div className="spotlight-illu-box">
                <CandidateCareerSpotlight />
              </div>
              <div className="spotlight-meta">
                <div className="spotlight-stars">
                  <Star size={14} fill="#F59E0B" color="#F59E0B" />
                  <Star size={14} fill="#F59E0B" color="#F59E0B" />
                  <Star size={14} fill="#F59E0B" color="#F59E0B" />
                  <Star size={14} fill="#F59E0B" color="#F59E0B" />
                  <Star size={14} fill="#F59E0B" color="#F59E0B" />
                </div>
                <h2 className="spotlight-title">{t('admin.operationsEngine', 'Operations Engine')}</h2>
                <p className="spotlight-desc">100% verified uptime (Render + UptimeRobot)</p>
                <Link to="/admin/verification" className="spotlight-action-btn">
                  {t('admin.verifyPartners', 'Verify Partners')} &rarr;
                </Link>
              </div>
            </div>

            {/* 2. Center Overviews Bar Chart */}
            <div className="modern-overview-chart-card">
              <div className="overview-chart-header">
                <div>
                  <h2 className="overview-chart-title">{t('admin.platformOverviews', 'Platform Overviews')}</h2>
                  <p className="overview-chart-subtitle">{t('admin.platformOverviewsSub', 'Real-time volume across all entities')}</p>
                </div>
                <span className="overview-chart-pill">{kpis.totalApplications} {t('admin.appsCount', 'Total Apps')}</span>
              </div>

              <div className="overview-chart-box">
                <ResponsiveContainer width="100%" height={170}>
                  <BarChart
                    data={barData}
                    margin={{ top: 10, right: 12, left: -24, bottom: 0 }}
                    barCategoryGap="22%"
                  >
                    <CartesianGrid stroke="#F1F5F9" vertical={false} strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 500 }}
                      dy={6}
                    />
                    <YAxis
                      domain={[0, yDomainMax]}
                      allowDecimals={false}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#94A3B8', fontSize: 11 }}
                    />
                    <Tooltip cursor={{ fill: 'rgba(249, 115, 22, 0.08)' }} content={<CustomBarTooltip />} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={32}>
                      {barData.map((entry, idx) => (
                        <Cell
                          key={entry.name || idx}
                          fill={entry.color || '#F97316'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 3. Top Performer Highlight Card */}
            <div className="modern-performer-card">
              <div className="performer-badge-illu">
                <PlatformAnalyticsIllustration />
              </div>
              <h2 className="performer-name">{topCompany}</h2>
              <span className="performer-role">{t('admin.topVerifiedPartner', 'Top Verified Partner')}</span>

              <div className="performer-dual-stats">
                <div className="dual-stat-item">
                  <strong>{kpis.verifiedCompanies}</strong>
                  <span>{t('admin.verified', 'Verified')}</span>
                </div>
                <div className="dual-stat-item">
                  <strong>{kpis.totalJobs}</strong>
                  <span>{t('admin.activeJobs', 'Active Jobs')}</span>
                </div>
              </div>

              <Link to="/admin/companies" className="performer-action-btn">
                {t('admin.bestPartner', 'Best Partner')}
              </Link>
            </div>
          </div>

          {/* Lower Grid: Quick Stats, Verification Queue & System Audit Log */}
          <div className="modern-lower-grid">
            {/* Quick Metrics Cards */}
            <div className="modern-quick-stats-panel">
              <div className="panel-title-row">
                <h2 className="panel-heading">{t('admin.platformEntities', 'Platform Entities')}</h2>
                <span className="panel-sub-label">{t('admin.liveCounts', 'Live Counts')}</span>
              </div>

              <div className="quick-metrics-row">
                <Link to="/admin/candidates" className="metric-chip metric-chip-link" title="Manage candidates">
                  <div className="metric-chip-icon chip-blue">
                    <Users size={18} />
                  </div>
                  <div>
                    <strong>{kpis.totalCandidates}</strong>
                    <span>{t('common.nav.candidates', 'Students')}</span>
                    <span className="metric-chip-sub">Talents &rarr;</span>
                  </div>
                </Link>

                <Link to="/admin/companies" className="metric-chip metric-chip-link" title="Manage companies">
                  <div className="metric-chip-icon chip-indigo">
                    <Building2 size={18} />
                  </div>
                  <div>
                    <strong>{kpis.totalCompanies}</strong>
                    <span>{t('common.nav.companies', 'Companies')}</span>
                    <span className="metric-chip-sub">{kpis.verifiedCompanies} Verified</span>
                  </div>
                </Link>

                <Link to="/admin/jobs" className="metric-chip metric-chip-link" title="Manage jobs">
                  <div className="metric-chip-icon chip-amber">
                    <Briefcase size={18} />
                  </div>
                  <div>
                    <strong>{kpis.totalJobs}</strong>
                    <span>{t('common.nav.jobs', 'Job Posts')}</span>
                    <span className="metric-chip-sub">{kpis.activeJobs} Active</span>
                  </div>
                </Link>

                <Link to="/admin/applications" className="metric-chip metric-chip-link" title="View pipeline">
                  <div className="metric-chip-icon chip-green">
                    <CheckCircle2 size={18} />
                  </div>
                  <div>
                    <strong>{kpis.interviewsCount}</strong>
                    <span>{t('common.nav.interviews', 'Interviews')}</span>
                    <span className="metric-chip-sub">Scheduled</span>
                  </div>
                </Link>
              </div>

              {/* Recent Audit Trail List */}
              <div className="modern-audit-box">
                <div className="panel-title-row" style={{ marginTop: '16px', marginBottom: '8px' }}>
                  <h3 className="panel-heading" style={{ fontSize: '0.9375rem' }}>{t('common.nav.auditLogs', 'Audit Log')}</h3>
                  {isDemoModeEnabled() && (
                    <button type="button" className="modern-reset-link" onClick={handleResetDemoData}>
                      <RotateCcw size={13} /> {t('admin.resetDemoData', 'Reset Demo Data')}
                    </button>
                  )}
                </div>

                {searchQuery && (
                  <span className="search-active-pill">
                    Filtering audit logs ({filteredLogs.length} matches)
                  </span>
                )}

                <div className="audit-items-list">
                  {filteredLogs.length === 0 ? (
                    <p className="empty-subtext">
                      {searchQuery
                        ? `No audit logs match "${searchQuery}".`
                        : t('common.noData', 'No audit logs recorded.')}
                    </p>
                  ) : (
                    filteredLogs.slice(0, 4).map((log) => {
                      const badge = getAuditBadge(log.text);
                      return (
                        <div key={log.id} className="audit-item-row">
                          <span className="audit-badge" style={{ color: badge.color, background: badge.bg }}>
                            {badge.label}
                          </span>
                          <span className="audit-item-time">{log.timestamp}</span>
                          <span className="audit-item-text">{log.text}</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN (Scenic Banner & "On Process" Pipeline) ────────── */}
        <div className="modern-right-column">
          {/* Scenic Recruitment Workspace Banner */}
          <div className="scenic-banner-card">
            <RecruitmentWorkspaceBanner />
          </div>

          {/* "On Process" Pipeline Panel */}
          <div className="modern-process-card">
            <div className="process-header">
              <div>
                <h2 className="process-title">{t('admin.onProcess', 'On Process')}</h2>
                <span className="process-date">{todayFormatted}</span>
              </div>
              <span className="process-count-badge">
                {filteredProcessItems.length} {t('common.active', 'Active')}
              </span>
            </div>

            {searchQuery && (
              <span className="search-active-pill" style={{ margin: '0 16px 8px' }}>
                Filtering pipeline ({filteredProcessItems.length} matches)
              </span>
            )}

            <div className="process-items-list">
              {filteredProcessItems.length === 0 ? (
                <div className="process-empty-box">
                  <CheckCircle2 size={24} color="#10B981" />
                  <p>
                    {searchQuery
                      ? `No active items match "${searchQuery}".`
                      : t('admin.allUpToDate', 'All applications and reviews are up to date!')}
                  </p>
                </div>
              ) : (
                filteredProcessItems.map((item) => (
                  <Link
                    key={item.id}
                    to={item.link}
                    className="process-item-card"
                    style={{ borderLeftColor: item.color }}
                  >
                    <div className="process-item-main">
                      <strong className="process-item-title">{item.title}</strong>
                      <span className="process-item-sub">{item.subtitle}</span>
                    </div>

                    <div className="process-item-meta">
                      <span className="process-time-pill" style={{ color: item.color }}>
                        {item.time}
                      </span>
                      <ArrowUpRight size={14} className="process-arrow" />
                    </div>
                  </Link>
                ))
              )}
            </div>

            <div className="process-footer">
              <Link to="/admin/applications" className="process-view-all">
                {t('admin.viewPipeline', 'View Full Platform Pipeline')} &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
