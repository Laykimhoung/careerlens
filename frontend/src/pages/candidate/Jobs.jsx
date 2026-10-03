import { useState } from "react";
import Button from "../../components/common/Button";
import JobCard from "../../components/candidate/JobCard";
import "./Jobs.css";

// MOCK DATA for jobs page
export const MOCK_JOBS_DB = [
  {
    id: 1,
    title: "Junior Software Developer",
    company: "TechNova Cambodia",
    location: "Phnom Penh",
    setup: "Hybrid",
    type: "Full-time",
    salary: "$600 - $900",
    tags: ["JavaScript", "React", "Node.js"],
    postedDate: "2 days ago"
  },
  {
    id: 2,
    title: "Project Coordinator",
    company: "Angkor Software",
    location: "Siem Reap",
    setup: "On-site",
    type: "Full-time",
    salary: "$500 - $750",
    tags: ["Communication", "Agile", "Excel"],
    postedDate: "1 week ago"
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
    postedDate: "3 days ago"
  },
  {
    id: 4,
    title: "UI/UX Designer",
    company: "Creative Studio KH",
    location: "Phnom Penh",
    setup: "Remote",
    type: "Contract",
    salary: "$800 - $1,200",
    tags: ["Figma", "Prototyping", "Wireframing"],
    postedDate: "Just now"
  },
  {
    id: 5,
    title: "Data Analyst",
    company: "Mekong Financial",
    location: "Phnom Penh",
    setup: "Hybrid",
    type: "Full-time",
    salary: "$700 - $1,000",
    tags: ["SQL", "Python", "Tableau"],
    postedDate: "5 days ago"
  }
];

export default function CandidateJobs() {
  const [searchTerm, setSearchTerm] = useState("");
  const [jobType, setJobType] = useState("all");

  // Basic mock filtering logic
  const filteredJobs = MOCK_JOBS_DB.filter((job) => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          job.company.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = jobType === "all" || job.type.toLowerCase() === jobType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="jobs-page">
      
      {/* Search Bar */}
      <div className="jobs-search-bar">
        <input 
          type="text" 
          className="jobs-search-bar__input" 
          placeholder="Search by job title, company, or keywords..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select 
          className="jobs-search-bar__select"
          value={jobType}
          onChange={(e) => setJobType(e.target.value)}
        >
          <option value="all">All Job Types</option>
          <option value="full-time">Full-time</option>
          <option value="part-time">Part-time</option>
          <option value="contract">Contract</option>
          <option value="internship">Internship</option>
        </select>
        <Button variant="primary">Search</Button>
      </div>

      {/* Results List */}
      <div className="jobs-list">
        <div className="jobs-list__header">
          <span className="jobs-list__count">Showing {filteredJobs.length} jobs</span>
        </div>

        <div className="jobs-list__cards">
          {filteredJobs.length > 0 ? (
            filteredJobs.map(job => (
              <JobCard key={job.id} job={job} />
            ))
          ) : (
            <div style={{ textAlign: "center", padding: "40px", color: "#6b7280", border: "1px dashed #d1d5db", borderRadius: "8px" }}>
              No jobs found matching your search.
            </div>
          )}
        </div>
      </div>

    </div>
  );
}