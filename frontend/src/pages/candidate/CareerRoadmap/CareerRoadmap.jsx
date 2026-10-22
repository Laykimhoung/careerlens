import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Compass,
  Sparkles,
  Target,
  CheckCircle2,
  Clock,
  BookOpen,
  Code2,
  FileCheck,
  Briefcase,
  ChevronRight,
  ChevronDown,
  Layers,
  ArrowRight,
  ExternalLink,
  RefreshCw,
  Plus,
  Edit3,
  Save,
  Check,
  AlertCircle,
  HelpCircle,
  Flame,
  Award,
  Bookmark,
  Share2,
  FolderGit2,
  UserCheck,
  Sliders,
  X,
} from "lucide-react";
import { useAuth } from "../../../hooks/useAuth";
import { useLanguage } from "../../../context/LanguageContext";
import {
  getCareerRoadmap,
  generateCareerRoadmap,
  updateMilestoneProgress,
  updateSkillStatus,
  syncSkillToProfile,
  recalculateRoadmap,
  getRoadmapOptions,
} from "../../../services/roadmapService";
import "./CareerRoadmap.css";

export default function CareerRoadmap() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Loading & State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [roadmap, setRoadmap] = useState(null);
  const [options, setOptions] = useState({ popular_roles: [], available_jobs: [] });

  // Target Selection Modal
  const [isSelectModalOpen, setIsSelectModalOpen] = useState(false);
  const [targetRoleInput, setTargetRoleInput] = useState("");
  const [selectedJobId, setSelectedJobId] = useState("");
  const [weeklyHoursInput, setWeeklyHoursInput] = useState(10);
  const [generating, setGenerating] = useState(false);

  // Sync Skill Modal
  const [syncSkillModal, setSyncSkillModal] = useState({ isOpen: false, skillName: "", proficiency: "INTERMEDIATE" });
  const [syncingSkill, setSyncingSkill] = useState(false);

  // Expanded Stages & Active Tab
  const [expandedStages, setExpandedStages] = useState({ stage_1: true, stage_2: true });
  const [activeSkillTab, setActiveSkillTab] = useState("missing"); // 'missing' | 'demonstrated' | 'recommendations'
  const [actionSuccess, setActionSuccess] = useState("");

  // Notes editing state per milestone
  const [editingNotesId, setEditingNotesId] = useState(null);
  const [noteText, setNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  // Load Roadmap
  const loadRoadmapData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [roadmapRes, optionsRes] = await Promise.all([
        getCareerRoadmap().catch(() => ({ data: { has_roadmap: false, roadmap: null } })),
        getRoadmapOptions().catch(() => ({ data: { popular_roles: [], available_jobs: [] } })),
      ]);

      if (optionsRes?.data) {
        setOptions(optionsRes.data);
      }

      if (roadmapRes?.data?.has_roadmap && roadmapRes?.data?.roadmap) {
        setRoadmap(roadmapRes.data.roadmap);
        setTargetRoleInput(roadmapRes.data.roadmap.target_role || "");
        setWeeklyHoursInput(roadmapRes.data.roadmap.weekly_hours || 10);
      } else {
        // If query param passed e.g. role or job_id
        const paramRole = searchParams.get("role");
        const paramJobId = searchParams.get("job_id");
        if (paramRole || paramJobId) {
          setTargetRoleInput(paramRole || "");
          setSelectedJobId(paramJobId || "");
          setIsSelectModalOpen(true);
        } else {
          // Open target selection modal if no roadmap yet
          setIsSelectModalOpen(true);
        }
      }
    } catch (err) {
      setError("Failed to load your career roadmap.");
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    loadRoadmapData();
  }, [loadRoadmapData]);

  // Handle Generate or Switch Roadmap
  const handleGenerateRoadmap = async (e) => {
    if (e) e.preventDefault();
    if (!targetRoleInput.trim() && !selectedJobId) {
      alert("Please select a target role or a job listing.");
      return;
    }
    setGenerating(true);
    try {
      const payload = {
        target_role: targetRoleInput.trim(),
        target_job_id: selectedJobId ? parseInt(selectedJobId, 10) : null,
        weekly_hours: weeklyHoursInput,
      };
      const res = await generateCareerRoadmap(payload);
      setRoadmap(res.data.roadmap);
      setIsSelectModalOpen(false);
      setActionSuccess("Your personalized Career Roadmap has been generated!");
      setTimeout(() => setActionSuccess(""), 4000);
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to generate roadmap.");
    } finally {
      setGenerating(false);
    }
  };

  // Toggle stage accordion
  const toggleStage = (stageId) => {
    setExpandedStages((prev) => ({
      ...prev,
      [stageId]: !prev[stageId],
    }));
  };

  // Toggle milestone status
  const handleMilestoneStatusToggle = async (stageId, milestone) => {
    const nextStatus =
      milestone.status === "completed"
        ? "not_started"
        : milestone.status === "in_progress"
        ? "completed"
        : "in_progress";

    try {
      const res = await updateMilestoneProgress({
        stage_id: stageId,
        milestone_id: milestone.id,
        status: nextStatus,
      });
      setRoadmap(res.data.roadmap);
    } catch (err) {
      alert("Failed to update milestone status.");
    }
  };

  // Save milestone notes
  const handleSaveMilestoneNotes = async (stageId, milestoneId) => {
    setSavingNote(true);
    try {
      const res = await updateMilestoneProgress({
        stage_id: stageId,
        milestone_id: milestoneId,
        notes: noteText,
      });
      setRoadmap(res.data.roadmap);
      setEditingNotesId(null);
    } catch {
      alert("Failed to save personal notes.");
    } finally {
      setSavingNote(false);
    }
  };

  // Toggle skill gap status (candidate correction: gap, confirmed_know, learning, completed)
  const handleSkillStatusChange = async (skillName, newStatus) => {
    try {
      const res = await updateSkillStatus({
        skill_name: skillName,
        status: newStatus,
      });
      setRoadmap(res.data.roadmap);
      setActionSuccess(`Updated assessment for ${skillName}. Readiness score recalculated!`);
      setTimeout(() => setActionSuccess(""), 3500);
    } catch {
      alert("Failed to update skill status.");
    }
  };

  // Sync skill to candidate profile
  const handleConfirmSyncSkill = async () => {
    if (!syncSkillModal.skillName) return;
    setSyncingSkill(true);
    try {
      const res = await syncSkillToProfile({
        skill_name: syncSkillModal.skillName,
        proficiency: syncSkillModal.proficiency,
      });
      setActionSuccess(res.data.message || `Skill '${syncSkillModal.skillName}' added to your verified profile!`);
      setSyncSkillModal({ isOpen: false, skillName: "", proficiency: "INTERMEDIATE" });
      // Re-run gap analysis
      const recRes = await recalculateRoadmap();
      setRoadmap(recRes.data.roadmap);
      setTimeout(() => setActionSuccess(""), 4500);
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to sync skill to profile.");
    } finally {
      setSyncingSkill(false);
    }
  };

  // Recalculate Roadmap
  const handleRecalculate = async () => {
    setLoading(true);
    try {
      const res = await recalculateRoadmap();
      setRoadmap(res.data.roadmap);
      setActionSuccess("Roadmap successfully refreshed with your latest CV and profile data!");
      setTimeout(() => setActionSuccess(""), 4000);
    } catch {
      alert("Failed to recalculate roadmap.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="career-roadmap-page">
      {/* ── Top Header ──────────────────────────────────────────────────────── */}
      <div className="roadmap-header">
        <div className="roadmap-header-left">
          <div className="roadmap-header-badge">
            <Compass className="w-4 h-4 text-indigo-500" />
            <span>Career Navigation & Readiness</span>
          </div>
          <h1 className="roadmap-header-title">My Career Roadmap</h1>
          <p className="roadmap-header-subtitle">
            Bridge your technical skill gaps, master prioritized milestones, and systematically level up for your target role.
          </p>
        </div>

        <div className="roadmap-header-actions">
          <button
            type="button"
            className="btn-roadmap-outline"
            onClick={handleRecalculate}
            title="Re-run analysis against latest CV"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Recalculate</span>
          </button>

          <button
            type="button"
            className="btn-roadmap-primary"
            onClick={() => setIsSelectModalOpen(true)}
          >
            <Target className="w-4 h-4" />
            <span>Change Target Career</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {actionSuccess && (
        <div className="roadmap-alert-success animate-fade">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="roadmap-alert-error">
          <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="roadmap-loading-state">
          <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
          <p>Analyzing candidate profile and career requirements...</p>
        </div>
      ) : !roadmap ? (
        <div className="roadmap-empty-state">
          <Compass className="w-16 h-16 text-indigo-400 mb-3" />
          <h2>Select Your Target Career</h2>
          <p>
            Choose a target position from available CareerLens jobs or enter a role title (e.g. Backend Developer, QA Tester) to generate your custom staged learning roadmap.
          </p>
          <button
            type="button"
            className="btn-roadmap-primary btn-lg mt-3"
            onClick={() => setIsSelectModalOpen(true)}
          >
            <Target className="w-5 h-5" />
            <span>Choose Target Career</span>
          </button>
        </div>
      ) : (
        <div className="roadmap-content-grid">
          {/* ── Top Hero: Target Career & Readiness Bar ─────────────────────── */}
          <div className="roadmap-target-hero">
            <div className="target-hero-left">
              <span className="target-hero-tag">TARGET POSITION</span>
              <h2 className="target-hero-role">{roadmap.target_role}</h2>
              {roadmap.target_job ? (
                <div className="target-job-meta">
                  <span className="job-meta-pill">
                    <Briefcase className="w-3.5 h-3.5" />
                    {roadmap.target_job.company?.company_name || "Partner Company"}
                  </span>
                  <span className="job-meta-pill">
                    {roadmap.target_job.location || "Cambodia"}
                  </span>
                  <span className="job-meta-pill">
                    {roadmap.target_job.employment_type?.replace("_", " ")}
                  </span>
                  <Link
                    to={`/candidate/jobs/${roadmap.target_job.id}`}
                    className="job-details-link"
                  >
                    <span>View Job Details</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              ) : (
                <p className="target-role-desc">
                  Custom target role roadmap generated based on current industry requirements and CareerLens job listings.
                </p>
              )}
            </div>

            <div className="target-hero-right">
              {/* Readiness Score Card */}
              <div className="readiness-card">
                <div className="readiness-score-row">
                  <div className="readiness-circle-wrap">
                    <span className="readiness-val">{roadmap.readiness_score}%</span>
                  </div>
                  <div>
                    <strong className="readiness-label">Role Readiness</strong>
                    <span className="readiness-sub">
                      {roadmap.demonstrated_skills?.length || 0} demonstrated / {roadmap.missing_skills?.length || 0} to learn
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="readiness-progress-track">
                  <div
                    className="readiness-progress-fill"
                    style={{ width: `${roadmap.readiness_score}%` }}
                  />
                </div>

                <div className="roadmap-quick-metrics">
                  <div className="metric-col">
                    <span className="metric-num">{roadmap.completed_milestones || 0}/{roadmap.total_milestones || 0}</span>
                    <span className="metric-lbl">Milestones</span>
                  </div>
                  <div className="metric-divider" />
                  <div className="metric-col">
                    <span className="metric-num">{roadmap.weekly_hours} hrs</span>
                    <span className="metric-lbl">Weekly Target</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Section 2: Skill-Gap Analysis Dashboard ──────────────────────── */}
          <div className="roadmap-skillgap-card">
            <div className="skillgap-card-header">
              <div>
                <h3 className="section-title">Skill-Gap Assessment</h3>
                <p className="section-subtitle">
                  Compare your verified CV profile against {roadmap.target_role} requirements. You can correct missing skills if you already know them.
                </p>
              </div>

              {/* Skill Tabs */}
              <div className="skillgap-tabs">
                <button
                  type="button"
                  className={`skillgap-tab ${activeSkillTab === "missing" ? "active" : ""}`}
                  onClick={() => setActiveSkillTab("missing")}
                >
                  <span>Skill Gaps ({roadmap.missing_skills?.length || 0})</span>
                </button>
                <button
                  type="button"
                  className={`skillgap-tab ${activeSkillTab === "demonstrated" ? "active" : ""}`}
                  onClick={() => setActiveSkillTab("demonstrated")}
                >
                  <span>Demonstrated ({roadmap.demonstrated_skills?.length || 0})</span>
                </button>
                <button
                  type="button"
                  className={`skillgap-tab ${activeSkillTab === "recommendations" ? "active" : ""}`}
                  onClick={() => setActiveSkillTab("recommendations")}
                >
                  <span>Recommendations ({roadmap.additional_recommendations?.length || 0})</span>
                </button>
              </div>
            </div>

            {/* TAB A: Missing Skills with Interactive Statuses */}
            {activeSkillTab === "missing" && (
              <div className="skill-gap-list">
                {(!roadmap.missing_skills || roadmap.missing_skills.length === 0) ? (
                  <div className="skills-all-matched">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" />
                    <p className="font-semibold text-emerald-700 dark:text-emerald-400">
                      Outstanding! You have demonstrated all core technical skills for this role.
                    </p>
                  </div>
                ) : (
                  roadmap.missing_skills.map((skill, idx) => {
                    const status = skill.status || "gap";
                    return (
                      <div key={idx} className={`skill-gap-row skill-status-${status}`}>
                        <div className="skill-row-left">
                          <div className="skill-title-block">
                            <strong className="skill-name">{skill.name}</strong>
                            <span className={`priority-pill priority-${skill.priority?.toLowerCase()}`}>
                              {skill.priority} Priority
                            </span>
                            <span className="category-pill">{skill.category}</span>
                          </div>
                          <span className="skill-note">
                            {status === "gap" && "Not yet demonstrated in your active CV"}
                            {status === "confirmed_know" && "Confirmed: You already have knowledge in this skill"}
                            {status === "learning" && "In Progress: You are currently studying this skill"}
                            {status === "completed" && "Completed: You have mastered this skill"}
                          </span>
                        </div>

                        <div className="skill-row-right">
                          {/* Candidate Assessment Selector */}
                          <select
                            value={status}
                            onChange={(e) => handleSkillStatusChange(skill.name, e.target.value)}
                            className="skill-status-select"
                            title="Update your assessment for this skill"
                          >
                            <option value="gap">Gap (Need to Learn)</option>
                            <option value="confirmed_know">I Already Know This</option>
                            <option value="learning">Currently Learning</option>
                            <option value="completed">Completed / Mastered</option>
                          </select>

                          {/* Explicit Sync to Profile Button */}
                          {(status === "completed" || status === "confirmed_know") && (
                            <button
                              type="button"
                              className="btn-sync-skill"
                              title="Add this skill to your verified Candidate Profile"
                              onClick={() => setSyncSkillModal({
                                isOpen: true,
                                skillName: skill.name,
                                proficiency: "INTERMEDIATE",
                              })}
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>Add to Profile</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* TAB B: Demonstrated Skills */}
            {activeSkillTab === "demonstrated" && (
              <div className="demonstrated-skills-grid">
                {(!roadmap.demonstrated_skills || roadmap.demonstrated_skills.length === 0) ? (
                  <p className="text-slate-500 text-sm">No demonstrated skills recorded yet. Upload a CV in Resume Analyzer to populate.</p>
                ) : (
                  roadmap.demonstrated_skills.map((skill, idx) => (
                    <div key={idx} className="demonstrated-skill-badge">
                      <Check className="w-4 h-4 text-emerald-500" />
                      <div>
                        <strong className="demonstrated-name">{skill.name}</strong>
                        <span className="demonstrated-source">{skill.source || "CV Verified"} • {skill.category}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB C: Additional Recommendations */}
            {activeSkillTab === "recommendations" && (
              <div className="recommendations-list">
                {roadmap.additional_recommendations?.map((rec, idx) => (
                  <div key={idx} className="recommendation-item">
                    <Sparkles className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Section 3: 5-Staged Personalized Learning Roadmap ───────────── */}
          <div className="roadmap-stages-section">
            <div className="stages-section-header">
              <div>
                <h3 className="section-title">Staged Learning Roadmap (5 Stages)</h3>
                <p className="section-subtitle">
                  A structured, progressive path designed around your background and commit time of {roadmap.weekly_hours} hours/week.
                </p>
              </div>
            </div>

            <div className="stages-accordion-list">
              {(roadmap.stages || []).map((stage) => {
                const isExpanded = Boolean(expandedStages[stage.id]);
                const completedCount = (stage.milestones || []).filter((m) => m.status === "completed").length;
                const totalCount = stage.milestones?.length || 0;
                const isAllDone = totalCount > 0 && completedCount === totalCount;

                return (
                  <div
                    key={stage.id}
                    className={`stage-card ${isAllDone ? "stage-card-done" : ""}`}
                  >
                    {/* Stage Header */}
                    <div
                      className="stage-card-header"
                      onClick={() => toggleStage(stage.id)}
                    >
                      <div className="stage-header-main">
                        <div className={`stage-number-pill ${isAllDone ? "pill-done" : ""}`}>
                          {isAllDone ? <Check className="w-4 h-4" /> : stage.stage_number}
                        </div>
                        <div>
                          <h4 className="stage-title">{stage.title}</h4>
                          <p className="stage-desc">{stage.description}</p>
                        </div>
                      </div>

                      <div className="stage-header-meta">
                        <span className="stage-weeks-pill">
                          <Clock className="w-3.5 h-3.5" />
                          Est. {stage.estimated_weeks} {stage.estimated_weeks === 1 ? "Week" : "Weeks"}
                        </span>
                        <span className="stage-progress-badge">
                          {completedCount}/{totalCount} Done
                        </span>
                        <ChevronDown className={`w-5 h-5 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                      </div>
                    </div>

                    {/* Stage Body (Milestones) */}
                    {isExpanded && (
                      <div className="stage-card-body">
                        <div className="milestones-list">
                          {(stage.milestones || []).map((milestone) => {
                            const isDone = milestone.status === "completed";
                            const isInProgress = milestone.status === "in_progress";
                            const isEditingNotes = editingNotesId === milestone.id;

                            return (
                              <div
                                key={milestone.id}
                                className={`milestone-item ${isDone ? "milestone-done" : ""} ${isInProgress ? "milestone-inprogress" : ""}`}
                              >
                                <div className="milestone-top-row">
                                  {/* Checkbox */}
                                  <button
                                    type="button"
                                    className={`milestone-checkbox ${isDone ? "checkbox-checked" : ""} ${isInProgress ? "checkbox-inprogress" : ""}`}
                                    onClick={() => handleMilestoneStatusToggle(stage.id, milestone)}
                                    title={`Click to toggle: ${milestone.status}`}
                                  >
                                    {isDone ? <Check className="w-3.5 h-3.5" /> : isInProgress ? <div className="dot-inprogress" /> : null}
                                  </button>

                                  <div className="milestone-details">
                                    <div className="milestone-title-row">
                                      <strong className={`milestone-title ${isDone ? "line-through opacity-70" : ""}`}>
                                        {milestone.title}
                                      </strong>
                                      <span className={`status-pill status-${milestone.status}`}>
                                        {milestone.status?.replace("_", " ")}
                                      </span>
                                    </div>
                                    <p className="milestone-description">{milestone.description}</p>

                                    {milestone.deliverables && (
                                      <div className="milestone-deliverable-box">
                                        <FolderGit2 className="w-3.5 h-3.5 text-indigo-500" />
                                        <span><strong>Deliverable:</strong> {milestone.deliverables}</span>
                                      </div>
                                    )}

                                    {/* Verified Learning Resources */}
                                    {milestone.resources && milestone.resources.length > 0 && (
                                      <div className="milestone-resources-row">
                                        <span className="resources-lbl">Verified Resources:</span>
                                        {milestone.resources.map((res, rIdx) => (
                                          <a
                                            key={rIdx}
                                            href={res.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="resource-link-pill"
                                            title={res.description || res.name}
                                          >
                                            <BookOpen className="w-3 h-3" />
                                            <span>{res.name}</span>
                                            <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                                          </a>
                                        ))}
                                      </div>
                                    )}

                                    {/* Personal Notes Display & Editor */}
                                    <div className="milestone-notes-wrap">
                                      {isEditingNotes ? (
                                        <div className="notes-editor-box">
                                          <textarea
                                            rows={2}
                                            value={noteText}
                                            onChange={(e) => setNoteText(e.target.value)}
                                            placeholder="Add notes, study progress, or GitHub repository links..."
                                            className="notes-textarea"
                                          />
                                          <div className="notes-actions">
                                            <button
                                              type="button"
                                              className="btn-note-cancel"
                                              onClick={() => setEditingNotesId(null)}
                                            >
                                              Cancel
                                            </button>
                                            <button
                                              type="button"
                                              className="btn-note-save"
                                              disabled={savingNote}
                                              onClick={() => handleSaveMilestoneNotes(stage.id, milestone.id)}
                                            >
                                              <Save className="w-3.5 h-3.5" />
                                              <span>{savingNote ? "Saving..." : "Save Note"}</span>
                                            </button>
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="notes-display-row">
                                          {milestone.notes ? (
                                            <div className="saved-note-bubble">
                                              <Edit3 className="w-3 h-3 text-indigo-400 mt-0.5 flex-shrink-0" />
                                              <span className="saved-note-text">{milestone.notes}</span>
                                              <button
                                                type="button"
                                                className="btn-note-edit"
                                                onClick={() => {
                                                  setEditingNotesId(milestone.id);
                                                  setNoteText(milestone.notes || "");
                                                }}
                                              >
                                                Edit
                                              </button>
                                            </div>
                                          ) : (
                                            <button
                                              type="button"
                                              className="btn-add-note"
                                              onClick={() => {
                                                setEditingNotesId(milestone.id);
                                                setNoteText("");
                                              }}
                                            >
                                              <Plus className="w-3 h-3" />
                                              <span>Add personal note / repo link</span>
                                            </button>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Section 4: Integration CTAs with CareerLens ──────────────────── */}
          <div className="roadmap-integrations-bar">
            <div className="integration-box">
              <div className="integration-icon-wrap icon-cv">
                <FileCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="integration-text">
                <strong>AI CV Improvement Studio</strong>
                <p>Add completed milestones and new projects to generate an ATS-ready CV.</p>
              </div>
              <Link to="/candidate/cv-studio" className="btn-integration">
                <span>Improve CV</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="integration-box">
              <div className="integration-icon-wrap icon-jobs">
                <Sparkles className="w-5 h-5 text-amber-500" />
              </div>
              <div className="integration-text">
                <strong>Find My Best-Fit Jobs</strong>
                <p>View real-time job match scores calculated against your updated profile.</p>
              </div>
              <Link to="/candidate/best-fit-jobs" className="btn-integration">
                <span>View Matching Jobs</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Legal / Non-Guarantee Disclaimer */}
          <div className="roadmap-disclaimer-note">
            <HelpCircle className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <span>
              Disclaimer: Completing this roadmap strengthens your verified technical capabilities and portfolio readiness, but does not guarantee employment.
            </span>
          </div>
        </div>
      )}

      {/* ── Modal: Target Career Selector ───────────────────────────────────── */}
      {isSelectModalOpen && (
        <div className="roadmap-modal-backdrop" onClick={() => setIsSelectModalOpen(false)}>
          <div
            className="roadmap-modal-dialog"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <button
              type="button"
              className="roadmap-modal-close"
              onClick={() => setIsSelectModalOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>

            <div className="modal-header">
              <div className="modal-badge">
                <Target className="w-4 h-4 text-indigo-500" />
                <span>Career Target Configuration</span>
              </div>
              <h2>Select Your Target Career</h2>
              <p className="modal-subtitle">
                Pick a target role or a live CareerLens job listing to generate or update your staged learning roadmap.
              </p>
            </div>

            <form onSubmit={handleGenerateRoadmap} className="modal-form">
              {/* Option A: Quick Role Selector */}
              <div className="form-group">
                <label className="form-label">Target Role Title</label>
                <input
                  type="text"
                  value={targetRoleInput}
                  onChange={(e) => setTargetRoleInput(e.target.value)}
                  placeholder="e.g. Backend Developer, QA Tester, Data Analyst..."
                  className="form-input"
                />
                <div className="popular-roles-row">
                  <span className="text-xs text-slate-500 font-medium">Popular:</span>
                  {(options.popular_roles || []).map((role, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className={`role-chip ${targetRoleInput.toLowerCase() === role.toLowerCase() ? "chip-active" : ""}`}
                      onClick={() => {
                        setTargetRoleInput(role);
                        setSelectedJobId("");
                      }}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>

              {/* Option B: Match with a specific job listing */}
              <div className="form-group">
                <label className="form-label">Or Target a Specific CareerLens Job Listing</label>
                <select
                  value={selectedJobId}
                  onChange={(e) => {
                    setSelectedJobId(e.target.value);
                    const matched = options.available_jobs?.find((j) => String(j.id) === e.target.value);
                    if (matched) {
                      setTargetRoleInput(matched.title);
                    }
                  }}
                  className="form-select"
                >
                  <option value="">-- Choose from available database jobs --</option>
                  {(options.available_jobs || []).map((job) => (
                    <option key={job.id} value={job.id}>
                      {job.title} at {job.company_name} ({job.location || "Cambodia"})
                    </option>
                  ))}
                </select>
              </div>

              {/* Weekly Study Commitment */}
              <div className="form-group">
                <label className="form-label">
                  Weekly Study Hours Commitment: <strong>{weeklyHoursInput} hrs/week</strong>
                </label>
                <div className="hours-slider-row">
                  <input
                    type="range"
                    min={4}
                    max={40}
                    step={2}
                    value={weeklyHoursInput}
                    onChange={(e) => setWeeklyHoursInput(Number(e.target.value))}
                    className="hours-range-slider"
                  />
                  <div className="hours-scale-labels">
                    <span>4 hrs (Casual)</span>
                    <span>10 hrs (Standard)</span>
                    <span>20 hrs (Intensive)</span>
                    <span>40 hrs (Full-time)</span>
                  </div>
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setIsSelectModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generating}
                  className="btn-modal-submit"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{generating ? "Generating..." : "Generate My Roadmap"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Sync Skill to Profile ────────────────────────────────────── */}
      {syncSkillModal.isOpen && (
        <div className="roadmap-modal-backdrop" onClick={() => setSyncSkillModal({ isOpen: false, skillName: "", proficiency: "INTERMEDIATE" })}>
          <div
            className="roadmap-modal-dialog modal-dialog-sm"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-header">
              <div className="modal-badge">
                <UserCheck className="w-4 h-4 text-emerald-500" />
                <span>Verified Candidate Profile</span>
              </div>
              <h2>Add Skill to Your Profile</h2>
              <p className="modal-subtitle">
                Add <strong>{syncSkillModal.skillName}</strong> to your official candidate profile.
              </p>
            </div>

            <div className="form-group mt-3">
              <label className="form-label">Select Demonstrated Proficiency</label>
              <select
                value={syncSkillModal.proficiency}
                onChange={(e) => setSyncSkillModal((prev) => ({ ...prev, proficiency: e.target.value }))}
                className="form-select"
              >
                <option value="BEGINNER">Beginner (Foundational)</option>
                <option value="INTERMEDIATE">Intermediate (Practical projects)</option>
                <option value="EXPERT">Expert (Advanced/Production)</option>
              </select>
            </div>

            <div className="modal-actions mt-4">
              <button
                type="button"
                className="btn-modal-cancel"
                onClick={() => setSyncSkillModal({ isOpen: false, skillName: "", proficiency: "INTERMEDIATE" })}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={syncingSkill}
                className="btn-modal-submit"
                onClick={handleConfirmSyncSkill}
              >
                <Check className="w-4 h-4" />
                <span>{syncingSkill ? "Adding..." : "Confirm & Add"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
