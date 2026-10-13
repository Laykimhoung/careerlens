import React, { useState, useEffect, useCallback } from 'react';
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
import { fetchAdminDashboardData } from '../../../services/adminService';
import './Dashboard.css';

function CustomBarTooltip({ active, payload }) {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0];
  return (
    <div className="admin-dash-tooltip">
      <span
        className="admin-dash-tooltip-dot"
        style={{ backgroundColor: item.payload?.color || '#2B70F6' }}
      />
      <span>{item.payload?.name}:</span>
      <strong>{item.value}</strong>
    </div>
  );
}

export default function AdminDashboard() {
  const [state, setState] = useState({
    loading: true,
    error: null,
    analytics: null,
  });

  const loadData = useCallback(async () => {
    try {
      const result = await fetchAdminDashboardData({ dateRange: 'all' });
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
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const onStorage = () => loadData();
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [loadData]);

  const { loading, error, analytics } = state;

  const kpis = analytics?.kpis || {
    totalCandidates: 0,
    totalCompanies: 0,
    totalJobs: 0,
    totalApplications: 0,
    interviewsCount: 0,
    hiresCount: 0,
  };

  const stats = [
    { label: 'Students', value: kpis.totalCandidates },
    { label: 'Companies', value: kpis.totalCompanies },
    { label: 'Jobs', value: kpis.totalJobs },
    { label: 'Applications', value: kpis.totalApplications },
    { label: 'Interviews', value: kpis.interviewsCount },
    { label: 'Hires', value: kpis.hiresCount },
  ];

  const barData = analytics?.charts?.overviewBarData || [
    { name: 'Students', value: kpis.totalCandidates, color: '#084C41' },
    { name: 'Companies', value: kpis.totalCompanies, color: '#2B70F6' },
    { name: 'Jobs', value: kpis.totalJobs, color: '#0095EB' },
    { name: 'Applications', value: kpis.totalApplications, color: '#F59E0B' },
    { name: 'Interviews', value: kpis.interviewsCount, color: '#7C3AED' },
    { name: 'Hires', value: kpis.hiresCount, color: '#10B981' },
  ];

  const maxVal = Math.max(5, ...barData.map((d) => d.value || 0));
  const yDomainMax = Math.ceil(maxVal);
  const yTicks = Array.from({ length: 11 }, (_, idx) =>
    Number(((yDomainMax / 10) * idx).toFixed(1))
  );

  const logs = analytics?.recent?.auditLogs || [];

  return (
    <div className="admin-dashboard-container">
      <h1 className="admin-dash-title">Admin Dashboard</h1>

      {error && (
        <div className="admin-dash-error-banner" role="alert">
          <span>{error}</span>
          <button type="button" className="admin-dash-reset-btn" onClick={loadData}>
            Retry
          </button>
        </div>
      )}

      {/* 6 KPI Stat Cards */}
      <div className="admin-dash-stats-grid">
        {stats.map((stat) => (
          <div key={stat.label} className="admin-dash-stat-card">
            <h2>{loading ? '—' : stat.value}</h2>
            <p>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Main Bar Chart Card */}
      <div className="admin-dash-chart-card">
        <div className="admin-dash-chart-inner">
          <ResponsiveContainer width="100%" height={290}>
            <BarChart
              data={barData}
              margin={{ top: 10, right: 16, left: -12, bottom: 4 }}
              barCategoryGap="18%"
            >
              <CartesianGrid stroke="#EAECEF" horizontal={true} vertical={true} />
              <XAxis
                dataKey="name"
                axisLine={{ stroke: '#E2E8F0' }}
                tickLine={{ stroke: '#E2E8F0' }}
                tick={{ fill: '#64748B', fontSize: 12 }}
                dy={6}
              />
              <YAxis
                domain={[0, yDomainMax]}
                ticks={yTicks}
                tickFormatter={(val) => (val === 0 ? '0' : Number(val).toFixed(1))}
                axisLine={{ stroke: '#E2E8F0' }}
                tickLine={{ stroke: '#E2E8F0' }}
                tick={{ fill: '#64748B', fontSize: 12 }}
              />
              <Tooltip
                cursor={{ fill: 'rgba(15, 23, 42, 0.03)' }}
                content={<CustomBarTooltip />}
              />
              <Bar dataKey="value" radius={[0, 0, 0, 0]} maxBarSize={112}>
                {barData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Audit Log Section */}
      <div className="admin-dash-audit-section">
        <h3>Audit log</h3>
        <div className="admin-dash-audit-list">
          {logs.length === 0 ? (
            <div className="admin-dash-audit-item">
              <span className="admin-dash-log-time">No audit logs recorded yet.</span>
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="admin-dash-audit-item">
                <span className="admin-dash-log-time">{log.timestamp}</span>
                <span className="admin-dash-log-message">{log.text}</span>
              </div>
            ))
          )}
        </div>
        <button type="button" className="admin-dash-reset-btn" onClick={loadData}>
          Refresh live data
        </button>
      </div>
    </div>
  );
}
