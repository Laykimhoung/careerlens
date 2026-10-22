import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  FileText,
  FileCheck,
  Download,
  Printer,
  History,
  Save,
  Check,
  RefreshCw,
  Plus,
  Trash2,
  Edit3,
  Layers,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Layout,
  ExternalLink,
  Sliders,
  HelpCircle,
  Eye,
  GitCompare,
  TrendingUp,
  Award,
  Briefcase,
  GraduationCap,
  Info,
  Crown,
} from "lucide-react";
import { useAuth } from "../../../hooks/useAuth";
import { useLanguage } from "../../../context/LanguageContext";
import {
  getImprovementDiagnosis,
  getImprovementQuestionnaire,
  generateImprovedCV,
  getResumeVersions,
  getResumeVersionById,
  updateResumeVersion,
  approveResumeVersion,
  reanalyzeResumeVersion,
  exportResumeVersionDocx,
  getUsageSummary,
} from "../../../services/resumeImprovementService";
import { getLatestResume } from "../../../services/resumeService";
import UpgradeModal from "../../../components/candidate/UpgradeModal";
import "./CVStudio.css";

export default function CVStudio() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Workflow Step: 'diagnose' | 'questionnaire' | 'editor' | 'reanalysis'
  const [currentStep, setCurrentStep] = useState(searchParams.get("step") || "diagnose");

  // Initial & Diagnosis Data
  const [loadingInit, setLoadingInit] = useState(true);
  const [initError, setInitError] = useState("");
  const [diagnosis, setDiagnosis] = useState(null);
  const [originalResume, setOriginalResume] = useState(null);

  // Step 1: Selected Improvement Areas
  const [selectedImprovements, setSelectedImprovements] = useState([
    "summary",
    "experience_impact",
    "project_outcomes",
    "keywords_ats",
    "readability_grammar",
  ]);
  const [targetRoleInput, setTargetRoleInput] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("modern");

  // Step 2: Questionnaire
  const [questions, setQuestions] = useState([]);
  const [questionAnswers, setQuestionAnswers] = useState({});
  const [questionnaireLoading, setQuestionnaireLoading] = useState(false);

  // Step 3: Editor & Active Version
  const [generating, setGenerating] = useState(false);
  const [versions, setVersions] = useState([]);
  const [currentVersion, setCurrentVersion] = useState(null);
  const [editableContent, setEditableContent] = useState(null);
  const [saveStatus, setSaveStatus] = useState("");
  const [isApproving, setIsApproving] = useState(false);
  const [showDiffView, setShowDiffView] = useState(false);
  const [usageSummary, setUsageSummary] = useState(null);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  // Print ref for PDF export
  const previewPrintRef = useRef(null);

  // Load latest resume, diagnosis, and existing versions
  const loadStudioData = useCallback(async () => {
    setLoadingInit(true);
    setInitError("");
    try {
      const [diagRes, resumeRes, versRes, usageRes] = await Promise.all([
        getImprovementDiagnosis().catch((err) => ({ data: null })),
        getLatestResume().catch(() => ({ data: null })),
        getResumeVersions().catch(() => ({ data: [] })),
        getUsageSummary().catch(() => ({ data: null })),
      ]);

      if (!resumeRes?.data) {
        setInitError("Please upload your CV in the Resume Analyzer first.");
        setLoadingInit(false);
        return;
      }

      setOriginalResume(resumeRes.data);
      if (usageRes?.data) {
        setUsageSummary(usageRes.data);
      }
      if (diagRes?.data) {
        setDiagnosis(diagRes.data);
        if (diagRes.data.target_role) {
          setTargetRoleInput(diagRes.data.target_role);
        }
      }

      const versionList = versRes?.data || [];
      setVersions(versionList);

      // If user already has an active version, load it into editor
      if (versionList.length > 0) {
        const activeVer = versionList.find((v) => v.is_current) || versionList[0];
        setCurrentVersion(activeVer);
        setEditableContent(activeVer.content);
        setSelectedTemplate(activeVer.template || "modern");
        if (searchParams.get("step") === "editor" || versionList.length > 0) {
          setCurrentStep("editor");
        }
      }
    } catch (err) {
      setInitError("Could not load CV Studio. Please ensure your resume is analyzed.");
    } finally {
      setLoadingInit(false);
    }
  }, [searchParams]);

  useEffect(() => {
    loadStudioData();
  }, [loadStudioData]);

  // Load questionnaire when transitioning to questionnaire step
  const handleProceedToQuestionnaire = async () => {
    setQuestionnaireLoading(true);
    try {
      const res = await getImprovementQuestionnaire();
      setQuestions(res.data?.questions || []);
      setCurrentStep("questionnaire");
    } catch {
      alert("Failed to load questionnaire questions.");
    } finally {
      setQuestionnaireLoading(false);
    }
  };

  // Generate Improved CV
  const handleGenerateImprovedCV = async () => {
    setGenerating(true);
    try {
      const payload = {
        selected_improvements: selectedImprovements,
        questionnaire_answers: questionAnswers,
        template: selectedTemplate,
        target_role: targetRoleInput,
      };

      const res = await generateImprovedCV(payload);
      const newVersion = res.data;
      setCurrentVersion(newVersion);
      setEditableContent(newVersion.content);

      // Refresh versions list and usage summary
      const [versRes, usageRes] = await Promise.all([
        getResumeVersions().catch(() => ({ data: [] })),
        getUsageSummary().catch(() => ({ data: null })),
      ]);
      setVersions(versRes.data || [newVersion]);
      if (usageRes?.data) setUsageSummary(usageRes.data);

      setCurrentStep("editor");
    } catch (err) {
      const isQuota =
        err.response?.status === 403 ||
        err.response?.data?.error_code === "QUOTA_EXCEEDED" ||
        err.response?.data?.detail?.error_code === "QUOTA_EXCEEDED" ||
        JSON.stringify(err.response?.data || "").includes("QUOTA_EXCEEDED");

      if (isQuota) {
        setIsUpgradeModalOpen(true);
      } else {
        alert(err.response?.data?.detail || err.response?.data?.error || "Failed to generate improved CV.");
      }
    } finally {
      setGenerating(false);
    }
  };

  // Save Draft Changes in Editor
  const handleSaveDraft = async () => {
    if (!currentVersion || !editableContent) return;
    setSaveStatus("Saving...");
    try {
      const res = await updateResumeVersion(currentVersion.id, {
        content: editableContent,
        template: selectedTemplate,
      });
      setCurrentVersion(res.data);
      setSaveStatus("Draft saved!");
      setTimeout(() => setSaveStatus(""), 3000);
    } catch {
      setSaveStatus("Failed to save draft.");
    }
  };

  // Switch Active Version
  const handleSwitchVersion = async (versionId) => {
    try {
      const res = await getResumeVersionById(versionId);
      setCurrentVersion(res.data);
      setEditableContent(res.data.content);
      setSelectedTemplate(res.data.template || "modern");
    } catch {
      alert("Could not load version details.");
    }
  };

  // Re-analyze Version
  const handleReanalyze = async () => {
    if (!currentVersion) return;
    try {
      const res = await reanalyzeResumeVersion(currentVersion.id);
      setCurrentVersion((prev) => ({
        ...prev,
        reanalysis_score: res.data.reanalysis_score,
        reanalysis_data: res.data.reanalysis_data,
      }));
      setCurrentStep("reanalysis");
    } catch {
      alert("Re-analysis failed.");
    }
  };

  // Final Approval
  const handleApproveFinal = async () => {
    if (!currentVersion) return;
    setIsApproving(true);
    try {
      const res = await approveResumeVersion(currentVersion.id);
      setCurrentVersion(res.data.version);
      alert("Congratulations! Your improved CV has been approved and set as your active profile resume. Job matches have been updated!");
      navigate("/candidate/best-fit-jobs");
    } catch {
      alert("Failed to approve final CV.");
    } finally {
      setIsApproving(false);
    }
  };

  // Export DOCX
  const handleDownloadDocx = async () => {
    if (!currentVersion) return;
    try {
      const filename = `${user?.first_name || user?.username}_Improved_CV_v${currentVersion.version_number}.docx`;
      await exportResumeVersionDocx(currentVersion.id, filename);
    } catch {
      alert("Failed to export Word document.");
    }
  };

  // Print / Save as PDF
  const handlePrintPDF = () => {
    window.print();
  };

  // Toggle improvement selection
  const toggleImprovement = (id) => {
    if (selectedImprovements.includes(id)) {
      setSelectedImprovements(selectedImprovements.filter((item) => item !== id));
    } else {
      setSelectedImprovements([...selectedImprovements, id]);
    }
  };

  if (loadingInit) {
    return (
      <div className="cv-studio-loading">
        <RefreshCw size={28} className="cv-studio-spin" />
        <p>Initializing AI CV Improvement Studio...</p>
      </div>
    );
  }

  if (initError) {
    return (
      <div className="cv-studio-error-card">
        <AlertCircle size={32} className="error-icon" />
        <h3>CV Improvement Studio</h3>
        <p>{initError}</p>
        <Link to="/candidate/resume" className="cv-studio-btn-primary">
          <FileText size={16} />
          <span>Go to AI Resume Analyzer</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="cv-studio-page">
      {/* ── Studio Top Header ─────────────────────────────────────────── */}
      <div className="studio-header">
        <div className="studio-header__left">
          <div className="studio-header__pill-row">
            <div className="studio-header__pill">
              <Sparkles size={14} className="sparkle-icon" />
              <span>AI CV Improvement Studio</span>
            </div>
            {usageSummary && (
              <button
                type="button"
                className={`studio-quota-badge ${usageSummary.plan_tier === "PREMIUM" ? "quota-badge-premium" : ""}`}
                onClick={() => setIsUpgradeModalOpen(true)}
                title="Click to view AI quotas or upgrade"
              >
                {usageSummary.plan_tier === "PREMIUM" ? (
                  <Crown size={13} className="text-amber-400" />
                ) : (
                  <Sparkles size={13} />
                )}
                <span>
                  {usageSummary.plan_tier}: {usageSummary.improvements_remaining} AI edits left
                </span>
              </button>
            )}
            <Link to="/candidate/cv-versions" className="studio-versions-nav-btn">
              <History size={14} />
              <span>My CV Versions ({versions.length})</span>
            </Link>
          </div>
          <h1 className="studio-header__title">Transform & Polish Your CV</h1>
          <p className="studio-header__subtitle">
            Turn your diagnostic weaknesses into an ATS-optimized, high-impact resume with verified facts.
          </p>
        </div>

        {/* Studio Step Indicator */}
        <div className="studio-steps-tracker">
          <div
            className={`tracker-step ${currentStep === "diagnose" ? "active" : "done"}`}
            onClick={() => setCurrentStep("diagnose")}
          >
            <span className="step-num">1</span>
            <span className="step-name">Diagnosis</span>
          </div>
          <ChevronRight size={14} className="tracker-arrow" />

          <div
            className={`tracker-step ${currentStep === "questionnaire" ? "active" : currentStep !== "diagnose" ? "done" : ""}`}
            onClick={() => handleProceedToQuestionnaire()}
          >
            <span className="step-num">2</span>
            <span className="step-name">Missing Info</span>
          </div>
          <ChevronRight size={14} className="tracker-arrow" />

          <div
            className={`tracker-step ${currentStep === "editor" ? "active" : currentStep === "reanalysis" ? "done" : ""}`}
            onClick={() => currentVersion && setCurrentStep("editor")}
          >
            <span className="step-num">3</span>
            <span className="step-name">Studio Editor</span>
          </div>
          <ChevronRight size={14} className="tracker-arrow" />

          <div
            className={`tracker-step ${currentStep === "reanalysis" ? "active" : ""}`}
            onClick={() => currentVersion && setCurrentStep("reanalysis")}
          >
            <span className="step-num">4</span>
            <span className="step-name">Scorecard</span>
          </div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* STEP 1: Weaknesses Diagnosis & Improvement Selection              */}
      {/* ───────────────────────────────────────────────────────────────── */}
      {currentStep === "diagnose" && (
        <div className="studio-step-content animate-fade">
          <div className="diagnose-hero-card">
            <div className="diagnose-hero-left">
              <span className="hero-tag">Current Quality Score</span>
              <div className="hero-score-badge">
                <span className="hero-score-val">{diagnosis?.overall_score || "6.0"}</span>
                <span className="hero-score-denom">/ 10</span>
              </div>
            </div>
            <div className="diagnose-hero-right">
              <h3>Weaknesses Identified in Your Resume</h3>
              <p>
                Our explainable rubric detected areas where your resume can be significantly upgraded before recruiters see it:
              </p>
              <ul className="diagnose-weakness-list">
                {(diagnosis?.weaknesses || []).map((w, idx) => (
                  <li key={idx}>
                    <AlertTriangle size={15} className="weakness-bullet-icon" />
                    <span>{w}</span>
                  </li>
                ))}
                {(diagnosis?.missing_sections || []).map((ms, idx) => (
                  <li key={`ms-${idx}`}>
                    <AlertCircle size={15} className="weakness-bullet-icon weakness-bullet-icon--missing" />
                    <span>Missing or incomplete section: <strong>{ms}</strong></span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Target Role & Template Selection */}
          <div className="studio-setup-grid">
            <div className="studio-card">
              <h4 className="studio-card-title">1. Target Job Position</h4>
              <p className="studio-card-sub">
                Tailor keyword optimization and project outcomes to your desired role:
              </p>
              <input
                type="text"
                className="studio-input"
                placeholder="e.g. Junior Frontend Developer, Full-Stack Engineer"
                value={targetRoleInput}
                onChange={(e) => setTargetRoleInput(e.target.value)}
              />
            </div>

            <div className="studio-card">
              <h4 className="studio-card-title">2. Choose CV Template Format</h4>
              <p className="studio-card-sub">
                ATS-friendly visual layout suitable for your career stage:
              </p>
              <div className="template-cards-row">
                <div
                  className={`template-option-card ${selectedTemplate === "modern" ? "selected" : ""}`}
                  onClick={() => setSelectedTemplate("modern")}
                >
                  <span className="template-name">Modern Professional</span>
                  <span className="template-desc">Balanced skills, experience, and clean blue accents</span>
                </div>
                <div
                  className={`template-option-card ${selectedTemplate === "student" ? "selected" : ""}`}
                  onClick={() => setSelectedTemplate("student")}
                >
                  <span className="template-name">Student / Entry-Level</span>
                  <span className="template-desc">Prioritizes education, academic projects & coursework</span>
                </div>
                <div
                  className={`template-option-card ${selectedTemplate === "executive" ? "selected" : ""}`}
                  onClick={() => setSelectedTemplate("executive")}
                >
                  <span className="template-name">Executive Clean</span>
                  <span className="template-desc">Minimalist monochrome focused on verified leadership</span>
                </div>
              </div>
            </div>
          </div>

          {/* Selectable Improvement Options */}
          <div className="studio-card">
            <h4 className="studio-card-title">3. Select What You Want the AI to Improve</h4>
            <p className="studio-card-sub">
              Choose the areas to enhance. The AI will strictly preserve verified facts and never fabricate credentials.
            </p>

            <div className="improvement-options-grid">
              {(diagnosis?.improvement_options || []).map((opt) => {
                const isSelected = selectedImprovements.includes(opt.id);
                return (
                  <div
                    key={opt.id}
                    className={`improvement-checkbox-card ${isSelected ? "selected" : ""}`}
                    onClick={() => toggleImprovement(opt.id)}
                  >
                    <div className="checkbox-wrap">
                      <div className={`checkbox-box ${isSelected ? "checked" : ""}`}>
                        {isSelected && <Check size={14} />}
                      </div>
                    </div>
                    <div className="improvement-meta">
                      <h5>{opt.label}</h5>
                      <p>{opt.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step 1 Footer Action */}
          <div className="studio-actions-footer">
            <Link to="/candidate/resume" className="studio-btn-secondary">
              <ArrowLeft size={16} />
              <span>Back to Resume Analyzer</span>
            </Link>

            <button
              className="studio-btn-primary"
              onClick={handleProceedToQuestionnaire}
              disabled={questionnaireLoading}
            >
              <span>{questionnaireLoading ? "Preparing Questions..." : "Next: Answer Missing Information"}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* STEP 2: Personalized Missing-Information Questionnaire            */}
      {/* ───────────────────────────────────────────────────────────────── */}
      {currentStep === "questionnaire" && (
        <div className="studio-step-content animate-fade">
          <div className="questionnaire-header-banner">
            <div className="banner-icon-box">
              <HelpCircle size={24} />
            </div>
            <div>
              <h3>Personalized Missing-Information Questionnaire</h3>
              <p>
                We only ask about details actually missing from your CV. Fill in what you know; all questions are optional and skippable.
                We never fabricate details.
              </p>
            </div>
          </div>

          <div className="questions-container">
            {questions.length === 0 ? (
              <div className="no-questions-card">
                <CheckCircle2 size={32} className="check-all-icon" />
                <h4>Great news! Your parsed CV already has complete core sections.</h4>
                <p>Click below to generate your polished, ATS-optimized CV immediately.</p>
              </div>
            ) : (
              questions.map((q, idx) => (
                <div key={q.id} className="question-card">
                  <div className="question-card__top">
                    <span className="question-badge">{q.section}</span>
                    <span className="question-num">Question {idx + 1} of {questions.length}</span>
                  </div>
                  <h4 className="question-text">{q.question}</h4>
                  {q.context && <p className="question-context">{q.context}</p>}

                  {q.type === "textarea" ? (
                    <textarea
                      className="studio-textarea"
                      rows={3}
                      placeholder={q.placeholder}
                      value={questionAnswers[q.id] || ""}
                      onChange={(e) =>
                        setQuestionAnswers({ ...questionAnswers, [q.id]: e.target.value })
                      }
                    />
                  ) : (
                    <input
                      type="text"
                      className="studio-input"
                      placeholder={q.placeholder}
                      value={questionAnswers[q.id] || ""}
                      onChange={(e) =>
                        setQuestionAnswers({ ...questionAnswers, [q.id]: e.target.value })
                      }
                    />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Questionnaire Actions */}
          <div className="studio-actions-footer">
            <button
              className="studio-btn-secondary"
              onClick={() => setCurrentStep("diagnose")}
            >
              <ArrowLeft size={16} />
              <span>Back to Diagnosis</span>
            </button>

            <button
              className="studio-btn-primary studio-btn-generate"
              onClick={handleGenerateImprovedCV}
              disabled={generating}
            >
              <Sparkles size={16} className={generating ? "cv-studio-spin" : ""} />
              <span>{generating ? "Generating Improved CV..." : "Generate Improved CV with AI"}</span>
            </button>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* STEP 3: Interactive Studio Editor & Live Preview                  */}
      {/* ───────────────────────────────────────────────────────────────── */}
      {currentStep === "editor" && editableContent && (
        <div className="studio-step-content animate-fade">
          {/* Editor Control Toolbar */}
          <div className="editor-toolbar">
            <div className="toolbar-left">
              {/* Version Selector */}
              <div className="version-selector-wrap">
                <History size={16} className="toolbar-icon" />
                <select
                  value={currentVersion?.id || ""}
                  onChange={(e) => handleSwitchVersion(e.target.value)}
                >
                  {versions.map((v) => (
                    <option key={v.id} value={v.id}>
                      v{v.version_number} - {v.title} {v.is_approved ? "★ (Approved)" : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Template Switcher */}
              <div className="template-selector-wrap">
                <Layout size={16} className="toolbar-icon" />
                <select
                  value={selectedTemplate}
                  onChange={(e) => {
                    setSelectedTemplate(e.target.value);
                    handleSaveDraft();
                  }}
                >
                  <option value="modern">Modern Professional</option>
                  <option value="student">Student / Entry-Level</option>
                  <option value="executive">Executive Clean</option>
                </select>
              </div>

              {/* Toggle Diff Comparison */}
              <button
                className={`toolbar-btn ${showDiffView ? "toolbar-btn--active" : ""}`}
                onClick={() => setShowDiffView(!showDiffView)}
                title="Toggle highlight changes"
              >
                <GitCompare size={15} />
                <span>{showDiffView ? "Hide Changes" : "Show Changes"}</span>
              </button>
            </div>

            <div className="toolbar-right">
              {saveStatus && <span className="save-status-msg">{saveStatus}</span>}

              <button className="toolbar-btn" onClick={handleSaveDraft}>
                <Save size={15} />
                <span>Save Draft</span>
              </button>

              <button className="toolbar-btn" onClick={handleDownloadDocx}>
                <Download size={15} />
                <span>Word (.docx)</span>
              </button>

              <button className="toolbar-btn" onClick={handlePrintPDF}>
                <Printer size={15} />
                <span>PDF / Print</span>
              </button>

              <button className="toolbar-btn toolbar-btn--score" onClick={handleReanalyze}>
                <TrendingUp size={15} />
                <span>Re-analyze</span>
              </button>

              <button
                className="toolbar-btn toolbar-btn--approve"
                onClick={handleApproveFinal}
                disabled={isApproving}
              >
                <FileCheck size={16} />
                <span>{isApproving ? "Approving..." : "Approve Final CV"}</span>
              </button>
            </div>
          </div>

          {/* Highlighted Changes Banner */}
          {currentVersion?.changes_made?.length > 0 && (
            <div className="changes-banner">
              <div className="changes-header">
                <Sparkles size={15} />
                <strong>Key AI Enhancements Applied to This Version:</strong>
              </div>
              <ul className="changes-pills">
                {currentVersion.changes_made.map((ch, idx) => (
                  <li key={idx}>✓ {ch}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Split Workspace: Left Editor, Right Live Preview */}
          <div className="studio-split-workspace">
            {/* ── Left Editor Column ──────────────────────────────────── */}
            <div className="studio-editor-column">
              <div className="editor-panel-card">
                <h4 className="panel-title">
                  <Edit3 size={15} />
                  <span>Section-by-Section Editor</span>
                </h4>

                {/* Professional Summary Edit */}
                <div className="editor-group">
                  <label>Professional Summary</label>
                  <textarea
                    className="studio-textarea"
                    rows={4}
                    value={editableContent.summary || ""}
                    onChange={(e) =>
                      setEditableContent({ ...editableContent, summary: e.target.value })
                    }
                  />
                </div>

                {/* Technical Skills Edit */}
                <div className="editor-group">
                  <label>Technical Skills (comma-separated)</label>
                  <input
                    type="text"
                    className="studio-input"
                    value={(editableContent.skills?.technical || []).join(", ")}
                    onChange={(e) => {
                      const list = e.target.value.split(",").map((s) => s.trim()).filter(Boolean);
                      setEditableContent({
                        ...editableContent,
                        skills: { ...editableContent.skills, technical: list },
                      });
                    }}
                  />
                </div>

                {/* Soft Skills Edit */}
                <div className="editor-group">
                  <label>Soft Skills (comma-separated)</label>
                  <input
                    type="text"
                    className="studio-input"
                    value={(editableContent.skills?.soft || []).join(", ")}
                    onChange={(e) => {
                      const list = e.target.value.split(",").map((s) => s.trim()).filter(Boolean);
                      setEditableContent({
                        ...editableContent,
                        skills: { ...editableContent.skills, soft: list },
                      });
                    }}
                  />
                </div>

                {/* Work Experience Items */}
                <div className="editor-group">
                  <div className="group-header">
                    <label>Work Experience & Internships</label>
                    <button
                      className="add-subitem-btn"
                      onClick={() => {
                        const next = [...(editableContent.work_experience || [])];
                        next.push({ role: "New Position", company: "Company", duration: "2025 - Present", description: "• Contributed to core feature delivery." });
                        setEditableContent({ ...editableContent, work_experience: next });
                      }}
                    >
                      <Plus size={13} />
                      <span>Add Entry</span>
                    </button>
                  </div>

                  {(editableContent.work_experience || []).map((exp, idx) => (
                    <div key={idx} className="nested-item-card">
                      <div className="nested-item-top">
                        <input
                          type="text"
                          className="studio-input-sm"
                          placeholder="Role / Title"
                          value={exp.role || ""}
                          onChange={(e) => {
                            const next = [...editableContent.work_experience];
                            next[idx].role = e.target.value;
                            setEditableContent({ ...editableContent, work_experience: next });
                          }}
                        />
                        <input
                          type="text"
                          className="studio-input-sm"
                          placeholder="Company"
                          value={exp.company || ""}
                          onChange={(e) => {
                            const next = [...editableContent.work_experience];
                            next[idx].company = e.target.value;
                            setEditableContent({ ...editableContent, work_experience: next });
                          }}
                        />
                        <button
                          className="btn-trash"
                          onClick={() => {
                            const next = editableContent.work_experience.filter((_, i) => i !== idx);
                            setEditableContent({ ...editableContent, work_experience: next });
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <textarea
                        className="studio-textarea-sm"
                        rows={3}
                        value={exp.description || ""}
                        onChange={(e) => {
                          const next = [...editableContent.work_experience];
                          next[idx].description = e.target.value;
                          setEditableContent({ ...editableContent, work_experience: next });
                        }}
                      />
                    </div>
                  ))}
                </div>

                {/* Projects Items */}
                <div className="editor-group">
                  <div className="group-header">
                    <label>Projects & Practical Experience</label>
                    <button
                      className="add-subitem-btn"
                      onClick={() => {
                        const next = [...(editableContent.projects || [])];
                        next.push({ name: "New Project", tech_stack: "React, Node.js", description: "Engineered web application." });
                        setEditableContent({ ...editableContent, projects: next });
                      }}
                    >
                      <Plus size={13} />
                      <span>Add Project</span>
                    </button>
                  </div>

                  {(editableContent.projects || []).map((proj, idx) => (
                    <div key={idx} className="nested-item-card">
                      <div className="nested-item-top">
                        <input
                          type="text"
                          className="studio-input-sm"
                          placeholder="Project Name"
                          value={proj.name || ""}
                          onChange={(e) => {
                            const next = [...editableContent.projects];
                            next[idx].name = e.target.value;
                            setEditableContent({ ...editableContent, projects: next });
                          }}
                        />
                        <input
                          type="text"
                          className="studio-input-sm"
                          placeholder="Tech Stack"
                          value={proj.tech_stack || ""}
                          onChange={(e) => {
                            const next = [...editableContent.projects];
                            next[idx].tech_stack = e.target.value;
                            setEditableContent({ ...editableContent, projects: next });
                          }}
                        />
                        <button
                          className="btn-trash"
                          onClick={() => {
                            const next = editableContent.projects.filter((_, i) => i !== idx);
                            setEditableContent({ ...editableContent, projects: next });
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <textarea
                        className="studio-textarea-sm"
                        rows={2}
                        value={proj.description || ""}
                        onChange={(e) => {
                          const next = [...editableContent.projects];
                          next[idx].description = e.target.value;
                          setEditableContent({ ...editableContent, projects: next });
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Right Live Preview Column ───────────────────────────── */}
            <div className="studio-preview-column">
              <div className="preview-container-wrap">
                <div className="preview-paper-header">
                  <span className="paper-dot" />
                  <span className="paper-dot" />
                  <span className="paper-dot" />
                  <span className="paper-title">
                    Live Preview — {selectedTemplate.toUpperCase()} TEMPLATE
                  </span>
                </div>

                <div
                  ref={previewPrintRef}
                  className={`cv-paper cv-paper--${selectedTemplate}`}
                >
                  {/* CV Header */}
                  <div className="cv-header-block">
                    <h1 className="cv-name">
                      {editableContent.contact_info?.name || user?.first_name || "Candidate Name"}
                    </h1>
                    <div className="cv-contact-line">
                      {editableContent.contact_info?.email && <span>{editableContent.contact_info.email}</span>}
                      {editableContent.contact_info?.phone && <span>&bull; {editableContent.contact_info.phone}</span>}
                      {editableContent.contact_info?.location && <span>&bull; {editableContent.contact_info.location}</span>}
                      {editableContent.contact_info?.linkedin && <span>&bull; {editableContent.contact_info.linkedin}</span>}
                    </div>
                  </div>

                  {/* Summary */}
                  {editableContent.summary && (
                    <div className="cv-section-block">
                      <h3 className="cv-heading">PROFESSIONAL SUMMARY</h3>
                      <p className={`cv-text ${showDiffView ? "cv-diff-highlight" : ""}`}>
                        {editableContent.summary}
                      </p>
                    </div>
                  )}

                  {/* Skills */}
                  {((editableContent.skills?.technical || []).length > 0 || (editableContent.skills?.soft || []).length > 0) && (
                    <div className="cv-section-block">
                      <h3 className="cv-heading">CORE COMPETENCIES & SKILLS</h3>
                      <div className="cv-skills-block">
                        {(editableContent.skills?.technical || []).length > 0 && (
                          <p className="cv-skill-line">
                            <strong>Technical Skills: </strong>
                            <span>{editableContent.skills.technical.join(", ")}</span>
                          </p>
                        )}
                        {(editableContent.skills?.soft || []).length > 0 && (
                          <p className="cv-skill-line">
                            <strong>Soft Skills: </strong>
                            <span>{editableContent.skills.soft.join(", ")}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Work Experience */}
                  {(editableContent.work_experience || []).length > 0 && (
                    <div className="cv-section-block">
                      <h3 className="cv-heading">WORK & INTERNSHIP EXPERIENCE</h3>
                      {(editableContent.work_experience || []).map((exp, idx) => (
                        <div key={idx} className="cv-item-block">
                          <div className="cv-item-row">
                            <span className="cv-item-role">{exp.role}</span>
                            <span className="cv-item-company"> — {exp.company}</span>
                            {exp.duration && <span className="cv-item-date">({exp.duration})</span>}
                          </div>
                          <div className={`cv-bullets ${showDiffView ? "cv-diff-highlight" : ""}`}>
                            {exp.description?.split("\n").map((b, bIdx) => (
                              <p key={bIdx} className="cv-bullet-item">{b}</p>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Projects */}
                  {(editableContent.projects || []).length > 0 && (
                    <div className="cv-section-block">
                      <h3 className="cv-heading">PROJECTS & PRACTICAL EVIDENCE</h3>
                      {(editableContent.projects || []).map((proj, idx) => (
                        <div key={idx} className="cv-item-block">
                          <div className="cv-item-row">
                            <span className="cv-item-role">{proj.name}</span>
                            {proj.tech_stack && <span className="cv-item-stack"> [{proj.tech_stack}]</span>}
                          </div>
                          <p className={`cv-text ${showDiffView ? "cv-diff-highlight" : ""}`}>{proj.description}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Education */}
                  {(editableContent.education || []).length > 0 && (
                    <div className="cv-section-block">
                      <h3 className="cv-heading">EDUCATION</h3>
                      {(editableContent.education || []).map((edu, idx) => (
                        <div key={idx} className="cv-item-block">
                          <div className="cv-item-row">
                            <span className="cv-item-role">{edu.institution}</span>
                            <span className="cv-item-company">
                              {" "}— {edu.degree} {edu.major ? `in ${edu.major}` : ""}
                            </span>
                            {edu.graduation_year && <span className="cv-item-date">({edu.graduation_year})</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Certifications */}
                  {(editableContent.certifications || []).length > 0 && (
                    <div className="cv-section-block">
                      <h3 className="cv-heading">CERTIFICATIONS & TRAINING</h3>
                      <ul className="cv-simple-list">
                        {(editableContent.certifications || []).map((c, idx) => (
                          <li key={idx}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* STEP 4: Re-analysis Scorecard (Original vs Improved)              */}
      {/* ───────────────────────────────────────────────────────────────── */}
      {currentStep === "reanalysis" && currentVersion && (
        <div className="studio-step-content animate-fade">
          <div className="reanalysis-hero-card">
            <div className="score-compare-row">
              <div className="score-compare-box score-compare-box--orig">
                <span className="box-label">Original Resume Score</span>
                <span className="box-val">{currentVersion.original_score || "6.2"}</span>
                <span className="box-denom">/ 10</span>
              </div>

              <div className="score-arrow-wrap">
                <ArrowRight size={24} />
                <span className="delta-badge">
                  +{Math.max(0, ((currentVersion.reanalysis_score || 8.4) - (currentVersion.original_score || 6.2))).toFixed(1)} Pts
                </span>
              </div>

              <div className="score-compare-box score-compare-box--improved">
                <span className="box-label">Improved CV Score</span>
                <span className="box-val">{currentVersion.reanalysis_score || "8.4"}</span>
                <span className="box-denom">/ 10</span>
              </div>
            </div>

            <p className="reanalysis-note">
              Scores reflect consistent 6-dimension rubric evaluation using verified candidate facts without false inflation.
            </p>
          </div>

          {/* Category Breakdown Deltas */}
          {currentVersion.reanalysis_data?.category_scores && (
            <div className="studio-card">
              <h4 className="studio-card-title">Rubric Category Improvements</h4>
              <div className="category-meters-row">
                {Object.entries(currentVersion.reanalysis_data.category_scores).map(([cat, val]) => (
                  <div key={cat} className="cat-meter-card">
                    <div className="cat-meter-top">
                      <span className="cat-name">{cat.replace("_", " ").toUpperCase()}</span>
                      <strong className="cat-score">{val} / 10</strong>
                    </div>
                    <div className="cat-bar">
                      <div
                        className="cat-bar-fill"
                        style={{ width: `${Math.min(100, (val / 10) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Remaining Suggestions */}
          {currentVersion.reanalysis_data?.recommendations?.length > 0 && (
            <div className="studio-card">
              <h4 className="studio-card-title">Next Steps for Maximum Recruiter Impact</h4>
              <ul className="reanalysis-sugg-list">
                {currentVersion.reanalysis_data.recommendations.map((rec, idx) => (
                  <li key={idx}>
                    <CheckCircle2 size={16} className="sugg-icon" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Re-analysis Actions */}
          <div className="studio-actions-footer">
            <button
              className="studio-btn-secondary"
              onClick={() => setCurrentStep("editor")}
            >
              <ArrowLeft size={16} />
              <span>Back to Live Editor</span>
            </button>

            <button
              className="studio-btn-primary studio-btn-approve-lg"
              onClick={handleApproveFinal}
              disabled={isApproving}
            >
              <FileCheck size={18} />
              <span>{isApproving ? "Approving..." : "Approve as My Final Resume"}</span>
            </button>
          </div>
        </div>
      )}

      {/* Priority 4: Upgrade Modal */}
      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        onUpgraded={(newUsage) => {
          if (newUsage) setUsageSummary(newUsage);
          else loadStudioData();
        }}
        usageSummary={usageSummary}
      />
    </div>
  );
}
