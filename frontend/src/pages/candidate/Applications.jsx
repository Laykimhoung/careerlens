import { useState } from "react";
import ApplicationCard from "../../components/candidate/ApplicationCard";
import "./Applications.css";

export const MOCK_APPLICATIONS = [
  {
    id: 1,
    jobTitle: "Junior Software Developer",
    company: "TechNova Cambodia",
    appliedDate: "Oct 1, 2026",
    status: "Review",
    timeline: [
      { status: "Applied", date: "Oct 1, 2026", active: true },
      { status: "Review", date: "Oct 2, 2026", active: true },
      { status: "Interview", date: null, active: false },
      { status: "Offer", date: null, active: false }
    ],
    notes: "Your application is currently being reviewed by the hiring manager."
  },
  {
    id: 2,
    jobTitle: "React Frontend Engineer",
    company: "Angkor Software",
    appliedDate: "Sep 20, 2026",
    status: "Interview",
    timeline: [
      { status: "Applied", date: "Sep 20, 2026", active: true },
      { status: "Review", date: "Sep 22, 2026", active: true },
      { status: "Interview", date: "Sep 25, 2026", active: true },
      { status: "Offer", date: null, active: false }
    ],
    notes: "Interview scheduled for Oct 5 at 2:00 PM via Google Meet."
  },
  {
    id: 3,
    jobTitle: "IT Support Intern",
    company: "Mekong Financial",
    appliedDate: "Sep 15, 2026",
    status: "Rejected",
    timeline: [
      { status: "Applied", date: "Sep 15, 2026", active: true },
      { status: "Review", date: "Sep 18, 2026", active: true },
      { status: "Interview", date: null, active: false },
      { status: "Rejected", date: "Sep 22, 2026", active: true }
    ],
    notes: "Thank you for your interest. We have decided to move forward with other candidates."
  }
];

export default function CandidateApplications() {
  const [filter, setFilter] = useState("All");

  const statuses = ["All", "Applied", "Review", "Interview", "Offer", "Rejected"];

  const filteredApps = MOCK_APPLICATIONS.filter((app) => 
    filter === "All" || app.status === filter
  );

  return (
    <div className="applications-page">
      <div className="applications-filters">
        {statuses.map(status => (
          <button 
            key={status}
            className={`app-filter-btn ${filter === status ? "app-filter-btn--active" : ""}`}
            onClick={() => setFilter(status)}
          >
            {status}
          </button>
        ))}
      </div>

      <div className="applications-list">
        <div className="applications-list__header">
          Showing {filteredApps.length} application{filteredApps.length !== 1 && "s"}
        </div>

        {filteredApps.length > 0 ? (
          filteredApps.map(app => (
            <ApplicationCard key={app.id} application={app} />
          ))
        ) : (
          <div style={{ textAlign: "center", padding: "40px", color: "#6b7280", border: "1px dashed #d1d5db", borderRadius: "8px" }}>
            You don't have any applications with this status.
          </div>
        )}
      </div>
    </div>
  );
}