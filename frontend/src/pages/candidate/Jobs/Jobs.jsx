import { useState, useMemo } from "react";
import './Jobs.css';

// MOCK DATA matching exactly what's in the screenshot and the HTML prototype
export const MOCK_JOBS_DB = [
  {
    id: 1,
    title: "Junior Software Developer",
    company: "TechNova Cambodia",
    location: "Phnom Penh",
    setup: "Hybrid",
    type: "Full-time",
    industry: "Software",
    salary: "$600 - $900",
    tags: ["JavaScript", "Git", "SQL"],
    applied: false,
    saved: false
  },
  {
    id: 2,
    title: "UI/UX Designer",
    company: "Mekong Digital",
    location: "Phnom Penh",
    setup: "On-site",
    type: "Full-time",
    industry: "Design",
    salary: "$700 - $1,000",
    tags: ["Figma", "User Research", "Prototyping"],
    applied: true,
    saved: false
  },
  {
    id: 3,
    title: "Project Coordinator",
    company: "Angkor Software",
    location: "Siem Reap",
    setup: "On-site",
    type: "Full-time",
    industry: "Business",
    salary: "$500 - $750",
    tags: ["Communication", "Scheduling", "Excel"],
    applied: false,
    saved: false
  },
  {
    id: 4,
    title: "IT Support Intern",
    company: "TechNova Cambodia",
    location: "Phnom Penh",
    setup: "On-site",
    type: "Internship",
    industry: "Software", // Treated as IT/Software
    salary: "$150 - $250",
    tags: ["Networking", "Windows", "Troubleshooting"],
    applied: false,
    saved: false
  },
  {
    id: 5,
    title: "Business Analyst Intern",
    company: "FutureWorks",
    location: "Remote",
    setup: "Remote",
    type: "Internship",
    industry: "Business",
    salary: "$200 - $300",
    tags: ["SQL", "Excel", "Reporting"],
    applied: false,
    saved: false
  }
];

export default function CandidateJobs() {
  const [jobs, setJobs] = useState(MOCK_JOBS_DB);
  
  // Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [setupFilter, setSetupFilter] = useState("");
  const [industryFilter, setIndustryFilter] = useState("");

  const toggleSave = (id) => {
    setJobs(jobs.map(j => j.id === id ? { ...j, saved: !j.saved } : j));
  };

  const applyJob = (id) => {
    const job = jobs.find(j => j.id === id);
    if(window.confirm(`Submit application for ${job.title} at ${job.company}?`)) {
      setJobs(jobs.map(j => j.id === id ? { ...j, applied: true } : j));
    }
  };

  // Logic mimicking the `careerlens.html` filtering exactly
  const filteredJobs = useMemo(() => {
    return jobs.filter(j => {
      const q = searchTerm.toLowerCase();
      // Search matches title, company, location, or any tag (skill)
      const matchesSearch = !q || (j.title + " " + j.company + " " + j.location + " " + j.tags.join(" ")).toLowerCase().includes(q);
      
      const matchesType = !typeFilter || j.type === typeFilter;
      const matchesSetup = !setupFilter || j.setup === setupFilter;
      const matchesIndustry = !industryFilter || j.industry === industryFilter;
      
      return matchesSearch && matchesType && matchesSetup && matchesIndustry;
    });
  }, [jobs, searchTerm, typeFilter, setupFilter, industryFilter]);

  return (
    <div className="cj-page">
      <h1 className="cj-title">Find Jobs</h1>
      
      {/* Search and Filters */}
      <div className="cj-filters">
        <input 
          type="text" 
          className="cj-search" 
          placeholder="Search title, company, skill or location"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="cj-dropdowns">
          <select className="cj-select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="">Job type</option>
            <option value="Full-time">Full-time</option>
            <option value="Part-time">Part-time</option>
            <option value="Internship">Internship</option>
            <option value="Contract">Contract</option>
          </select>
          <select className="cj-select" value={setupFilter} onChange={(e) => setSetupFilter(e.target.value)}>
            <option value="">Workplace</option>
            <option value="On-site">On-site</option>
            <option value="Hybrid">Hybrid</option>
            <option value="Remote">Remote</option>
          </select>
          <select className="cj-select" value={industryFilter} onChange={(e) => setIndustryFilter(e.target.value)}>
            <option value="">Industry</option>
            <option value="Software">Software</option>
            <option value="Design">Design</option>
            <option value="Business">Business</option>
            <option value="IT Support">IT Support</option>
            <option value="Operations">Operations</option>
          </select>
        </div>
      </div>

      {/* Results List */}
      <div className="cj-list">
        {filteredJobs.length > 0 ? (
          filteredJobs.map(job => (
            <div key={job.id} className="cj-card">
              <div className="cj-card__left">
                <h3 className="cj-card__title">{job.title}</h3>
                <div className="cj-card__meta">
                  {job.company} &middot; {job.location} &middot; {job.setup} &middot; {job.type}
                </div>
                <div className="cj-card__salary">{job.salary}</div>
                <div className="cj-card__tags">
                  {job.tags.map(tag => (
                    <span key={tag} className="cj-card__tag">{tag}</span>
                  ))}
                </div>
              </div>
              <div className="cj-card__right">
                <button 
                  className={`cj-btn ${job.saved ? 'cj-btn--solid' : 'cj-btn--outline'}`} 
                  onClick={() => toggleSave(job.id)}
                >
                  {job.saved ? 'Saved' : 'Save'}
                </button>
                {job.applied ? (
                  <span className="cj-badge cj-badge--applied">Applied</span>
                ) : (
                  <button 
                    className="cj-btn cj-btn--solid"
                    onClick={() => applyJob(job.id)}
                  >
                    Apply
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div style={{ textAlign: "center", padding: "40px", color: "#64748b", backgroundColor: "#fff", border: "1px dashed #cbd5e1", borderRadius: "8px" }}>
            No jobs match your filters.
          </div>
        )}
      </div>
    </div>
  );
}