import { useState } from "react";
import JobTable from "../../components/admin/JobTable";
import { getDemoCollection, saveDemoCollection } from "../../services/member3DemoStore";
import "./Jobs.css";


function Jobs() {
  const [jobs, setJobs] = useState(() => getDemoCollection("jobs"));
  const updateJob = (job, status) => {
    const nextJobs = jobs.map((item) => item.id === job.id ? { ...item, status } : item);
    setJobs(nextJobs);
    saveDemoCollection("jobs", nextJobs);
  };

  return (
    <section className="workspace-page">
      <div className="demo-label">Demo data · Changes stay in this browser</div>
      <div className="workspace-heading">
        <div><h1>Job management</h1><p>Review postings and update their publication status.</p></div>
      </div>
      <JobTable
        jobs={jobs}
        onApprove={(job) => updateJob(job, "Published")}
        onReject={(job) => updateJob(job, "Rejected")}
        onSuspend={(job) => updateJob(job, "Paused")}
        onRemove={(job) => {
          const nextJobs = jobs.filter((item) => item.id !== job.id);
          setJobs(nextJobs);
          saveDemoCollection("jobs", nextJobs);
        }}
      />
    </section>
  );
}

export default Jobs;