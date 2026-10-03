import { useState } from "react";
import Button from '../../../components/common/Button';
import './Resume.css';

// MOCK DATA
const MOCK_RESUME = {
  fileName: "Dara_Sok_Resume.pdf",
  uploadDate: "Oct 1, 2026",
  size: "2.4 MB"
};

const MOCK_EXPERIENCE = [
  {
    id: 1,
    role: "Frontend Developer",
    company: "TechNova Cambodia",
    date: "Jan 2024 - Present",
    description: "Developing scalable React applications for enterprise clients. Working closely with designers and backend engineers to implement RESTful APIs."
  },
  {
    id: 2,
    role: "Web Development Intern",
    company: "Angkor Software",
    date: "Jun 2023 - Dec 2023",
    description: "Assisted in building UI components and fixing bugs. Wrote unit tests and improved overall code coverage by 15%."
  }
];

const MOCK_EDUCATION = [
  {
    id: 1,
    degree: "Bachelor of Computer Science",
    school: "Royal University of Phnom Penh",
    date: "2020 - 2024",
    description: "Graduated with honors. Relevant coursework: Data Structures, Algorithms, Web Development."
  }
];

export default function CandidateResume() {
  const [hasResume, setHasResume] = useState(true);

  return (
    <div className="resume-page">
      
      {/* Upload Section */}
      <div className="resume-section">
        <h2 className="resume-section__title" style={{ marginBottom: "24px" }}>CV / Resume</h2>
        
        {hasResume ? (
          <div className="resume-file">
            <div className="resume-file__info">
              <svg className="resume-file__icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              <div className="resume-file__details">
                <p>{MOCK_RESUME.fileName}</p>
                <span>Uploaded on {MOCK_RESUME.uploadDate} &middot; {MOCK_RESUME.size}</span>
              </div>
            </div>
            <div className="resume-file__actions">
              <Button variant="outline" size="sm">Download</Button>
              <Button variant="danger" size="sm" onClick={() => setHasResume(false)}>Delete</Button>
            </div>
          </div>
        ) : (
          <div className="resume-upload" onClick={() => setHasResume(true)}>
            <svg className="resume-upload__icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
            </svg>
            <p className="resume-upload__text"><strong>Click to upload</strong> or drag and drop</p>
            <p className="resume-upload__hint">PDF, DOCX up to 5MB</p>
          </div>
        )}
      </div>

      {/* Experience Section */}
      <div className="resume-section">
        <div className="resume-section__header">
          <h2 className="resume-section__title">Work Experience</h2>
          <Button variant="outline" size="sm">+ Add New</Button>
        </div>
        
        <div className="timeline">
          {MOCK_EXPERIENCE.map(exp => (
            <div key={exp.id} className="timeline-item">
              <div className="timeline-item__header">
                <div>
                  <h3 className="timeline-item__title">{exp.role}</h3>
                  <p className="timeline-item__subtitle">{exp.company}</p>
                </div>
                <span className="timeline-item__date">{exp.date}</span>
              </div>
              <p className="timeline-item__desc">{exp.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Education Section */}
      <div className="resume-section">
        <div className="resume-section__header">
          <h2 className="resume-section__title">Education</h2>
          <Button variant="outline" size="sm">+ Add New</Button>
        </div>
        
        <div className="timeline">
          {MOCK_EDUCATION.map(edu => (
            <div key={edu.id} className="timeline-item">
              <div className="timeline-item__header">
                <div>
                  <h3 className="timeline-item__title">{edu.degree}</h3>
                  <p className="timeline-item__subtitle">{edu.school}</p>
                </div>
                <span className="timeline-item__date">{edu.date}</span>
              </div>
              <p className="timeline-item__desc">{edu.description}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}