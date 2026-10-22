import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Edit3,
  Trash2,
  Download,
  Plus,
  X,
  Briefcase,
  GraduationCap,
  Award,
  Languages,
  Code2,
  FolderGit2,
  User,
  Search,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  RefreshCw,
  Info
} from "lucide-react";
import { useAuth } from "../../../hooks/useAuth";
import { useLanguage } from "../../../context/LanguageContext";
import Button from "../../../components/common/Button";
import {
  uploadResume,
  getLatestResume,
  updateResumeParsedData,
  analyzeResume,
  deleteResume
} from "../../../services/resumeService";
import "./Resume.css";

export default function CandidateResume() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Flow State: 'upload' | 'review' | 'analysis'
  const [activeStep, setActiveStep] = useState("upload");

  // Resume Document Data
  const [resumeData, setResumeData] = useState(null);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Upload state
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStepText, setUploadStepText] = useState("");
  const [uploadError, setUploadError] = useState("");

  // Target Role
  const [targetRole, setTargetRole] = useState("");

  // Review & Edit State
  const [parsedForm, setParsedForm] = useState({
    contact_info: { name: "", email: "", phone: "", location: "", linkedin: "", website: "" },
    summary: "",
    skills: { technical: [], soft: [] },
    work_experience: [],
    education: [],
    projects: [],
    certifications: [],
    languages: [],
  });
  const [newTechSkill, setNewTechSkill] = useState("");
  const [newSoftSkill, setNewSoftSkill] = useState("");
  const [savingEdits, setSavingEdits] = useState(false);
  const [editSuccessMsg, setEditSuccessMsg] = useState("");

  // Analysis State
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState("");

  // Modal State for "Improve My CV with AI"
  const [showImproveModal, setShowImproveModal] = useState(false);

  // Load existing active resume on mount
  const loadLatestResume = useCallback(async () => {
    setLoadingInitial(true);
    setUploadError("");
    try {
      const res = await getLatestResume();
      if (res.data) {
        setResumeData(res.data);
        if (res.data.target_role) {
          setTargetRole(res.data.target_role);
        }
        if (res.data.parsed_data) {
          setParsedForm(res.data.parsed_data);
        }
        if (res.data.analysis) {
          setActiveStep("analysis");
        } else if (res.data.parsed_data) {
          setActiveStep("review");
        }
      }
    } catch {
      // 404 is normal for candidates without an uploaded CV yet
    } finally {
      setLoadingInitial(false);
    }
  }, []);

  useEffect(() => {
    loadLatestResume();
  }, [loadLatestResume]);

  // ─────────────────────────────────────────────────────────────────────────
  // Upload Handlers
  // ─────────────────────────────────────────────────────────────────────────

  const handleFileSelection = async (file) => {
    if (!file) return;

    // Validate size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("The file is too large. Please upload a CV under 10MB.");
      return;
    }

    // Validate type (.pdf, .docx)
    const ext = file.name.split(".").pop().toLowerCase();
    if (!["pdf", "docx"].includes(ext)) {
      setUploadError("Unsupported format. Please upload your CV as a PDF (.pdf) or Word document (.docx).");
      return;
    }

    setUploadError("");
    setUploading(true);
    setUploadProgress(15);
    setUploadStepText("Uploading document...");

    try {
      const res = await uploadResume(file, targetRole, (progressEvent) => {
        if (progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 50) / progressEvent.total);
          setUploadProgress(Math.min(50, Math.max(15, percent)));
        }
      });

      setUploadProgress(75);
      setUploadStepText("Extracting text and organizing sections...");

      setTimeout(() => {
        setUploadProgress(100);
        setResumeData(res.data);
        if (res.data.parsed_data) {
          setParsedForm(res.data.parsed_data);
        }
        setUploading(false);
        setActiveStep("review");
      }, 500);
    } catch (err) {
      setUploading(false);
      setUploadProgress(0);
      const errMsg =
        err.response?.data?.file?.[0] ||
        err.response?.data?.detail ||
        err.message ||
        "Failed to upload and extract CV. Please ensure the document is not corrupted.";
      setUploadError(errMsg);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const onDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelection(files[0]);
    }
  };

  const handleDeleteResume = async () => {
    if (!resumeData?.id) return;
    if (!window.confirm("Are you sure you want to remove your uploaded CV and analysis?")) return;
    try {
      await deleteResume(resumeData.id);
      setResumeData(null);
      setParsedForm({
        contact_info: { name: "", email: "", phone: "", location: "", linkedin: "", website: "" },
        summary: "",
        skills: { technical: [], soft: [] },
        work_experience: [],
        education: [],
        projects: [],
        certifications: [],
        languages: [],
      });
      setActiveStep("upload");
    } catch (err) {
      setUploadError(err.response?.data?.detail || "Failed to delete CV.");
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Review & Edit Handlers
  // ─────────────────────────────────────────────────────────────────────────

  const handleAddTechSkill = (e) => {
    e.preventDefault();
    const val = newTechSkill.trim();
    if (!val) return;
    const current = parsedForm.skills?.technical || [];
    if (!current.some((s) => s.toLowerCase() === val.toLowerCase())) {
      setParsedForm({
        ...parsedForm,
        skills: {
          ...parsedForm.skills,
          technical: [...current, val],
        },
      });
    }
    setNewTechSkill("");
  };

  const handleRemoveTechSkill = (skillToRemove) => {
    setParsedForm({
      ...parsedForm,
      skills: {
        ...parsedForm.skills,
        technical: (parsedForm.skills?.technical || []).filter((s) => s !== skillToRemove),
      },
    });
  };

  const handleAddSoftSkill = (e) => {
    e.preventDefault();
    const val = newSoftSkill.trim();
    if (!val) return;
    const current = parsedForm.skills?.soft || [];
    if (!current.some((s) => s.toLowerCase() === val.toLowerCase())) {
      setParsedForm({
        ...parsedForm,
        skills: {
          ...parsedForm.skills,
          soft: [...current, val],
        },
      });
    }
    setNewSoftSkill("");
  };

  const handleRemoveSoftSkill = (skillToRemove) => {
    setParsedForm({
      ...parsedForm,
      skills: {
        ...parsedForm.skills,
        soft: (parsedForm.skills?.soft || []).filter((s) => s !== skillToRemove),
      },
    });
  };

  // Work experience list helpers
  const handleAddExperience = () => {
    setParsedForm({
      ...parsedForm,
      work_experience: [
        ...(parsedForm.work_experience || []),
        {
          title: "",
          company: "",
          location: "",
          start_date: "",
          end_date: "",
          current: false,
          description: "",
          bullet_points: [""],
        },
      ],
    });
  };

  const handleRemoveExperience = (idx) => {
    setParsedForm({
      ...parsedForm,
      work_experience: (parsedForm.work_experience || []).filter((_, i) => i !== idx),
    });
  };

  // Education list helpers
  const handleAddEducation = () => {
    setParsedForm({
      ...parsedForm,
      education: [
        ...(parsedForm.education || []),
        {
          institution: "",
          degree: "",
          major: "",
          graduation_year: "",
          gpa: "",
          details: "",
        },
      ],
    });
  };

  const handleRemoveEducation = (idx) => {
    setParsedForm({
      ...parsedForm,
      education: (parsedForm.education || []).filter((_, i) => i !== idx),
    });
  };

  // Project helpers
  const handleAddProject = () => {
    setParsedForm({
      ...parsedForm,
      projects: [
        ...(parsedForm.projects || []),
        { title: "", description: "", technologies: [], link: "" },
      ],
    });
  };

  const handleRemoveProject = (idx) => {
    setParsedForm({
      ...parsedForm,
      projects: (parsedForm.projects || []).filter((_, i) => i !== idx),
    });
  };

  // Certifications helpers
  const handleAddCertification = () => {
    setParsedForm({
      ...parsedForm,
      certifications: [
        ...(parsedForm.certifications || []),
        { name: "", issuer: "", date: "", url: "" },
      ],
    });
  };

  const handleRemoveCertification = (idx) => {
    setParsedForm({
      ...parsedForm,
      certifications: (parsedForm.certifications || []).filter((_, i) => i !== idx),
    });
  };

  // Language helpers
  const handleAddLanguage = () => {
    setParsedForm({
      ...parsedForm,
      languages: [
        ...(parsedForm.languages || []),
        { language: "", proficiency: "Conversational" },
      ],
    });
  };

  const handleRemoveLanguage = (idx) => {
    setParsedForm({
      ...parsedForm,
      languages: (parsedForm.languages || []).filter((_, i) => i !== idx),
    });
  };

  const handleSaveParsedEdits = async () => {
    if (!resumeData?.id) return;
    setSavingEdits(true);
    setEditSuccessMsg("");
    try {
      const res = await updateResumeParsedData(resumeData.id, parsedForm, targetRole);
      setResumeData(res.data);
      setEditSuccessMsg("Changes saved successfully to your candidate profile!");
      setTimeout(() => setEditSuccessMsg(""), 4000);
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to save edits.");
    } finally {
      setSavingEdits(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Quality Scoring Analysis Handler
  // ─────────────────────────────────────────────────────────────────────────

  const handleRunAnalysis = async () => {
    if (!resumeData?.id) return;
    setAnalyzing(true);
    setAnalysisError("");
    try {
      // First save current edited data to ensure the analysis evaluates candidate's latest edits
      await updateResumeParsedData(resumeData.id, parsedForm, targetRole);
      const res = await analyzeResume(resumeData.id, targetRole);
      setResumeData(res.data);
      setActiveStep("analysis");
    } catch (err) {
      setAnalysisError(err.response?.data?.detail || "Analysis service encountered an error. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  // Find Best-Fit Jobs navigation helper
  const handleFindBestFitJobs = () => {
    const techSkills = parsedForm.skills?.technical || [];
    const searchParam = targetRole || (techSkills.length > 0 ? techSkills[0] : "");
    if (searchParam) {
      navigate(`/candidate/best-fit-jobs?search=${encodeURIComponent(searchParam)}`);
    } else {
      navigate("/candidate/best-fit-jobs");
    }
  };

  const analysis = resumeData?.analysis || null;
  const overallScore = analysis?.overall_score || 0;

  // Score categorization helpers
  const getScoreColorClass = (score) => {
    if (score >= 8.0) return "score--excellent";
    if (score >= 7.0) return "score--good";
    if (score >= 5.0) return "score--moderate";
    return "score--needs-work";
  };

  const getScoreBadgeText = (score) => {
    if (score >= 8.5) return "Top Competitive";
    if (score >= 7.5) return "Strong Candidate";
    if (score >= 6.0) return "Solid Foundation";
    if (score >= 4.5) return "Needs Enhancement";
    return "Action Required";
  };

  return (
    <div className="resume-analyzer-page">
      {/* ── Page Header ── */}
      <div className="analyzer-header">
        <div className="analyzer-header__text">
          <div className="analyzer-header__pill">
            <Sparkles size={14} className="analyzer-header__sparkle" />
            <span>AI Career Suite</span>
          </div>
          <h1 className="analyzer-header__title">AI Resume Analyzer & Quality Scorer</h1>
          <p className="analyzer-header__subtitle">
            Upload your CV in PDF or DOCX format. Our intelligent analyzer extracts your qualifications,
            lets you review every detail, and generates an objective quality score out of 10.
          </p>
        </div>

        {/* ── Workflow Step Navigation Pills ── */}
        <div className="analyzer-steps-nav">
          <button
            type="button"
            className={`step-nav-btn ${activeStep === "upload" ? "step-nav-btn--active" : ""}`}
            onClick={() => setActiveStep("upload")}
          >
            <span className="step-nav-num">1</span>
            <span className="step-nav-label">Upload CV</span>
          </button>
          <div className="step-nav-divider" />
          <button
            type="button"
            className={`step-nav-btn ${activeStep === "review" ? "step-nav-btn--active" : ""}`}
            onClick={() => {
              if (resumeData) setActiveStep("review");
              else setUploadError("Please upload a resume first.");
            }}
            disabled={!resumeData}
          >
            <span className="step-nav-num">2</span>
            <span className="step-nav-label">Review Extracted Data</span>
          </button>
          <div className="step-nav-divider" />
          <button
            type="button"
            className={`step-nav-btn ${activeStep === "analysis" ? "step-nav-btn--active" : ""}`}
            onClick={() => {
              if (analysis) setActiveStep("analysis");
              else if (resumeData) handleRunAnalysis();
              else setUploadError("Please upload and review your resume first.");
            }}
            disabled={!resumeData}
          >
            <span className="step-nav-num">3</span>
            <span className="step-nav-label">Quality Score & Insights</span>
          </button>
        </div>
      </div>

      {/* ── Loading Initial State ── */}
      {loadingInitial ? (
        <div className="analyzer-card analyzer-card--center">
          <RefreshCw size={28} className="analyzer-spin-icon" />
          <p style={{ marginTop: "12px", color: "var(--color-text-secondary)" }}>
            Loading your resume profile and analysis records...
          </p>
        </div>
      ) : (
        <>
          {/* ══════════════════════════════════════════════════════════════════════
              STEP 1: UPLOAD RESUME (PDF / DOCX)
             ══════════════════════════════════════════════════════════════════════ */}
          {activeStep === "upload" && (
            <div className="analyzer-upload-view">
              {uploadError && (
                <div className="analyzer-alert analyzer-alert--danger">
                  <AlertCircle size={20} className="analyzer-alert__icon" />
                  <div className="analyzer-alert__content">
                    <strong>Upload Error:</strong> {uploadError}
                  </div>
                  <button type="button" onClick={() => setUploadError("")} className="alert-close-btn">
                    <X size={16} />
                  </button>
                </div>
              )}

              {/* Existing Uploaded Document Info Card (if already present) */}
              {resumeData && (
                <div className="active-doc-banner">
                  <div className="active-doc-banner__left">
                    <div className="active-doc-icon-wrap">
                      <FileText size={24} className="active-doc-icon" />
                    </div>
                    <div>
                      <div className="active-doc-name">{resumeData.file_name}</div>
                      <div className="active-doc-meta">
                        <span>Format: {resumeData.file_type?.toUpperCase()}</span>
                        <span>•</span>
                        <span>Size: {Math.round((resumeData.file_size || 0) / 1024)} KB</span>
                        <span>•</span>
                        <span>Uploaded: {new Date(resumeData.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="active-doc-banner__actions">
                    {resumeData.file_url && (
                      <a href={resumeData.file_url} target="_blank" rel="noreferrer" className="btn-doc-action">
                        <Download size={14} />
                        <span>Download</span>
                      </a>
                    )}
                    <button
                      type="button"
                      className="btn-doc-action btn-doc-action--primary"
                      onClick={() => setActiveStep("review")}
                    >
                      <Edit3 size={14} />
                      <span>Review Data</span>
                    </button>
                    {resumeData.analysis && (
                      <button
                        type="button"
                        className="btn-doc-action btn-doc-action--accent"
                        onClick={() => setActiveStep("analysis")}
                      >
                        <TrendingUp size={14} />
                        <span>View Score ({resumeData.analysis.overall_score}/10)</span>
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn-doc-action btn-doc-action--danger"
                      onClick={handleDeleteResume}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )}

              {/* Drag and Drop Zone */}
              <div
                className={`dropzone-card ${isDragging ? "dropzone-card--dragging" : ""} ${uploading ? "dropzone-card--uploading" : ""}`}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={() => !uploading && fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx"
                  style={{ display: "none" }}
                  onChange={(e) => e.target.files?.[0] && handleFileSelection(e.target.files[0])}
                />

                <div className="dropzone-illu">
                  <div className="dropzone-icon-circle">
                    {uploading ? (
                      <RefreshCw size={36} className="analyzer-spin-icon" />
                    ) : (
                      <UploadCloud size={36} />
                    )}
                  </div>
                </div>

                <h2 className="dropzone-title">
                  {uploading ? uploadStepText : "Drag & drop your resume file here"}
                </h2>

                <p className="dropzone-subtitle">
                  Supports <strong>PDF (.pdf)</strong> and <strong>Microsoft Word (.docx)</strong> up to 10MB
                </p>

                {uploading ? (
                  <div className="dropzone-progress-wrap" onClick={(e) => e.stopPropagation()}>
                    <div className="dropzone-progress-bar">
                      <div
                        className="dropzone-progress-fill"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <span className="dropzone-progress-pct">{uploadProgress}%</span>
                  </div>
                ) : (
                  <button type="button" className="dropzone-browse-btn">
                    <span>Browse Files</span>
                  </button>
                )}

                <div className="dropzone-features">
                  <div className="dropzone-feature-chip">
                    <CheckCircle2 size={14} color="#10B981" />
                    <span>Real-time text extraction</span>
                  </div>
                  <div className="dropzone-feature-chip">
                    <CheckCircle2 size={14} color="#10B981" />
                    <span>Scanned document detection</span>
                  </div>
                  <div className="dropzone-feature-chip">
                    <CheckCircle2 size={14} color="#10B981" />
                    <span>Secure server-side processing</span>
                  </div>
                </div>
              </div>

              {/* Target Role Guidance */}
              <div className="target-role-preview-card">
                <div className="target-role-preview-header">
                  <Briefcase size={18} className="role-icon" />
                  <div>
                    <h3 className="target-role-title">Target Position (Optional)</h3>
                    <p className="target-role-desc">
                      Specifying your target role enables calibrated relevance scoring against market keywords.
                    </p>
                  </div>
                </div>
                <div className="target-role-input-wrap">
                  <input
                    type="text"
                    className="target-role-input"
                    placeholder="e.g. Full Stack Developer, Data Scientist, Product Designer"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════════
              STEP 2: EDITABLE REVIEW SCREEN
             ══════════════════════════════════════════════════════════════════════ */}
          {activeStep === "review" && (
            <div className="analyzer-review-view">
              {/* Scanned PDF Warning Banner if detected */}
              {resumeData?.is_scanned && (
                <div className="analyzer-alert analyzer-alert--warning">
                  <AlertTriangle size={20} className="analyzer-alert__icon" />
                  <div className="analyzer-alert__content">
                    <strong>Scanned / Flattened PDF Detected:</strong> The uploaded document appears to be an image scan
                    without selectable text. Please review the extracted information carefully, add any missing qualifications
                    directly below, or upload a text-based PDF or DOCX.
                  </div>
                </div>
              )}

              {/* Success Banner */}
              {editSuccessMsg && (
                <div className="analyzer-alert analyzer-alert--success">
                  <CheckCircle2 size={20} className="analyzer-alert__icon" />
                  <div className="analyzer-alert__content">{editSuccessMsg}</div>
                </div>
              )}

              {/* Review Header Banner with Primary Analyze CTA */}
              <div className="review-sticky-header">
                <div className="review-sticky-left">
                  <span className="review-step-tag">Step 2 of 3</span>
                  <h2 className="review-main-title">Review & Verify Extracted Information</h2>
                  <p className="review-main-sub">
                    Candidate verification screen: Correct any inaccurate data below before running the quality assessment.
                  </p>
                </div>
                <div className="review-sticky-actions">
                  <button
                    type="button"
                    className="review-btn review-btn--save"
                    onClick={handleSaveParsedEdits}
                    disabled={savingEdits || analyzing}
                  >
                    {savingEdits ? "Saving..." : "Save Changes"}
                  </button>
                  <button
                    type="button"
                    className="review-btn review-btn--analyze"
                    onClick={handleRunAnalysis}
                    disabled={analyzing}
                  >
                    {analyzing ? (
                      <>
                        <RefreshCw size={16} className="analyzer-spin-icon" />
                        <span>Analyzing CV...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} />
                        <span>Analyze My CV</span>
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Target Role Calibration Box */}
              <div className="review-section-card">
                <div className="review-section-card__header">
                  <div className="section-title-wrap">
                    <Briefcase size={18} color="#016BFB" />
                    <h3>Target Position</h3>
                  </div>
                  <span className="section-pill">Calibrates scoring relevance</span>
                </div>
                <div className="review-form-field">
                  <label>Target Job Title or Career Focus</label>
                  <input
                    type="text"
                    className="review-input"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    placeholder="e.g. Senior Frontend Developer, DevOps Engineer, Financial Analyst"
                  />
                </div>
              </div>

              {/* 1. Contact Information */}
              <div className="review-section-card">
                <div className="review-section-card__header">
                  <div className="section-title-wrap">
                    <User size={18} color="#016BFB" />
                    <h3>1. Contact Information</h3>
                  </div>
                </div>
                <div className="review-grid-2">
                  <div className="review-form-field">
                    <label>Full Name</label>
                    <input
                      type="text"
                      className="review-input"
                      value={parsedForm.contact_info?.name || ""}
                      onChange={(e) =>
                        setParsedForm({
                          ...parsedForm,
                          contact_info: { ...parsedForm.contact_info, name: e.target.value },
                        })
                      }
                      placeholder="Candidate Full Name"
                    />
                  </div>
                  <div className="review-form-field">
                    <label>Email Address</label>
                    <input
                      type="email"
                      className="review-input"
                      value={parsedForm.contact_info?.email || ""}
                      onChange={(e) =>
                        setParsedForm({
                          ...parsedForm,
                          contact_info: { ...parsedForm.contact_info, email: e.target.value },
                        })
                      }
                      placeholder="email@example.com"
                    />
                  </div>
                  <div className="review-form-field">
                    <label>Phone Number</label>
                    <input
                      type="text"
                      className="review-input"
                      value={parsedForm.contact_info?.phone || ""}
                      onChange={(e) =>
                        setParsedForm({
                          ...parsedForm,
                          contact_info: { ...parsedForm.contact_info, phone: e.target.value },
                        })
                      }
                      placeholder="+855 12 345 678"
                    />
                  </div>
                  <div className="review-form-field">
                    <label>Location / City</label>
                    <input
                      type="text"
                      className="review-input"
                      value={parsedForm.contact_info?.location || ""}
                      onChange={(e) =>
                        setParsedForm({
                          ...parsedForm,
                          contact_info: { ...parsedForm.contact_info, location: e.target.value },
                        })
                      }
                      placeholder="Phnom Penh, Cambodia"
                    />
                  </div>
                  <div className="review-form-field">
                    <label>LinkedIn Profile URL</label>
                    <input
                      type="url"
                      className="review-input"
                      value={parsedForm.contact_info?.linkedin || ""}
                      onChange={(e) =>
                        setParsedForm({
                          ...parsedForm,
                          contact_info: { ...parsedForm.contact_info, linkedin: e.target.value },
                        })
                      }
                      placeholder="https://linkedin.com/in/username"
                    />
                  </div>
                  <div className="review-form-field">
                    <label>Portfolio / Website</label>
                    <input
                      type="url"
                      className="review-input"
                      value={parsedForm.contact_info?.website || ""}
                      onChange={(e) =>
                        setParsedForm({
                          ...parsedForm,
                          contact_info: { ...parsedForm.contact_info, website: e.target.value },
                        })
                      }
                      placeholder="https://myportfolio.com"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Professional Summary */}
              <div className="review-section-card">
                <div className="review-section-card__header">
                  <div className="section-title-wrap">
                    <FileText size={18} color="#016BFB" />
                    <h3>2. Professional Summary</h3>
                  </div>
                  <span className="section-pill">Recommended: 40-80 words</span>
                </div>
                <div className="review-form-field">
                  <textarea
                    rows={4}
                    className="review-textarea"
                    value={parsedForm.summary || ""}
                    onChange={(e) => setParsedForm({ ...parsedForm, summary: e.target.value })}
                    placeholder="Summarize your professional experience, technical specializations, and career focus..."
                  />
                </div>
              </div>

              {/* 3. Skills (Technical & Soft) */}
              <div className="review-section-card">
                <div className="review-section-card__header">
                  <div className="section-title-wrap">
                    <Code2 size={18} color="#016BFB" />
                    <h3>3. Technical & Soft Skills</h3>
                  </div>
                </div>

                {/* Technical Skills Sub-Section */}
                <div className="skills-subgroup">
                  <label className="subgroup-label">Technical Skills</label>
                  <div className="skills-chip-list">
                    {(parsedForm.skills?.technical || []).map((skill) => (
                      <span key={skill} className="skill-badge skill-badge--tech">
                        <span>{skill}</span>
                        <button type="button" onClick={() => handleRemoveTechSkill(skill)}>
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                  <form onSubmit={handleAddTechSkill} className="inline-add-form">
                    <input
                      type="text"
                      className="inline-add-input"
                      placeholder="Add technical skill (e.g. Python, Docker, Next.js)..."
                      value={newTechSkill}
                      onChange={(e) => setNewTechSkill(e.target.value)}
                    />
                    <button type="submit" className="inline-add-btn">
                      <Plus size={14} /> Add
                    </button>
                  </form>
                </div>

                {/* Soft Skills Sub-Section */}
                <div className="skills-subgroup" style={{ marginTop: "20px" }}>
                  <label className="subgroup-label">Soft & Interpersonal Skills</label>
                  <div className="skills-chip-list">
                    {(parsedForm.skills?.soft || []).map((skill) => (
                      <span key={skill} className="skill-badge skill-badge--soft">
                        <span>{skill}</span>
                        <button type="button" onClick={() => handleRemoveSoftSkill(skill)}>
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                  <form onSubmit={handleAddSoftSkill} className="inline-add-form">
                    <input
                      type="text"
                      className="inline-add-input"
                      placeholder="Add soft skill (e.g. Leadership, Agile, Communication)..."
                      value={newSoftSkill}
                      onChange={(e) => setNewSoftSkill(e.target.value)}
                    />
                    <button type="submit" className="inline-add-btn">
                      <Plus size={14} /> Add
                    </button>
                  </form>
                </div>
              </div>

              {/* 4. Work Experience & Internships */}
              <div className="review-section-card">
                <div className="review-section-card__header">
                  <div className="section-title-wrap">
                    <Briefcase size={18} color="#016BFB" />
                    <h3>4. Work Experience & Internships</h3>
                  </div>
                  <button type="button" className="btn-add-item" onClick={handleAddExperience}>
                    <Plus size={14} /> Add Experience
                  </button>
                </div>

                {(parsedForm.work_experience || []).length === 0 ? (
                  <p className="empty-sub-msg">No work experience entries extracted yet. Click "Add Experience" to add one.</p>
                ) : (
                  <div className="items-card-list">
                    {parsedForm.work_experience.map((exp, idx) => (
                      <div key={idx} className="item-editor-card">
                        <div className="item-editor-card__header">
                          <span className="item-editor-num">Experience #{idx + 1}</span>
                          <button
                            type="button"
                            className="btn-remove-item"
                            onClick={() => handleRemoveExperience(idx)}
                            title="Remove this experience"
                          >
                            <Trash2 size={14} /> Remove
                          </button>
                        </div>
                        <div className="review-grid-2">
                          <div className="review-form-field">
                            <label>Job Title</label>
                            <input
                              type="text"
                              className="review-input"
                              value={exp.title || ""}
                              onChange={(e) => {
                                const copy = [...parsedForm.work_experience];
                                copy[idx].title = e.target.value;
                                setParsedForm({ ...parsedForm, work_experience: copy });
                              }}
                              placeholder="e.g. Software Engineer"
                            />
                          </div>
                          <div className="review-form-field">
                            <label>Company / Employer</label>
                            <input
                              type="text"
                              className="review-input"
                              value={exp.company || ""}
                              onChange={(e) => {
                                const copy = [...parsedForm.work_experience];
                                copy[idx].company = e.target.value;
                                setParsedForm({ ...parsedForm, work_experience: copy });
                              }}
                              placeholder="e.g. Mekong Labs"
                            />
                          </div>
                          <div className="review-form-field">
                            <label>Start Date</label>
                            <input
                              type="text"
                              className="review-input"
                              value={exp.start_date || ""}
                              onChange={(e) => {
                                const copy = [...parsedForm.work_experience];
                                copy[idx].start_date = e.target.value;
                                setParsedForm({ ...parsedForm, work_experience: copy });
                              }}
                              placeholder="e.g. Jan 2024"
                            />
                          </div>
                          <div className="review-form-field">
                            <label>End Date</label>
                            <input
                              type="text"
                              className="review-input"
                              value={exp.end_date || ""}
                              onChange={(e) => {
                                const copy = [...parsedForm.work_experience];
                                copy[idx].end_date = e.target.value;
                                setParsedForm({ ...parsedForm, work_experience: copy });
                              }}
                              placeholder="e.g. Present or Dec 2025"
                            />
                          </div>
                        </div>
                        <div className="review-form-field" style={{ marginTop: "12px" }}>
                          <label>Accomplishments / Bullet Points (one per line)</label>
                          <textarea
                            rows={3}
                            className="review-textarea"
                            value={(exp.bullet_points || []).join("\n")}
                            onChange={(e) => {
                              const copy = [...parsedForm.work_experience];
                              copy[idx].bullet_points = e.target.value.split("\n");
                              setParsedForm({ ...parsedForm, work_experience: copy });
                            }}
                            placeholder="- Built customer checkout reducing drop-off by 15%&#10;- Architected REST API backend serving 50k monthly queries"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 5. Education */}
              <div className="review-section-card">
                <div className="review-section-card__header">
                  <div className="section-title-wrap">
                    <GraduationCap size={18} color="#016BFB" />
                    <h3>5. Education</h3>
                  </div>
                  <button type="button" className="btn-add-item" onClick={handleAddEducation}>
                    <Plus size={14} /> Add Education
                  </button>
                </div>

                {(parsedForm.education || []).length === 0 ? (
                  <p className="empty-sub-msg">No education entries extracted. Click "Add Education" to add one.</p>
                ) : (
                  <div className="items-card-list">
                    {parsedForm.education.map((edu, idx) => (
                      <div key={idx} className="item-editor-card">
                        <div className="item-editor-card__header">
                          <span className="item-editor-num">Education #{idx + 1}</span>
                          <button
                            type="button"
                            className="btn-remove-item"
                            onClick={() => handleRemoveEducation(idx)}
                          >
                            <Trash2 size={14} /> Remove
                          </button>
                        </div>
                        <div className="review-grid-2">
                          <div className="review-form-field">
                            <label>Institution / University</label>
                            <input
                              type="text"
                              className="review-input"
                              value={edu.institution || ""}
                              onChange={(e) => {
                                const copy = [...parsedForm.education];
                                copy[idx].institution = e.target.value;
                                setParsedForm({ ...parsedForm, education: copy });
                              }}
                              placeholder="e.g. Royal University of Phnom Penh"
                            />
                          </div>
                          <div className="review-form-field">
                            <label>Degree / Qualification</label>
                            <input
                              type="text"
                              className="review-input"
                              value={edu.degree || ""}
                              onChange={(e) => {
                                const copy = [...parsedForm.education];
                                copy[idx].degree = e.target.value;
                                setParsedForm({ ...parsedForm, education: copy });
                              }}
                              placeholder="e.g. Bachelor of Science"
                            />
                          </div>
                          <div className="review-form-field">
                            <label>Major / Field of Study</label>
                            <input
                              type="text"
                              className="review-input"
                              value={edu.major || ""}
                              onChange={(e) => {
                                const copy = [...parsedForm.education];
                                copy[idx].major = e.target.value;
                                setParsedForm({ ...parsedForm, education: copy });
                              }}
                              placeholder="e.g. Computer Science"
                            />
                          </div>
                          <div className="review-form-field">
                            <label>Graduation Year</label>
                            <input
                              type="text"
                              className="review-input"
                              value={edu.graduation_year || ""}
                              onChange={(e) => {
                                const copy = [...parsedForm.education];
                                copy[idx].graduation_year = e.target.value;
                                setParsedForm({ ...parsedForm, education: copy });
                              }}
                              placeholder="e.g. 2026"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 6. Projects & Achievements */}
              <div className="review-section-card">
                <div className="review-section-card__header">
                  <div className="section-title-wrap">
                    <FolderGit2 size={18} color="#016BFB" />
                    <h3>6. Projects & Achievements</h3>
                  </div>
                  <button type="button" className="btn-add-item" onClick={handleAddProject}>
                    <Plus size={14} /> Add Project
                  </button>
                </div>

                {(parsedForm.projects || []).length === 0 ? (
                  <p className="empty-sub-msg">No projects listed. Adding personal or academic projects boosts your score.</p>
                ) : (
                  <div className="items-card-list">
                    {parsedForm.projects.map((proj, idx) => (
                      <div key={idx} className="item-editor-card">
                        <div className="item-editor-card__header">
                          <span className="item-editor-num">Project #{idx + 1}</span>
                          <button
                            type="button"
                            className="btn-remove-item"
                            onClick={() => handleRemoveProject(idx)}
                          >
                            <Trash2 size={14} /> Remove
                          </button>
                        </div>
                        <div className="review-grid-2">
                          <div className="review-form-field">
                            <label>Project Title</label>
                            <input
                              type="text"
                              className="review-input"
                              value={proj.title || ""}
                              onChange={(e) => {
                                const copy = [...parsedForm.projects];
                                copy[idx].title = e.target.value;
                                setParsedForm({ ...parsedForm, projects: copy });
                              }}
                              placeholder="e.g. CareerLens AI Recruitment Suite"
                            />
                          </div>
                          <div className="review-form-field">
                            <label>Repository / Live URL</label>
                            <input
                              type="url"
                              className="review-input"
                              value={proj.link || ""}
                              onChange={(e) => {
                                const copy = [...parsedForm.projects];
                                copy[idx].link = e.target.value;
                                setParsedForm({ ...parsedForm, projects: copy });
                              }}
                              placeholder="https://github.com/..."
                            />
                          </div>
                        </div>
                        <div className="review-form-field" style={{ marginTop: "12px" }}>
                          <label>Description & Technologies</label>
                          <textarea
                            rows={2}
                            className="review-textarea"
                            value={proj.description || ""}
                            onChange={(e) => {
                              const copy = [...parsedForm.projects];
                              copy[idx].description = e.target.value;
                              setParsedForm({ ...parsedForm, projects: copy });
                            }}
                            placeholder="Full-stack AI platform developed using Django REST framework and React..."
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 7. Certifications & Training */}
              <div className="review-section-card">
                <div className="review-section-card__header">
                  <div className="section-title-wrap">
                    <Award size={18} color="#016BFB" />
                    <h3>7. Certifications & Training</h3>
                  </div>
                  <button type="button" className="btn-add-item" onClick={handleAddCertification}>
                    <Plus size={14} /> Add Certification
                  </button>
                </div>

                {(parsedForm.certifications || []).length === 0 ? (
                  <p className="empty-sub-msg">No certifications detected. Click "Add Certification" to record certificates.</p>
                ) : (
                  <div className="items-card-list">
                    {parsedForm.certifications.map((cert, idx) => (
                      <div key={idx} className="item-editor-card">
                        <div className="item-editor-card__header">
                          <span className="item-editor-num">Certificate #{idx + 1}</span>
                          <button
                            type="button"
                            className="btn-remove-item"
                            onClick={() => handleRemoveCertification(idx)}
                          >
                            <Trash2 size={14} /> Remove
                          </button>
                        </div>
                        <div className="review-grid-2">
                          <div className="review-form-field">
                            <label>Certification Name</label>
                            <input
                              type="text"
                              className="review-input"
                              value={cert.name || ""}
                              onChange={(e) => {
                                const copy = [...parsedForm.certifications];
                                copy[idx].name = e.target.value;
                                setParsedForm({ ...parsedForm, certifications: copy });
                              }}
                              placeholder="e.g. AWS Certified Cloud Practitioner"
                            />
                          </div>
                          <div className="review-form-field">
                            <label>Issuer / Organization</label>
                            <input
                              type="text"
                              className="review-input"
                              value={cert.issuer || ""}
                              onChange={(e) => {
                                const copy = [...parsedForm.certifications];
                                copy[idx].issuer = e.target.value;
                                setParsedForm({ ...parsedForm, certifications: copy });
                              }}
                              placeholder="e.g. Amazon Web Services"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 8. Languages */}
              <div className="review-section-card">
                <div className="review-section-card__header">
                  <div className="section-title-wrap">
                    <Languages size={18} color="#016BFB" />
                    <h3>8. Languages</h3>
                  </div>
                  <button type="button" className="btn-add-item" onClick={handleAddLanguage}>
                    <Plus size={14} /> Add Language
                  </button>
                </div>

                {(parsedForm.languages || []).length === 0 ? (
                  <p className="empty-sub-msg">No languages recorded. Click "Add Language" to specify proficiencies.</p>
                ) : (
                  <div className="languages-chip-grid">
                    {parsedForm.languages.map((lang, idx) => (
                      <div key={idx} className="language-row-item">
                        <input
                          type="text"
                          className="review-input"
                          style={{ flex: 1 }}
                          value={lang.language || ""}
                          onChange={(e) => {
                            const copy = [...parsedForm.languages];
                            copy[idx].language = e.target.value;
                            setParsedForm({ ...parsedForm, languages: copy });
                          }}
                          placeholder="e.g. English, Khmer"
                        />
                        <select
                          className="review-input"
                          style={{ width: "160px" }}
                          value={lang.proficiency || "Working"}
                          onChange={(e) => {
                            const copy = [...parsedForm.languages];
                            copy[idx].proficiency = e.target.value;
                            setParsedForm({ ...parsedForm, languages: copy });
                          }}
                        >
                          <option value="Native">Native</option>
                          <option value="Fluent">Fluent</option>
                          <option value="Professional">Professional</option>
                          <option value="Conversational">Conversational</option>
                          <option value="Basic">Basic</option>
                        </select>
                        <button
                          type="button"
                          className="btn-remove-lang"
                          onClick={() => handleRemoveLanguage(idx)}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Bottom Fixed Action Bar */}
              <div className="review-bottom-actions">
                <button
                  type="button"
                  className="review-btn review-btn--save"
                  onClick={handleSaveParsedEdits}
                  disabled={savingEdits || analyzing}
                >
                  {savingEdits ? "Saving..." : "Save Changes"}
                </button>
                <button
                  type="button"
                  className="review-btn review-btn--analyze"
                  onClick={handleRunAnalysis}
                  disabled={analyzing}
                >
                  {analyzing ? (
                    <>
                      <RefreshCw size={16} className="analyzer-spin-icon" />
                      <span>Generating Objective Quality Score...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      <span>Analyze My CV</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════════
              STEP 3: RESULTS DASHBOARD
             ══════════════════════════════════════════════════════════════════════ */}
          {activeStep === "analysis" && (
            <div className="analyzer-dashboard-view">
              {analysisError && (
                <div className="analyzer-alert analyzer-alert--danger">
                  <AlertCircle size={20} className="analyzer-alert__icon" />
                  <div className="analyzer-alert__content">{analysisError}</div>
                </div>
              )}

              {/* Top Hero Score Card */}
              <div className="score-hero-card">
                <div className="score-hero-left">
                  <div className="score-circular-badge">
                    <span className="score-circular-num">{overallScore}</span>
                    <span className="score-circular-denom">/10</span>
                  </div>
                  <div className="score-hero-details">
                    <div className="score-hero-badge-row">
                      <span className={`quality-badge ${getScoreColorClass(overallScore)}`}>
                        {getScoreBadgeText(overallScore)}
                      </span>
                      {analysis?.target_role && (
                        <span className="target-role-badge">
                          Target: {analysis.target_role}
                        </span>
                      )}
                    </div>
                    <h2 className="score-hero-title">Resume Quality Assessment</h2>
                    <p className="score-hero-desc">
                      Scored against a consistent 6-dimension rubric including completeness, readability,
                      summary strength, skill inventory, practical experience, and target position relevance.
                    </p>
                  </div>
                </div>

                <div className="score-hero-right">
                  <button
                    type="button"
                    className="hero-action-btn hero-action-btn--primary"
                    onClick={() => setActiveStep("review")}
                  >
                    <Edit3 size={15} />
                    <span>Edit CV Information</span>
                  </button>
                  <button
                    type="button"
                    className="hero-action-btn hero-action-btn--outline"
                    onClick={handleRunAnalysis}
                    disabled={analyzing}
                  >
                    <RefreshCw size={14} className={analyzing ? "analyzer-spin-icon" : ""} />
                    <span>Re-Analyze</span>
                  </button>
                </div>
              </div>

              {/* Score Breakdown: 6 Dimensions */}
              <div className="dashboard-section-card">
                <div className="dashboard-section-header">
                  <TrendingUp size={20} color="#016BFB" />
                  <div>
                    <h3 className="dashboard-section-title">Score Breakdown by Category</h3>
                    <p className="dashboard-section-sub">
                      Transparent assessment across all 6 core evaluation dimensions.
                    </p>
                  </div>
                </div>

                <div className="rubric-grid">
                  {Object.entries(analysis?.category_scores || {}).map(([catKey, catVal]) => {
                    const score = typeof catVal === "object" ? catVal.score : catVal;
                    const feedback = typeof catVal === "object" ? catVal.feedback : "";
                    const titles = {
                      completeness: "Completeness",
                      structure_readability: "Structure & Readability",
                      professional_summary: "Professional Summary",
                      skills_presentation: "Skills Presentation",
                      experience_projects: "Experience & Projects",
                      target_relevance: "Target Role Relevance",
                    };
                    const title = titles[catKey] || catKey.replace(/_/g, " ").toUpperCase();
                    const pct = Math.min(100, Math.max(0, (score / 10) * 100));

                    return (
                      <div key={catKey} className="rubric-card">
                        <div className="rubric-card__top">
                          <span className="rubric-card__title">{title}</span>
                          <span className="rubric-card__score">
                            <strong>{score}</strong>/10
                          </span>
                        </div>
                        <div className="rubric-progress-bar">
                          <div
                            className={`rubric-progress-fill ${getScoreColorClass(score)}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        {feedback && <p className="rubric-card__feedback">{feedback}</p>}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Strengths & Areas for Improvement (Side by Side) */}
              <div className="insights-dual-grid">
                {/* Strengths */}
                <div className="insight-card insight-card--strengths">
                  <div className="insight-card__header">
                    <div className="insight-icon-bubble insight-icon-bubble--green">
                      <CheckCircle2 size={18} />
                    </div>
                    <h4>Resume Strengths</h4>
                  </div>
                  {(analysis?.strengths || []).length > 0 ? (
                    <ul className="insight-list">
                      {analysis.strengths.map((str, i) => (
                        <li key={i}>
                          <CheckCircle2 size={15} className="bullet-icon bullet-icon--green" />
                          <span>{str}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="insight-empty">Add more details in the review screen to highlight your strengths.</p>
                  )}
                </div>

                {/* Areas for Improvement */}
                <div className="insight-card insight-card--weaknesses">
                  <div className="insight-card__header">
                    <div className="insight-icon-bubble insight-icon-bubble--amber">
                      <AlertTriangle size={18} />
                    </div>
                    <h4>Areas for Improvement</h4>
                  </div>
                  {(analysis?.weaknesses || []).length > 0 ? (
                    <ul className="insight-list">
                      {analysis.weaknesses.map((w, i) => (
                        <li key={i}>
                          <AlertTriangle size={15} className="bullet-icon bullet-icon--amber" />
                          <span>{w}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="insight-empty">No critical weaknesses identified for this evaluation.</p>
                  )}
                </div>
              </div>

              {/* Missing or Incomplete Sections & Suggested Next Steps */}
              <div className="insights-dual-grid">
                {/* Missing Sections */}
                <div className="insight-card insight-card--missing">
                  <div className="insight-card__header">
                    <div className="insight-icon-bubble insight-icon-bubble--blue">
                      <Info size={18} />
                    </div>
                    <h4>Missing or Incomplete Sections</h4>
                  </div>
                  <p className="insight-card-note">
                    Note: Missing information does not mean you lack the qualification. Adding these sections will improve recruiter visibility.
                  </p>
                  {(analysis?.missing_sections || []).length > 0 ? (
                    <ul className="insight-list">
                      {analysis.missing_sections.map((m, i) => (
                        <li key={i}>
                          <Info size={15} className="bullet-icon bullet-icon--blue" />
                          <span>{m}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="insight-empty">All foundational resume sections are present and accounted for!</p>
                  )}
                </div>

                {/* Suggested Next Steps */}
                <div className="insight-card insight-card--nextsteps">
                  <div className="insight-card__header">
                    <div className="insight-icon-bubble insight-icon-bubble--purple">
                      <Sparkles size={18} />
                    </div>
                    <h4>Suggested Next Steps</h4>
                  </div>
                  {(analysis?.next_steps || []).length > 0 ? (
                    <ul className="insight-list">
                      {analysis.next_steps.map((step, i) => (
                        <li key={i}>
                          <ChevronRight size={15} className="bullet-icon bullet-icon--purple" />
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="insight-empty">Follow recommendations to maximize your application power.</p>
                  )}
                </div>
              </div>

              {/* Primary Action Buttons (Requirement 4) */}
              <div className="dashboard-action-banner">
                <div className="dashboard-action-banner__content">
                  <div className="action-banner-icon-box">
                    <Sparkles size={28} color="#016BFB" />
                  </div>
                  <div>
                    <h3 className="action-banner-title">Ready to take the next step with your career?</h3>
                    <p className="action-banner-desc">
                      Optimize your CV bullet points with AI assistance or explore curated job openings matching your verified skillset.
                    </p>
                  </div>
                </div>

                <div className="dashboard-action-banner__buttons">
                  <button
                    type="button"
                    className="btn-action-primary btn-action-improve"
                    onClick={() => navigate("/candidate/cv-studio")}
                  >
                    <Sparkles size={16} />
                    <span>Improve My CV with AI</span>
                  </button>

                  <button
                    type="button"
                    className="btn-action-primary btn-action-jobs"
                    onClick={handleFindBestFitJobs}
                  >
                    <Search size={16} />
                    <span>Find My Best-Fit Jobs</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Modal for "Improve My CV with AI" (Requirement 4) ── */}
      {showImproveModal && (
        <div className="analyzer-modal-overlay" onClick={() => setShowImproveModal(false)}>
          <div className="analyzer-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="analyzer-modal-header">
              <div className="analyzer-modal-badge">
                <Sparkles size={14} />
                <span>Feature Preview</span>
              </div>
              <button
                type="button"
                className="analyzer-modal-close"
                onClick={() => setShowImproveModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="analyzer-modal-body">
              <h2 className="analyzer-modal-title">Improve My CV with AI</h2>
              <p className="analyzer-modal-desc">
                The AI Resume Rewriter is scheduled for Priority 2. It will automatically rephrase your work
                experience and project descriptions using powerful action verbs and quantifiable STAR bullet points.
              </p>

              <div className="analyzer-modal-status-card">
                <div className="status-indicator-dot" />
                <div>
                  <strong>Development Status: In Roadmap</strong>
                  <p>
                    Your resume has been parsed and scored. In Priority 2, clicking this button will generate tailored
                    bullet point revisions targeted to specific job descriptions.
                  </p>
                </div>
              </div>

              <div className="analyzer-modal-preview-box">
                <span className="preview-tag">Preview Transformation</span>
                <div className="preview-before">
                  <strong>Before:</strong> Worked on website features using React.
                </div>
                <div className="preview-after">
                  <strong>After AI Polish:</strong> Architected responsive client checkout workflows in React, reducing cart abandonment by 18% across 40k monthly users.
                </div>
              </div>
            </div>

            <div className="analyzer-modal-footer">
              <button
                type="button"
                className="review-btn review-btn--save"
                onClick={() => setShowImproveModal(false)}
              >
                Got It
              </button>
              <button
                type="button"
                className="review-btn review-btn--analyze"
                onClick={() => {
                  setShowImproveModal(false);
                  navigate("/candidate/cv-studio");
                }}
              >
                <Sparkles size={15} />
                <span>Launch AI Improvement Studio</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
