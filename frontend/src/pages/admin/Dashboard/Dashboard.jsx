import React, { useState, useEffect } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { Lottie } from 'lottie-react';
import placeholderLottie from '../../../assets/lottie/placeholder.json';
import './Dashboard.css';

// Mock Data for Charts & Stats
const registrationData = [
  { name: 'Mon', users: 400, companies: 24 },
  { name: 'Tue', users: 300, companies: 13 },
  { name: 'Wed', users: 550, companies: 98 },
  { name: 'Thu', users: 278, companies: 39 },
  { name: 'Fri', users: 189, companies: 48 },
  { name: 'Sat', users: 239, companies: 38 },
  { name: 'Sun', users: 349, companies: 43 },
];

const userDistributionData = [
  { name: 'Candidates', value: 11200 },
  { name: 'Companies', value: 864 },
  { name: 'Admins', value: 12 },
];
const USER_COLORS = ['#016BFB', '#299C83', '#D79A45'];

const jobCategoryData = [
  { name: 'IT & Software', value: 450 },
  { name: 'Business', value: 300 },
  { name: 'Marketing', value: 200 },
  { name: 'Design', value: 150 },
  { name: 'Finance', value: 145 },
];
const JOB_COLORS = ['#016BFB', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'];

const logs = [
  { id: 1, time: "Today, 09:12 AM", message: "Company FutureWorks -> Verified", status: "success" },
  { id: 2, time: "Today, 08:45 AM", message: "Company TechNova -> Rejected", status: "error" },
  { id: 3, time: "Yesterday, 14:30", message: "New Admin 'Alex' added", status: "info" },
  { id: 4, time: "Yesterday, 11:20", message: "Platform initialized", status: "info" },
];

export default function Dashboard() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate API fetch delay
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="admin-dashboard-container">
      {/* SECTION 1: Page Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Platform Overview</h1>
          <p className="dashboard-subtitle">Welcome back, Admin. Here is what's happening today.</p>
        </div>
        <div className="dashboard-actions">
          <button className="refresh-btn" onClick={() => setIsLoading(true)}>
            Refresh Data
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="loading-skeleton">
          <div className="skeleton-cards">
            {[1, 2, 3, 4].map(i => <div key={i} className="skeleton-card"></div>)}
          </div>
          <div className="skeleton-charts">
            <div className="skeleton-chart main"></div>
            <div className="skeleton-chart side"></div>
          </div>
        </div>
      ) : (
        <>
          {/* SECTION 2: Primary Statistics */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-content">
                <p className="stat-label">Total Users</p>
                <h2 className="stat-value">12,480</h2>
                <div className="stat-trend positive">↑ 12% vs last month</div>
              </div>
              <div className="stat-icon-wrapper">
                <Lottie animationData={placeholderLottie} style={{ width: 40, height: 40 }} />
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-content">
                <p className="stat-label">Companies</p>
                <h2 className="stat-value">864</h2>
                <div className="stat-trend positive">↑ 5% vs last month</div>
              </div>
              <div className="stat-icon-wrapper">
                <Lottie animationData={placeholderLottie} style={{ width: 40, height: 40 }} />
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-content">
                <p className="stat-label">Job Posts</p>
                <h2 className="stat-value">1,245</h2>
                <div className="stat-trend positive">↑ 18% vs last month</div>
              </div>
              <div className="stat-icon-wrapper">
                <Lottie animationData={placeholderLottie} style={{ width: 40, height: 40 }} />
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-content">
                <p className="stat-label">Pending Approvals</p>
                <h2 className="stat-value">38</h2>
                <div className="stat-trend negative">↓ 2 requires action</div>
              </div>
              <div className="stat-icon-wrapper">
                <Lottie animationData={placeholderLottie} style={{ width: 40, height: 40 }} />
              </div>
            </div>
          </div>

          {/* SECTION 3: Main Analytics */}
          <div className="charts-grid-main">
            <div className="chart-card span-2">
              <div className="chart-header">
                <h3>Registration Trends</h3>
                <span className="chart-badge">Past 7 Days</span>
              </div>
              <div className="chart-body" style={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={registrationData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dx={-10} />
                    <RechartsTooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }}/>
                    <Line type="monotone" dataKey="users" name="New Users" stroke="#016BFB" strokeWidth={3} dot={{r: 4, fill: '#016BFB', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 6}} />
                    <Line type="monotone" dataKey="companies" name="New Companies" stroke="#299C83" strokeWidth={3} dot={{r: 4, fill: '#299C83', strokeWidth: 2, stroke: '#fff'}} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="chart-card">
              <div className="chart-header">
                <h3>User Distribution</h3>
              </div>
              <div className="chart-body" style={{ height: 300, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={userDistributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={95}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {userDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={USER_COLORS[index % USER_COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      formatter={(value) => value.toLocaleString()}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                    />
                    <Legend iconType="circle" verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* SECTION 4: Recruitment Analytics & Operations */}
          <div className="charts-grid-secondary">
            <div className="chart-card">
              <div className="chart-header">
                <h3>Job Categories</h3>
              </div>
              <div className="chart-body" style={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={jobCategoryData}
                      cx="50%"
                      cy="50%"
                      outerRadius={85}
                      dataKey="value"
                    >
                      {jobCategoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={JOB_COLORS[index % JOB_COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value) => value.toLocaleString()} />
                    <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: '12px' }}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="audit-log-section">
              <div className="chart-header">
                <h3>Recent Activities</h3>
                <button className="reset-btn">View All</button>
              </div>
              <div className="audit-log-list">
                {logs.map((log) => (
                  <div key={log.id} className="audit-log-item">
                    <div className={`log-indicator ${log.status}`}></div>
                    <div className="log-details">
                      <span className="log-message">{log.message}</span>
                      <span className="log-time">{log.time}</span>
                    </div>
                  </div>
                ))}
                {logs.length === 0 && (
                  <div className="empty-state">
                    <Lottie animationData={placeholderLottie} style={{ width: 80, height: 80, margin: '0 auto' }} />
                    <p>No recent activities</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
