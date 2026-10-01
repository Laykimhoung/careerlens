import "./Candidates.css";

function Candidate() {
  return (
    <div className="candidate-page">
      <div className="candidate-header">
        <h1>Candidate Dashboard</h1>
        <p>Welcome to CareerLens.</p>
      </div>

      <div className="candidate-content">
        <div className="card">
          <h2>Find Jobs</h2>
          <p>Search and apply for jobs that match your skills.</p>
          <button>Browse Jobs</button>
        </div>

        <div className="card">
          <h2>My Applications</h2>
          <p>Track your job applications and their status.</p>
          <button>View Applications</button>
        </div>

        <div className="card">
          <h2>My Profile</h2>
          <p>Update your personal information, skills, and experience.</p>
          <button>View Profile</button>
        </div>
      </div>
    </div>
  );
}

export default Candidate;