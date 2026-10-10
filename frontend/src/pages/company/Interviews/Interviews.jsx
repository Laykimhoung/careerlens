import { useState } from "react";
import InterviewCard from '../../../components/company/InterviewCard';
import Input from '../../../components/common/Input';
import Select from '../../../components/common/Select';
import Button from '../../../components/common/Button';
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
          <form onSubmit={scheduleInterview}>
            <Select 
              id="appId" 
              name="appId"
              label="Candidate" 
              required
              options={[
                { value: "", label: "Select a candidate" },
                ...applicants.map(app => {
                  const student = store.users.find(u => u.id === app.sid) || {};
                  const job = store.jobs.find(j => j.id === app.jid) || {};
                  return { value: app.id, label: `${student.name || "Unknown"} · ${job.title || "Job"}` };
                })
              ]}
            />
            
            <div className="company-profile-grid">
              <Input 
                id="date" 
                name="date" 
                type="date" 
                label="Date" 
                min={new Date().toISOString().slice(0, 10)} 
                required 
              />
              <Input 
                id="time" 
                name="time" 
                type="time" 
                label="Time" 
                required 
              />
            </div>
            
            <Select 
              id="format" 
              name="format"
              label="Format" 
              options={["Video call", "On-site", "Phone call"]}
            />
            
            <div className="workspace-actions" style={{ justifyContent: "flex-start", marginTop: "10px" }}>
              <Button type="submit" variant="primary">Schedule interview</Button>
            </div>
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