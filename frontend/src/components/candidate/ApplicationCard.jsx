import { Link } from "react-router-dom";
import Button from "../common/Button";
import "./ApplicationCard.css";

export default function ApplicationCard({ application }) {
  const logoInitial = application.company.charAt(0);

  return (
    <div className="app-card">
      <div className="app-card__main">
        <div className="app-card__company-logo">{logoInitial}</div>
        <div>
          <Link to={`/candidate/applications/${application.id}`} className="app-card__title-link">
            <h3 className="app-card__title">{application.jobTitle}</h3>
          </Link>
          <p className="app-card__company">{application.company}</p>
          <p className="app-card__date">Applied on {application.appliedDate}</p>
        </div>
      </div>
      
      <div className="app-card__status-wrapper">
        <span className={`app-badge app-badge--${application.status.toLowerCase()}`}>
          {application.status}
        </span>
        <Link to={`/candidate/applications/${application.id}`}>
          <Button variant="outline" size="sm">View Details</Button>
        </Link>
      </div>
    </div>
  );
}