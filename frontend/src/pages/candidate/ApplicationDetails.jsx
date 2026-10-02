import { useParams, Link } from "react-router-dom";
import Button from "../../components/common/Button";
import { MOCK_APPLICATIONS } from "./Applications";
import "./ApplicationDetails.css";

export default function CandidateApplicationDetails() {
  const { id } = useParams();
  
  const app = MOCK_APPLICATIONS.find((a) => a.id === parseInt(id));

  if (!app) {
    return (
      <div className="app-details-page">
        <div className="app-not-found">
          <h2 style={{ fontSize: "24px", fontWeight: "700", marginBottom: "16px" }}>Application not found</h2>
          <p style={{ marginBottom: "24px", color: "#6b7280" }}>
            We couldn't find the application you're looking for.
          </p>
          <Link to="/candidate/applications">
            <Button variant="primary">Back to Applications</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Helper to determine badge color class
  const badgeClass = `app-badge--${app.status.toLowerCase()}`;

  return (
    <div className="app-details-page">
      <Link to="/candidate/applications" className="app-details__back">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: "16px", height: "16px" }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
        Back to Applications
      </Link>

      {/* Hero Section */}
      <div className="app-details__hero">
        <h1>{app.jobTitle}</h1>
        <p>{app.company} &middot; Applied on {app.appliedDate}</p>
        <span className={`app-badge-large ${badgeClass}`}>
          Current Status: {app.status}
        </span>
      </div>

      {/* Progress Tracker */}
      <div className="app-details__section">
        <h2 className="app-details__section-title">Application Progress</h2>
        
        <div className="progress-tracker">
          {app.timeline.map((step, index) => {
            // Check if this specific step is "Rejected"
            const isRejectedStep = step.status === "Rejected" && step.active;
            
            return (
              <div 
                key={index} 
                className={`progress-step ${step.active ? "progress-step--active" : ""} ${isRejectedStep ? "progress-step--rejected" : ""}`}
              >
                <div className="progress-step__circle">
                  {step.active && !isRejectedStep && (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                      <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" />
                    </svg>
                  )}
                  {isRejectedStep && (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                      <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div>
                  <div className="progress-step__label">{step.status}</div>
                  <div className="progress-step__date">{step.date}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Messages / Notes */}
      <div className="app-details__section">
        <h2 className="app-details__section-title">Updates & Notes</h2>
        <div className="app-details__notes">
          {app.notes}
        </div>
      </div>

    </div>
  );
}