import { useState } from "react";
import { readStore, saveDemoCollection } from '../../../services/member3DemoStore';
import { useAuth } from "../../../hooks/useAuth";
import CompanyProfileCard from '../../../components/company/CompanyProfileCard';
import './Profile.css';

export default function Profile() {
  const { user } = useAuth();
  const [store, setStore] = useState(() => readStore());
  
  const companyId = user?.id === 2 ? "usr-c1" : user?.id;
  const companyUser = store.users.find(u => u.id === companyId) || {};

  const [profile, setProfile] = useState({
    companyName: companyUser.name || "TechNova Cambodia",
    industry: companyUser.ind || "Technology",
    size: companyUser.size || "11-50 employees",
    location: companyUser.loc || "Phnom Penh",
    website: companyUser.website || "https://example.com",
    contactEmail: companyUser.email || "hello@example.com",
    description: companyUser.desc || "We are a forward-thinking technology company."
  });
  
  const [saved, setSaved] = useState(false);

  const updateField = (event) => {
    setSaved(false);
    setProfile({ ...profile, [event.target.name]: event.target.value });
  };

  const saveProfile = (event) => {
    event.preventDefault();
    
    // In a real app we'd update the user object. For demo, we just simulate success.
    const updatedUsers = store.users.map(u => u.id === companyId ? {
      ...u,
      name: profile.companyName,
      ind: profile.industry,
      loc: profile.location,
      email: profile.contactEmail,
    } : u);
    
    saveDemoCollection("users", updatedUsers);
    setStore(s => ({ ...s, users: updatedUsers }));
    setSaved(true);
    
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <section className="workspace-page">
      <div className="workspace-heading">
        <div>
          <h1>Company profile</h1>
          <p>Manage the information candidates see about your organization.</p>
        </div>
      </div>
      
      {saved && (
        <div style={{ padding: "12px", background: "#dcfce7", color: "#15803d", borderRadius: "8px", marginBottom: "20px", fontSize: "14px", fontWeight: 600 }}>
          Profile saved successfully.
        </div>
      )}
      
      <div className="workspace-split">
        <form className="dashboard-panel admin-form" onSubmit={saveProfile}>
          <div style={{ display: "flex", gap: "16px", marginBottom: "16px" }}>
            <div className="admin-field" style={{ flex: 1 }}>
              <label className="admin-label">Company name</label>
              <input className="admin-input" id="companyName" name="companyName" value={profile.companyName || ""} onChange={updateField} required />
            </div>
            <div className="admin-field" style={{ flex: 1 }}>
              <label className="admin-label">Industry</label>
              <input className="admin-input" id="industry" name="industry" value={profile.industry || ""} onChange={updateField} required />
            </div>
          </div>
          
          <div style={{ display: "flex", gap: "16px", marginBottom: "16px" }}>
            <div className="admin-field" style={{ flex: 1 }}>
              <label className="admin-label">Company size</label>
              <select className="admin-input admin-select" id="size" name="size" value={profile.size || ""} onChange={updateField}>
                <option>1-10 employees</option>
                <option>11-50 employees</option>
                <option>51-200 employees</option>
                <option>201-500 employees</option>
                <option>500+ employees</option>
              </select>
            </div>
            <div className="admin-field" style={{ flex: 1 }}>
              <label className="admin-label">Location</label>
              <input className="admin-input" id="location" name="location" value={profile.location || ""} onChange={updateField} />
            </div>
          </div>
          
          <div style={{ display: "flex", gap: "16px", marginBottom: "16px" }}>
            <div className="admin-field" style={{ flex: 1 }}>
              <label className="admin-label">Website</label>
              <input className="admin-input" id="website" name="website" type="url" value={profile.website || ""} onChange={updateField} />
            </div>
            <div className="admin-field" style={{ flex: 1 }}>
              <label className="admin-label">Recruitment email</label>
              <input className="admin-input" id="contactEmail" name="contactEmail" type="email" value={profile.contactEmail || ""} onChange={updateField} required />
            </div>
          </div>
          
          <div className="admin-field">
            <label className="admin-label">About the company</label>
            <textarea className="admin-input" id="description" name="description" value={profile.description || ""} onChange={updateField} style={{ minHeight: "100px" }} />
          </div>
          
          <button className="workspace-button workspace-button-primary" type="submit" style={{ marginTop: "10px" }}>
            Save profile
          </button>
        </form>
        
        <CompanyProfileCard profile={profile} />
      </div>
    </section>
  );
}