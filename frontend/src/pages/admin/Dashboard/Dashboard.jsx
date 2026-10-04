import React from "react";
import './Dashboard.css';

export default function Dashboard() {
  const stats = [
    { label: "Students", value: 3 },
    { label: "Companies", value: 4 },
    { label: "Jobs", value: 5 },
    { label: "Applications", value: 4 },
    { label: "Interviews", value: 0 },
    { label: "Hires", value: 0 },
  ];

  const logs = [
    { id: 1, time: "2026-09-26 09:12", message: "Company FutureWorks -> Verified" },
    { id: 2, time: "2026-09-26 09:12", message: "Company FutureWorks -> Rejected" },
    { id: 3, time: "2026-09-26 09:12", message: "Company FutureWorks -> Verified" },
    { id: 4, time: "2026-09-26 09:12", message: "Company TechNova Cambodia -> Verified" },
    { id: 5, time: "2026-09-24 16:28", message: "Platform initialised with demo data" },
  ];

  return (
    <div className="admin-dashboard-container">
      <h1 className="dashboard-title">Admin Dashboard</h1>

      <div className="stats-grid">
        {stats.map((stat) => (
          <div key={stat.label} className="stat-card">
            <h2>{stat.value}</h2>
            <p>{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="chart-container">
        <div className="chart-y-axis">
          <span>5.0</span>
          <span>4.5</span>
          <span>4.0</span>
          <span>3.5</span>
          <span>3.0</span>
          <span>2.5</span>
          <span>2.0</span>
          <span>1.5</span>
          <span>1.0</span>
          <span>0.5</span>
          <span>0</span>
        </div>
        <div className="chart-bars-area">
          <div className="chart-grid-lines">
            {[...Array(11)].map((_, i) => (
              <div key={i} className="chart-grid-line"></div>
            ))}
          </div>
          <div className="chart-bars">
            <div className="chart-bar-group">
              <div className="chart-bar bar-students" style={{ height: "60%" }}></div>
              <span>Students</span>
            </div>
            <div className="chart-bar-group">
              <div className="chart-bar bar-companies" style={{ height: "80%" }}></div>
              <span>Companies</span>
            </div>
            <div className="chart-bar-group">
              <div className="chart-bar bar-jobs" style={{ height: "100%" }}></div>
              <span>Jobs</span>
            </div>
            <div className="chart-bar-group">
              <div className="chart-bar bar-applications" style={{ height: "80%" }}></div>
              <span>Applications</span>
            </div>
            <div className="chart-bar-group">
              <div className="chart-bar bar-interviews" style={{ height: "0%" }}></div>
              <span>Interviews</span>
            </div>
            <div className="chart-bar-group">
              <div className="chart-bar bar-hires" style={{ height: "0%" }}></div>
              <span>Hires</span>
            </div>
          </div>
        </div>
      </div>

      <div className="audit-log-section">
        <h3>Audit log</h3>
        <div className="audit-log-list">
          {logs.map((log) => (
            <div key={log.id} className="audit-log-item">
              <span className="log-time">{log.time}</span>
              <span className="log-message">{log.message}</span>
            </div>
          ))}
        </div>
        <button className="reset-btn">Reset demo data</button>
      </div>
    </div>
  );
}
