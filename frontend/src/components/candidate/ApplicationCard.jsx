import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import Button from "../common/Button";
import { useLanguage } from "../../context/LanguageContext";
import "./ApplicationCard.css";

export default function ApplicationCard({ application }) {
  const { t } = useLanguage();
  const logoInitial = application.company ? application.company.charAt(0) : "C";

  const getStatusLabel = (status) => {
    switch (status) {
      case "Applied":
        return t("candidate.applied", "Applied");
      case "Reviewing":
      case "Review":
        return t("candidate.reviewing", "Reviewing");
      case "Interview":
        return t("common.interview", "Interview");
      case "Offered":
      case "Offer":
        return t("candidate.offered", "Offered");
      case "Rejected":
        return t("common.rejected", "Rejected");
      default:
        return status;
    }
  };

  return (
    <div className="app-card">
      <div className="app-card__main">
        <div className="app-card__company-logo">{logoInitial}</div>
        <div>
          <Link to={`/candidate/applications/${application.id}`} className="app-card__title-link">
            <h3 className="app-card__title">{application.jobTitle}</h3>
          </Link>
          <p className="app-card__company">{application.company}</p>
          <p className="app-card__date">{t("candidate.appliedOn", "Applied on")} {application.appliedDate}</p>
        </div>
      </div>
      
      <div className="app-card__status-wrapper">
        <span className={`app-badge app-badge--${application.status.toLowerCase()}`}>
          {getStatusLabel(application.status)}
        </span>
        {["Interview", "Offered"].includes(application.status) && (
          <Link to={`/candidate/applications/${application.id}?prep=1`}>
            <Button
              variant="primary"
              size="sm"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                background: "linear-gradient(135deg, #016BFB 0%, #0ea5e9 100%)",
                border: "none",
                color: "#ffffff",
                boxShadow: "0 2px 8px rgba(1, 107, 251, 0.25)",
              }}
            >
              <Sparkles size={13} />
              <span>AI Prep</span>
            </Button>
          </Link>
        )}
        <Link to={`/candidate/applications/${application.id}`}>
          <Button variant="outline" size="sm">{t("candidate.viewDetails", "View Details")}</Button>
        </Link>
      </div>
    </div>
  );
}