import { useState } from "react";
import InterviewCard from '../../../components/company/InterviewCard';
import { readStore, saveDemoCollection } from '../../../services/member3DemoStore';
import { useAuth } from "../../../hooks/useAuth";
import './Interviews.css';

export default function Interviews() {
  const { user } = useAuth();
  const [store, setStore] = useState(() => readStore());
  
  const companyId = user?.id === 2 ? "usr-c1" : user?.id;
  const companyName = user?.full_name || "TechNova Cambodia";

  // Filter company jobs
  const companyJobs = (store.jobs || []).filter(j => j.cid === companyId || j.co === companyName || companyId === "usr-c1");
  const jobIds = companyJobs.map(j => j.id);
  
  // Apps for this company
  const applicants = (store.apps || []).filter(a => jobIds.includes(a.jid));

  const interviews = store.interviews || [];
  // Only show interviews for applicants of this company
  const companyInterviews = interviews.filter(i => applicants.some(a => a.id === i.appId));

  const scheduleInterview = (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const appId = form.get("appId");
    const app = applicants.find(a => a.id === appId);
    if (!app) return;

    const student = store.users.find(u => u.id === app.sid) || {};
    const job = store.jobs.find(j => j.id === app.jid) || {};

    const interview = {
      id: `int-${Date.now()}`,
      appId: app.id,
      candidate: student.name || "Unknown Candidate",
      role: job.title || "Job Role",
      date: form.get("date"),
      time: form.get("time"),
      format: form.get("format"),
      status: "Scheduled",
    };
    
    const nextInterviews = [interview, ...interviews];
    saveDemoCollection("interviews", nextInterviews);
    setStore(s => ({ ...s, interviews: nextInterviews }));
    event.currentTarget.reset();
  };

  const cancelInterview = (interview) => {
    const nextInterviews = interviews.map((item) => item.id === interview.id ? { ...item, status: "Cancelled" } : item);
    saveDemoCollection("interviews", nextInterviews);
    setStore(s => ({ ...s, interviews: nextInterviews }));
  };

  return (
    <section className="workspace-page">
      <div className="workspace-heading">
        <div>
          <h1>Interviews</h1>
          <p>Coordinate candidate conversations and interview times.</p>
        </div>
      </div>
      
      <div className="workspace-split">
        <section className="dashboard-panel">
          <h2>Schedule an interview</h2>
          <form onSubmit={scheduleInterview} className="admin-form">
            <div className="admin-field">
              <label className="admin-label">Candidate</label>
              <select className="admin-input admin-select" name="appId" required defaultValue="">
                <option value="" disabled>Select a candidate</option>
                {applicants.map((app) => {
                  const student = store.users.find(u => u.id === app.sid) || {};
                  const job = store.jobs.find(j => j.id === app.jid) || {};
                  return (
                    <option key={app.id} value={app.id}>
                      {student.name || "Unknown"} &middot; {job.title || "Job"}
                    </option>
                  );
                })}
              </select>
            </div>
            
            <div style={{ display: "flex", gap: "12px", width: "100%" }}>
              <div className="admin-field" style={{ flex: 1 }}>
                <label className="admin-label">Date</label>
                <input className="admin-input" name="date" type="date" min={new Date().toISOString().slice(0, 10)} required />
              </div>
              <div className="admin-field" style={{ flex: 1 }}>
                <label className="admin-label">Time</label>
                <input className="admin-input" name="time" type="time" required />
              </div>
            </div>
            
            <div className="admin-field">
              <label className="admin-label">Format</label>
              <select className="admin-input admin-select" name="format">
                <option>Video call</option>
                <option>On-site</option>
                <option>Phone call</option>
              </select>
            </div>
            
            <button className="workspace-button workspace-button-primary" type="submit" style={{ marginTop: "10px" }}>
              Schedule interview
            </button>
          </form>
        </section>
        
        <section className="dashboard-panel">
          <h2>Interview schedule</h2>
          <div className="workspace-list" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {companyInterviews.map((interview) => (
              <InterviewCard key={interview.id} interview={interview} onCancel={cancelInterview} />
            ))}
            {!companyInterviews.length && (
              <p style={{ textAlign: "center", padding: "30px", color: "#666" }}>
                No interviews have been scheduled.
              </p>
            )}
          </div>
        </section>
      </div>
    </section>
  );
}