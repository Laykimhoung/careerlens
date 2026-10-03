import { useState } from "react";
import { Link } from "react-router-dom";
import Button from '../../../components/common/Button';
import SavedJobCard from '../../../components/candidate/SavedJobCard';
import { MOCK_JOBS_DB } from '../Jobs/Jobs'; // Reusing the mock data from Jobs page
import './SavedJobs.css';

export default function CandidateSavedJobs() {
  // Let's pretend the user has saved job ID 1 and 4
  const [savedJobs, setSavedJobs] = useState(() => {
    return MOCK_JOBS_DB.filter(job => job.id === 1 || job.id === 4);
  });

  // Callback function to remove a job from the list
  const handleRemove = (jobIdToRemove) => {
    // Filter out the job whose ID matches the one being removed
    setSavedJobs((prevJobs) => prevJobs.filter(job => job.id !== jobIdToRemove));
  };

  return (
    <div className="saved-jobs-page">
      <div className="saved-jobs__header">
        <span className="saved-jobs__count">
          You have {savedJobs.length} saved job{savedJobs.length !== 1 && "s"}
        </span>
      </div>

      <div className="saved-jobs__list">
        {savedJobs.length > 0 ? (
          savedJobs.map((job) => (
            <SavedJobCard 
              key={job.id} 
              job={job} 
              onRemove={handleRemove} 
            />
          ))
        ) : (
          <div className="saved-jobs__empty">
            <h3>No saved jobs</h3>
            <p>You haven't saved any jobs yet. When you save a job, it will appear here so you can easily apply later.</p>
            <Link to="/candidate/jobs">
              <Button variant="primary">Browse Jobs</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}