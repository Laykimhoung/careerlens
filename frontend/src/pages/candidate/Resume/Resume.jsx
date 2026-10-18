import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../../../hooks/useAuth";
import Button from "../../../components/common/Button";
import {
  getCurrentCandidateProfile,
  updateCandidateProfile,
  uploadCandidateResume,
  deleteCandidateResume,
} from "../../../services/candidateService";
import "./Resume.css";

export default function CandidateResume() {
  const { user } = useAuth();
  const fileInputRef = useRef(null);

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: "", text: "" });

  // Skills management
  const [skills, setSkills] = useState([]);
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillProficiency, setNewSkillProficiency] = useState("INTERMEDIATE");
  const [savingSkills, setSavingSkills] = useState(false);

  // Education & Summary editing
  const [editingEdu, setEditingEdu] = useState(false);
  const [eduForm, setEduForm] = useState({
    university: "",
    major: "",
    graduation_year: "",
    bio: "",
  });
  const [savingEdu, setSavingEdu] = useState(false);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const cand = await getCurrentCandidateProfile(user?.id);
      if (cand) {
        setProfile(cand);
        const mappedSkills = (cand.skills || []).map((s) => ({
          name: s.skill?.name || s.name || String(s),
          proficiency: s.proficiency || "INTERMEDIATE",
        }));
        setSkills(mappedSkills);
        setEduForm({
          university: cand.university || "",
          major: cand.major || "",
          graduation_year: cand.graduation_year ? String(cand.graduation_year) : "",
          bio: cand.bio || "",
        });
      }
    } catch (err) {
      setStatusMsg({
        type: "error",
        text: err.response?.data?.detail || "Failed to load resume & profile data.",
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !profile?.id) return;
    setUploading(true);
    setStatusMsg({ type: "", text: "" });
    try {
      const res = await uploadCandidateResume(profile.id, file);
      setProfile(res.data);
      setStatusMsg({ type: "success", text: `Uploaded "${file.name}" successfully.` });
    } catch (err) {
      setStatusMsg({
        type: "error",
        text: err.response?.data?.detail || "Failed to upload resume file.",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteResume = async () => {
    if (!profile?.id) return;
    setUploading(true);
    setStatusMsg({ type: "", text: "" });
    try {
      const res = await deleteCandidateResume(profile.id);
      setProfile(res.data);
      setStatusMsg({ type: "success", text: "Resume removed from your profile." });
    } catch (err) {
      setStatusMsg({
        type: "error",
        text: err.response?.data?.detail || "Failed to delete resume.",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleAddSkill = async (e) => {
    e.preventDefault();
    const trimmed = newSkillName.trim();
    if (!trimmed || !profile?.id) return;
    const updated = [
      ...skills.filter((s) => s.name.toLowerCase() !== trimmed.toLowerCase()),
      { name: trimmed, proficiency: newSkillProficiency },
    ];
    setSavingSkills(true);
    setStatusMsg({ type: "", text: "" });
    try {
      await updateCandidateProfile(profile.id, { skills: updated });
      setSkills(updated);
      setNewSkillName("");
      setStatusMsg({ type: "success", text: `Skill "${trimmed}" saved.` });
    } catch (err) {
      setStatusMsg({
        type: "error",
        text: err.response?.data?.detail || "Failed to update skills.",
      });
    } finally {
      setSavingSkills(false);
    }
  };

  const handleRemoveSkill = async (skillName) => {
    if (!profile?.id) return;
    const updated = skills.filter((s) => s.name !== skillName);
    setSavingSkills(true);
    try {
      await updateCandidateProfile(profile.id, { skills: updated });
      setSkills(updated);
      setStatusMsg({ type: "success", text: `Removed "${skillName}".` });
    } catch (err) {
      setStatusMsg({
        type: "error",
        text: err.response?.data?.detail || "Failed to remove skill.",
      });
    } finally {
      setSavingSkills(false);
    }
  };

  const handleSaveEdu = async (e) => {
    e.preventDefault();
    if (!profile?.id) return;
    setSavingEdu(true);
    setStatusMsg({ type: "", text: "" });
    try {
      const res = await updateCandidateProfile(profile.id, {
        university: eduForm.university.trim(),
        major: eduForm.major.trim(),
        graduation_year: eduForm.graduation_year ? Number(eduForm.graduation_year) : null,
        bio: eduForm.bio.trim(),
      });
      setProfile(res.data);
      setEditingEdu(false);
      setStatusMsg({ type: "success", text: "Education and professional summary updated." });
    } catch (err) {
      setStatusMsg({
        type: "error",
        text: err.response?.data?.detail || "Failed to save education details.",
      });
    } finally {
      setSavingEdu(false);
    }
  };

  const resumeUrl = profile?.resume_file || null;
  const resumeFileName = resumeUrl
    ? decodeURIComponent(resumeUrl.split("/").pop())
    : "";

  return (
    <div className="resume-page">
      {statusMsg.text && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "8px",
            backgroundColor: statusMsg.type === "error" ? "#fef2f2" : "#f0fdf4",
            color: statusMsg.type === "error" ? "#b91c1c" : "#15803d",
            fontSize: "14px",
          }}
        >
          {statusMsg.text}
        </div>
      )}

      {/* Upload Section */}
      <div className="resume-section">
        <h2 className="resume-section__title" style={{ marginBottom: "24px" }}>
          CV / Resume
        </h2>

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />

        {loading ? (
          <p style={{ color: "#64748b" }}>Loading resume status...</p>
        ) : resumeUrl ? (
          <div className="resume-file">
            <div className="resume-file__info">
              <svg
                className="resume-file__icon"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                />
              </svg>
              <div className="resume-file__details">
                <p>{resumeFileName}</p>
                <span>Stored in your candidate profile</span>
              </div>
            </div>
            <div className="resume-file__actions">
              <a href={resumeUrl} target="_blank" rel="noreferrer">
                <Button variant="outline" size="sm" type="button">
                  View / Download
                </Button>
              </a>
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                Replace
              </Button>
              <Button
                variant="danger"
                size="sm"
                type="button"
                onClick={handleDeleteResume}
                disabled={uploading}
              >
                Delete
              </Button>
            </div>
          </div>
        ) : (
          <div
            className="resume-upload"
            onClick={() => !uploading && fileInputRef.current?.click()}
          >
            <svg
              className="resume-upload__icon"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z"
              />
            </svg>
            <p className="resume-upload__text">
              <strong>{uploading ? "Uploading..." : "Click to upload"}</strong> or drag and drop
            </p>
            <p className="resume-upload__hint">PDF, DOC, DOCX up to 5MB</p>
          </div>
        )}
      </div>

      {/* Skills & Competencies Section */}
      <div className="resume-section">
        <div className="resume-section__header">
          <h2 className="resume-section__title">Skills & Proficiencies</h2>
        </div>

        <form
          onSubmit={handleAddSkill}
          style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "20px" }}
        >
          <input
            type="text"
            placeholder="Add skill (e.g. React, Python, SQL)"
            value={newSkillName}
            onChange={(e) => setNewSkillName(e.target.value)}
            style={{
              flex: "1 1 220px",
              padding: "9px 12px",
              border: "1px solid #cbd5e1",
              borderRadius: "6px",
              fontSize: "14px",
            }}
          />
          <select
            value={newSkillProficiency}
            onChange={(e) => setNewSkillProficiency(e.target.value)}
            style={{
              padding: "9px 12px",
              border: "1px solid #cbd5e1",
              borderRadius: "6px",
              fontSize: "14px",
              background: "#fff",
            }}
          >
            <option value="BEGINNER">Beginner</option>
            <option value="INTERMEDIATE">Intermediate</option>
            <option value="ADVANCED">Advanced</option>
            <option value="EXPERT">Expert</option>
          </select>
          <Button type="submit" variant="teal" size="sm" disabled={savingSkills}>
            + Add Skill
          </Button>
        </form>

        {skills.length > 0 ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
            {skills.map((s) => (
              <div
                key={s.name}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "6px 12px",
                  backgroundColor: "#f1f5f9",
                  border: "1px solid #e2e8f0",
                  borderRadius: "999px",
                  fontSize: "13px",
                  color: "#0f172a",
                }}
              >
                <strong>{s.name}</strong>
                <span style={{ color: "#64748b", fontSize: "11px" }}>({s.proficiency})</span>
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(s.name)}
                  disabled={savingSkills}
                  style={{
                    border: "none",
                    background: "transparent",
                    color: "#ef4444",
                    cursor: "pointer",
                    fontWeight: "bold",
                    fontSize: "14px",
                    padding: "0 2px",
                  }}
                  title="Remove skill"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: "#64748b", fontSize: "14px" }}>
            No skills added yet. Add your technical and soft skills above.
          </p>
        )}
      </div>

      {/* Education & Summary Section */}
      <div className="resume-section">
        <div className="resume-section__header">
          <h2 className="resume-section__title">Education & Professional Summary</h2>
          {!editingEdu && (
            <Button variant="outline" size="sm" onClick={() => setEditingEdu(true)}>
              Edit Education
            </Button>
          )}
        </div>

        {editingEdu ? (
          <form onSubmit={handleSaveEdu} style={{ display: "grid", gap: "14px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>
                  Degree / Major
                </label>
                <input
                  type="text"
                  value={eduForm.major}
                  onChange={(e) => setEduForm({ ...eduForm, major: e.target.value })}
                  placeholder="e.g. Bachelor of Computer Science"
                  style={{ width: "100%", padding: "9px 12px", border: "1px solid #cbd5e1", borderRadius: "6px" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>
                  University / School
                </label>
                <input
                  type="text"
                  value={eduForm.university}
                  onChange={(e) => setEduForm({ ...eduForm, university: e.target.value })}
                  placeholder="e.g. Royal University of Phnom Penh"
                  style={{ width: "100%", padding: "9px 12px", border: "1px solid #cbd5e1", borderRadius: "6px" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>
                  Graduation Year
                </label>
                <input
                  type="number"
                  value={eduForm.graduation_year}
                  onChange={(e) => setEduForm({ ...eduForm, graduation_year: e.target.value })}
                  placeholder="e.g. 2026"
                  style={{ width: "100%", padding: "9px 12px", border: "1px solid #cbd5e1", borderRadius: "6px" }}
                />
              </div>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>
                Experience & Academic Summary
              </label>
              <textarea
                rows={4}
                value={eduForm.bio}
                onChange={(e) => setEduForm({ ...eduForm, bio: e.target.value })}
                placeholder="Summarize your work experience, projects, and academic achievements..."
                style={{ width: "100%", padding: "9px 12px", border: "1px solid #cbd5e1", borderRadius: "6px" }}
              />
            </div>
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <Button type="button" variant="outline" size="sm" onClick={() => setEditingEdu(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="teal" size="sm" loading={savingEdu}>
                Save Education
              </Button>
            </div>
          </form>
        ) : (
          <div className="timeline">
            <div className="timeline-item">
              <div className="timeline-item__header">
                <div>
                  <h3 className="timeline-item__title">
                    {profile?.major || "Major / Degree not specified"}
                  </h3>
                  <p className="timeline-item__subtitle">
                    {profile?.university || "University not specified"}
                  </p>
                </div>
                <span className="timeline-item__date">
                  {profile?.graduation_year ? `Class of ${profile.graduation_year}` : "Ongoing"}
                </span>
              </div>
              <p className="timeline-item__desc">
                {profile?.bio || "No professional summary added yet. Click 'Edit Education' to add your academic and work experience summary."}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}