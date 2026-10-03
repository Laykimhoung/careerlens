import { useParams, Link } from "react-router-dom";
import Button from "../../components/common/Button";
import { MOCK_JOBS_DB } from "./Jobs";
import "./JobDetails.css";

export default function CandidateJobDetails() {
  const { id } = useParams();
  
  // Find the job in our mock database based on the URL parameter
  const job = MOCK_JOBS_DB.find((j) => j.id === parseInt(id));

  if (!job) {
    return (
      <div className="job-details-page">
        <div className="job-not-found">
          <h2>Job not found</h2>
          <p style={{ marginBottom: "24px", color: "#6b7280" }}>
            The job you are looking for does not exist or has been removed.
          </p>
          <Link to="/candidate/jobs">
            <Button variant="primary">Back to Jobs</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="job-details-page">
      <Link to="/candidate/jobs" className="job-details__back">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: "16px", height: "16px" }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
        Back to Jobs
      </Link>

      <div className="job-details__header">
        <div>
          <h1 className="job-details__title">{job.title}</h1>
          <p className="job-details__subtitle">
            {job.company} &middot; {job.location}
          </p>
          <div className="job-details__tags">
            {job.tags?.map((tag) => (
              <span key={tag} className="job-details__tag">{tag}</span>
            ))}
          </div>
        </div>
        <div className="job-details__actions">
          <Button variant="outline">Save Job</Button>
          <Button variant="teal">Apply Now</Button>
        </div>
      </div>

      <div className="job-details__content">
        <div className="job-details__body">
          <div className="job-details__section">
            <h3>Job Description</h3>
            <p>
              We are looking for a passionate <strong>{job.title}</strong> to join our team at {job.company}. 
              In this role, you will be responsible for building and maintaining modern applications, 
              working closely with our design and product teams to deliver high-quality software.
            </p>
            <p>
              The ideal candidate is a self-starter who thrives in a collaborative environment and has a strong foundation in modern web technologies.
            </p>
          </div>

          <div className="job-details__section">
            <h3>Key Responsibilities</h3>
            <ul>
              <li>Develop new user-facing features using modern frameworks.</li>
              <li>Build reusable code and libraries for future use.</li>
              <li>Ensure the technical feasibility of UI/UX designs.</li>
              <li>Optimize application for maximum speed and scalability.</li>
              <li>Collaborate with other team members and stakeholders.</li>
            </ul>
          </div>

          <div className="job-details__section">
            <h3>Requirements</h3>
            <ul>
              <li>Proven experience in software development.</li>
              <li>Strong proficiency in JavaScript, including DOM manipulation.</li>
              <li>Thorough understanding of React.js and its core principles.</li>
              <li>Familiarity with RESTful APIs and modern authorization mechanisms.</li>
              <li>Ability to understand business requirements and translate them into technical requirements.</li>
            </ul>
          </div>
        </div>

        <aside className="job-details__sidebar">
          <div className="job-summary__item">
            <span className="job-summary__label">Salary</span>
            <span className="job-summary__value">{job.salary}</span>
          </div>
          <div className="job-summary__item">
            <span className="job-summary__label">Job Type</span>
            <span className="job-summary__value">{job.type}</span>
          </div>
          <div className="job-summary__item">
            <span className="job-summary__label">Work Setup</span>
            <span className="job-summary__value">{job.setup}</span>
          </div>
          <div className="job-summary__item">
            <span className="job-summary__label">Posted</span>
            <span className="job-summary__value">{job.postedDate}</span>
          </div>
        </aside>
      </div>
    </div>
  );
}