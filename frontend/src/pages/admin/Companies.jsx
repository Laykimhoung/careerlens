
import { useState } from "react";
import CompanyTable from "../../components/admin/CompanyTable";
import { getDemoCollection, saveDemoCollection } from "../../services/member3DemoStore";
import "./Companies.css";


function Companies() {
  const [companies, setCompanies] = useState(() => getDemoCollection("companies"));
  const updateCompany = (company, verified) => {
    const nextCompanies = companies.map((item) => item.id === company.id ? { ...item, verified } : item);
    setCompanies(nextCompanies);
    saveDemoCollection("companies", nextCompanies);
  };

  return (
    <section className="workspace-page">
      <div className="demo-label">Demo data · Changes stay in this browser</div>
      <div className="workspace-heading">
        <div><h1>Company management</h1><p>Review company accounts and verification status.</p></div>
      </div>
      <CompanyTable
        companies={companies}
        onVerify={(company) => updateCompany(company, "Verified")}
        onReject={(company) => updateCompany(company, "Rejected")}
        onSuspend={(company) => updateCompany(company, "Suspended")}
      />
    </section>
  );
}

export default Companies;