import { useAuth } from "../../hooks/useAuth";
import JobCard from "../../components/candidate/JobCard";
import "./Dashboard.css";

// MOCK DATA: Since backend isn't running, we provide fake data matching the design.
const RECOMMENDED_JOBS = [
  {
    id: 1,
    title: "Junior Software Developer",
    company: "TechNova Cambodia",
    location: "Phnom Penh",
    setup: "Hybrid",
    type: "Full-time",
    salary: "$600 - $900",
    tags: ["JavaScript", "Git", "SQL"],
  },
  {
    id: 2,
    title: "Project Coordinator",
    company: "Angkor Software",
    location: "Siem Reap",
    setup: "On-site",
    type: "Full-time",
    salary: "$500 - $750",
    tags: ["Communication", "Scheduling", "Excel"],
  },
  {
    id: 3,
    title: "IT Support Intern",
    company: "TechNova Cambodia",
    location: "Phnom Penh",
    setup: "On-site",
    type: "Internship",
    salary: "$150 - $250",
    tags: ["Networking", "Windows", "Troubleshooting"],
  },
];

export default function CandidateDashboard() {
  const { user } = useAuth();
  // Use the first name for the welcome message
  const firstName = user?.full_name ? user.full_name.split(" ")[0] : "User";

  return (
    <div className="dashboard">
      <h2 className="dashboard__welcome">Welcome, {firstName}</h2>

      {/* Stats Row */}
      <div className="dashboard__stats">
        <div className="dashboard__stat-card">
          <span className="dashboard__stat-number">1</span>
          <span className="dashboard__stat-label">Applications</span>
        </div>
        <div className="dashboard__stat-card">
          <span className="dashboard__stat-number">0</span>
          <span className="dashboard__stat-label">In interview stage</span>
        </div>
        <div className="dashboard__stat-card">
          <span className="dashboard__stat-number">0</span>
          <span className="dashboard__stat-label">Offers</span>
        </div>
        <div className="dashboard__stat-card">
          <span className="dashboard__stat-number">0</span>
          <span className="dashboard__stat-label">Saved jobs</span>
        </div>
      </div>

      {/* Profile Completion Bar */}
      <div className="dashboard__progress-card">
        <div className="dashboard__progress-label">Profile completion: 100%</div>
        <div className="dashboard__progress-track">
          <div className="dashboard__progress-fill" style={{ width: "100%" }}></div>
        </div>
      </div>

      {/* Recommended Jobs */}
      <div className="dashboard__section">
        <h3 className="dashboard__section-title">Recommended jobs</h3>
        <div className="dashboard__job-list">
          {RECOMMENDED_JOBS.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      </div>

      {/* Upcoming Interviews */}
      <div className="dashboard__section">
        <h3 className="dashboard__section-title">Upcoming interviews</h3>
        <div className="dashboard__empty-state">
          No upcoming interviews.
        </div>
      </div>
    </div>
  );
}