import { Outlet } from "react-router-dom";
import CompanySidebar from '../../components/company/CompanySidebar';
import "./CompanyLayout.css";

export default function CompanyLayout() {
  return (
    <div className="company-shell">
      <CompanySidebar />
      <div className="company-main">
        <main className="company-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}