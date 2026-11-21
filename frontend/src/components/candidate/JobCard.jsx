import { Link, useNavigate } from "react-router-dom";
import { Check, Bookmark, CheckCircle2 } from "lucide-react";
import Button from "../common/Button";
import "./JobCard.css";

export default function JobCard({
  job,
  onSave,
  onApply,
  isSaved = false,
  isApplied = false,
  applying = false,
}) {
  const navigate = useNavigate();

  const handleSaveClick = () => {
    if (onSave) {
      onSave(job);
    } else {
      navigate(`/candidate/jobs/${job.id}`);
    }
  };

  const handleApplyClick = () => {
    if (onApply) {
      onApply(job);
    } else {
      navigate(`/candidate/jobs/${job.id}`);
    }
  };

  return (
    <div className="job-card">
      <div className="job-card__details">
        <Link to={`/candidate/jobs/${job.id}`} className="job-card__title-link">
          <h3 className="job-card__title">{job.title}</h3>
        </Link>
        <p className="job-card__meta">
          {job.company} &middot; {job.location} &middot; {job.setup || job.workMode} &middot; {job.type}
        </p>
        <p className="job-card__salary">{job.salary}</p>

        <div className="job-card__tags">
          {job.tags?.map((tag) => (
            <span key={tag} className="job-card__tag">
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="job-card__actions">
        <Button variant="outline" size="sm" onClick={handleSaveClick}>
          {isSaved ? (
            <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
              <Check size={14} /> Saved
            </span>
          ) : (
            "Save"
          )}
        </Button>
        <Button
          variant="teal"
          size="sm"
          onClick={handleApplyClick}
          disabled={isApplied || applying}
        >
          {isApplied ? (
            <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
              <CheckCircle2 size={14} /> Applied
            </span>
          ) : applying ? (
            "Applying..."
          ) : (
            "Apply"
          )}
        </Button>
      </div>
    </div>
  );
}