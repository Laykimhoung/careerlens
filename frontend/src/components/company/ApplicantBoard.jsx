import { useState } from "react";
import { Link } from "react-router-dom";
import "./ApplicantBoard.css";


const COLUMNS = ["New", "Reviewing", "Interview", "Offer", "Rejected"];

export default function ApplicantBoard({ applicants, onStatusChange }) {
  const [draggedAppId, setDraggedAppId] = useState(null);

  const handleDragStart = (e, id) => {
    setDraggedAppId(id);
    e.dataTransfer.setData("text/plain", id);
    setTimeout(() => {
      if (e.target) e.target.classList.add("dragging");
    }, 0);
  };

  const handleDragEnd = (e) => {
    setDraggedAppId(null);
    if (e.target) e.target.classList.remove("dragging");
    document.querySelectorAll(".board-column").forEach(c => c.classList.remove("drag-over"));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    const column = e.currentTarget;
    if (!column.classList.contains("drag-over")) {
      column.classList.add("drag-over");
    }
  };

  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove("drag-over");
  };

  const handleDrop = (e, status) => {
    e.preventDefault();
    e.currentTarget.classList.remove("drag-over");
    const id = e.dataTransfer.getData("text/plain");
    const applicant = applicants.find(a => a.id === id);
    if (applicant && applicant.status !== status) {
      onStatusChange(applicant, status);
    }
  };

  return (
    <div className="workspace-board">
      {COLUMNS.map((colStatus) => {
        const columnApplicants = applicants.filter(a => a.status === colStatus);
        
        return (
          <div 
            key={colStatus} 
            className="board-column"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, colStatus)}
          >
            <div className="board-column-header">
              {colStatus}
              <span className="board-column-count">{columnApplicants.length}</span>
            </div>
            
            {columnApplicants.map(app => (
              <div 
                key={app.id} 
                className="board-card"
                draggable
                onDragStart={(e) => handleDragStart(e, app.id)}
                onDragEnd={handleDragEnd}
              >
                <div className="board-card-title">
                  <Link to={`/company/applicants/${app.id}`} style={{color: "inherit", textDecoration: "none"}}>
                    {app.name}
                  </Link>
                </div>
                <div className="board-card-role">{app.jobTitle}</div>
                
                <div className="board-card-skills">
                  {app.skills?.slice(0,3).map(skill => (
                    <span key={skill} className="board-card-skill">{skill}</span>
                  ))}
                  {app.skills?.length > 3 && <span className="board-card-skill">+{app.skills.length - 3}</span>}
                </div>
                
                <div className="board-card-meta">
                  <span>{app.experience}</span>
                  <span>{new Date(app.appliedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric'})}</span>
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
