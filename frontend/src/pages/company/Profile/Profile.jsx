import { useState } from "react";
import { readStore, saveDemoCollection } from '../../../services/member3DemoStore';
import { useAuth } from "../../../hooks/useAuth";
import CompanyProfileCard from '../../../components/company/CompanyProfileCard';
import Input from '../../../components/common/Input';
import Select from '../../../components/common/Select';
import Textarea from '../../../components/common/Textarea';
import Button from '../../../components/common/Button';
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
        <form className="dashboard-panel" onSubmit={saveProfile}>
          <div className="company-profile-grid">
            <Input id="companyName" name="companyName" label="Company name" value={profile.companyName || ""} onChange={updateField} required />
            <Input id="industry" name="industry" label="Industry" value={profile.industry || ""} onChange={updateField} required />
            
            <Select 
              id="size" 
              name="size" 
              label="Company size" 
              value={profile.size || ""} 
              onChange={updateField}
              options={["1-10 employees", "11-50 employees", "51-200 employees", "201-500 employees", "500+ employees"]}
            />
            <Input id="location" name="location" label="Location" value={profile.location || ""} onChange={updateField} />
            
            <Input id="website" name="website" type="url" label="Website" value={profile.website || ""} onChange={updateField} />
            <Input id="contactEmail" name="contactEmail" type="email" label="Recruitment email" value={profile.contactEmail || ""} onChange={updateField} required />
          </div>
          
          <Textarea id="description" name="description" label="About the company" value={profile.description || ""} onChange={updateField} required />
          
          <div className="workspace-actions" style={{ justifyContent: "flex-end", marginTop: "10px" }}>
            <Button type="submit" variant="primary">Save profile</Button>
          </div>
        </form>
        
        <CompanyProfileCard profile={profile} />
      </div>
    </section>
  );
}