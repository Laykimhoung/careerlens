import { useState } from "react";
import VerificationCard from '../../components/admin/VerificationCard';
import { getDemoCollection, saveDemoCollection } from "../../services/member3DemoStore";
import "./Verification.css";


function Verification() {
  const [companies, setCompanies] = useState(() => getDemoCollection("companies"));
  const pendingCompanies = companies.filter((company) => company.verified === "Pending Verification");
  const updateCompany = (company, verified) => {
    const nextCompanies = companies.map((item) => item.id === company.id ? { ...item, verified } : item);
    setCompanies(nextCompanies);
    saveDemoCollection("companies", nextCompanies);
  };

  return (
    <section className="workspace-page">
      <div className="demo-label">Demo data · Changes stay in this browser</div>
      <div className="workspace-heading">
        <div><h1>Verification queue</h1><p>Review company submissions awaiting verification.</p></div>
        <span className="workspace-status workspace-status-warning">{pendingCompanies.length} pending</span>
      </div>
      {pendingCompanies.length ? (
        <div className="workspace-list">
          {pendingCompanies.map((company) => (
            <VerificationCard
              key={company.id}
              company={company}
              onVerify={(item) => updateCompany(item, "Verified")}
              onReject={(item) => updateCompany(item, "Rejected")}
            />
          ))}
        </div>
      ) : <div className="workspace-panel workspace-empty">The verification queue is clear.</div>}
    </section>
  );
}

export default Verification;