import { useState } from "react";
import { Outlet } from "react-router-dom";
import CompanySidebar from '../../components/company/CompanySidebar';
import CompanyHeader from '../../components/company/CompanyHeader';
import "./CompanyLayout.css";

export default function CompanyLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="company-shell">
      <CompanySidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="company-main">
        <CompanyHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className="company-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}