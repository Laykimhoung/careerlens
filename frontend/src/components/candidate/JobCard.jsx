import { Link } from "react-router-dom";
import Button from "../common/Button";
import "./JobCard.css";

export default function JobCard({ job }) {
  return (
    <div className="job-card">
      <div className="job-card__details">
        <Link to={`/candidate/jobs/${job.id}`} className="job-card__title-link">
          <h3 className="job-card__title">{job.title}</h3>
        </Link>
        <p className="job-card__meta">
          {job.company} &middot; {job.location} &middot; {job.setup} &middot; {job.type}
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
        <Button variant="outline" size="sm">Save</Button>
        <Button variant="teal" size="sm">Apply</Button>
      </div>
    </div>
  );
}