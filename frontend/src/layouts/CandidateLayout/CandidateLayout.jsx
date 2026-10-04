import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import CandidateSidebar from '../../components/candidate/CandidateSidebar';
import CandidateHeader from '../../components/candidate/CandidateHeader';
import "./CandidateLayout.css";

export default function CandidateLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Close sidebar on mobile when route changes
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="candidate-layout">
      <CandidateSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="candidate-layout__main">
        <CandidateHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className="candidate-layout__content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}