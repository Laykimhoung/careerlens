import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Check,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  X,
  Briefcase,
  Building2,
  Calendar,
  Clock,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  ShieldCheck,
  Award,
} from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import {
  getInterviewPrepApi,
  regenerateInterviewPrepApi,
} from "../../services/candidateService";
import "./InterviewPrepModal.css";

export default function InterviewPrepModal({
  applicationId,
  jobTitle = "",
  companyName = "",
  isOpen,
  onClose,
}) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [prepData, setPrepData] = useState(null);
  const [isAiGenerated, setIsAiGenerated] = useState(false);
  const [error, setError] = useState(null);
  const [expandedQuestion, setExpandedQuestion] = useState(null);
  const [completedSteps, setCompletedSteps] = useState({});
  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'checklist' | 'questions' | 'dos_donts'

  const loadPrep = async (force = false) => {
    if (!applicationId) return;
    if (force) setRegenerating(true);
    else setLoading(true);
    setError(null);

    try {
      const res = force
        ? await regenerateInterviewPrepApi(applicationId)
        : await getInterviewPrepApi(applicationId);

      const data = res.data;
      if (data && data.prep) {
        setPrepData(data.prep);
        setIsAiGenerated(Boolean(data.is_ai_generated));
        if (data.prep.likely_questions?.[0]) {
          setExpandedQuestion(data.prep.likely_questions[0].id || 1);
        }
      } else {
        setError(data.detail || "Interview preparation is not available for this application yet.");
      }
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Failed to load AI interview preparation. Please try again."
      );
    } finally {
      setLoading(false);
      setRegenerating(false);
    }
  };

  useEffect(() => {
    if (isOpen && applicationId) {
      loadPrep(false);
    }
  }, [isOpen, applicationId]);

  if (!isOpen) return null;

  const toggleStep = (idx) => {
    setCompletedSteps((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const checklist = prepData?.preparation_checklist || [];
  const questions = prepData?.likely_questions || [];
  const whatShouldDo = prepData?.what_should_do || [];
  const whatNotToDo = prepData?.what_not_to_do || [];
  const questionsToAsk = prepData?.questions_to_ask_interviewer || [];
  const expertAdvice = prepData?.expert_advice || "";
  const roleOverview = prepData?.role_overview || "";
  const jobSummary = prepData?.job_summary || {};

  const checkedCount = Object.values(completedSteps).filter(Boolean).length;
  const progressPct =
    checklist.length > 0 ? Math.round((checkedCount / checklist.length) * 100) : 0;

  return createPortal(
    <div className="ip-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="ip-modal-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="ip-modal-header">
          <div className="ip-modal-header-main">
            <div className="ip-header-badge-row">
              <span className="ip-badge-interview">
                <Calendar size={13} style={{ marginRight: 4 }} />
                {t("candidate.interviewStage", "Interview Stage")}
              </span>
              <span className="ip-badge-ai">
                <Sparkles size={13} style={{ marginRight: 4, color: "#38BDF8" }} />
                {isAiGenerated ? "Gemini AI Coach" : "Intelligent AI Coach"}
              </span>
            </div>
            <h2 className="ip-modal-title">
              {jobTitle || jobSummary.title || "Interview Preparation"}
            </h2>
            <div className="ip-modal-subtitle">
              <Building2 size={15} style={{ display: "inline", marginRight: 4, verticalAlign: "middle" }} />
              <strong>{companyName || jobSummary.company_name || "Hiring Partner"}</strong>
              {jobSummary.location && ` · ${jobSummary.location}`}
              {jobSummary.employment_type && ` · ${jobSummary.employment_type}`}
            </div>
          </div>

          <div className="ip-modal-header-actions">
            <button
              type="button"
              className="ip-btn-header ip-btn-header-ghost"
              onClick={() => loadPrep(true)}
              disabled={loading || regenerating}
              title={t("candidate.regenerateAi", "Regenerate tailored preparation with Gemini AI")}
            >
              <RefreshCw size={16} className={regenerating ? "ip-spin" : ""} />
              <span className="ip-hide-mobile">
                {regenerating ? t("candidate.generating", "Regenerating...") : t("candidate.regenerate", "Refresh AI")}
              </span>
            </button>
            <button
              type="button"
              className="ip-modal-close"
              onClick={onClose}
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="ip-modal-body">
          {loading ? (
            <div className="ip-loading-state">
              <div className="ip-loading-spinner" />
              <h3>{t("candidate.analyzingInterview", "Synthesizing AI Interview Preparation...")}</h3>
              <p>
                Comparing job requirements, company profile, and your verified candidate skills to build role-specific guidance.
              </p>
            </div>
          ) : error ? (
            <div className="ip-error-state">
              <AlertTriangle size={36} color="#EF4444" style={{ marginBottom: 12 }} />
              <h3>{t("common.error", "Unable to Load Interview Prep")}</h3>
              <p>{error}</p>
              <button
                type="button"
                className="ip-btn-primary"
                style={{ marginTop: 16 }}
                onClick={() => loadPrep(false)}
              >
                {t("common.tryAgain", "Try Again")}
              </button>
            </div>
          ) : (
            <>
              {/* Tab Filters */}
              <div className="ip-tabs-nav">
                <button
                  type="button"
                  className={`ip-tab-btn ${activeTab === "all" ? "is-active" : ""}`}
                  onClick={() => setActiveTab("all")}
                >
                  {t("candidate.allSections", "All Guides")}
                </button>
                <button
                  type="button"
                  className={`ip-tab-btn ${activeTab === "checklist" ? "is-active" : ""}`}
                  onClick={() => setActiveTab("checklist")}
                >
                  {t("candidate.preparationChecklist", "Preparation Checklist")}
                </button>
                <button
                  type="button"
                  className={`ip-tab-btn ${activeTab === "questions" ? "is-active" : ""}`}
                  onClick={() => setActiveTab("questions")}
                >
                  {t("candidate.likelyQuestions", "Likely Questions & Answers")} ({questions.length})
                </button>
                <button
                  type="button"
                  className={`ip-tab-btn ${activeTab === "dos_donts" ? "is-active" : ""}`}
                  onClick={() => setActiveTab("dos_donts")}
                >
                  {t("candidate.dosAndDonts", "Do's & Don'ts")}
                </button>
              </div>

              {/* Expert Advice Banner */}
              {expertAdvice && (
                <div className="ip-advice-card">
                  <div className="ip-advice-icon">
                    <Award size={22} color="#016BFB" />
                  </div>
                  <div className="ip-advice-content">
                    <h4>{t("candidate.coachAdviceTitle", "AI Interview Coach Assessment")}</h4>
                    <p>{expertAdvice}</p>
                    {roleOverview && <div className="ip-role-overview">{roleOverview}</div>}
                  </div>
                </div>
              )}

              {/* SECTION 1: PREPARATION CHECKLIST */}
              {(activeTab === "all" || activeTab === "checklist") && checklist.length > 0 && (
                <section className="ip-section">
                  <div className="ip-section-head">
                    <div>
                      <h3 className="ip-section-title">
                        <Clock size={18} style={{ color: "#016BFB", marginRight: 8 }} />
                        {t("candidate.prepTimelineTitle", "What You Should Do (Preparation Timeline)")}
                      </h3>
                      <p className="ip-section-desc">
                        Follow this step-by-step preparation plan leading up to the interview moment.
                      </p>
                    </div>
                    <div className="ip-checklist-metric">
                      <span>{checkedCount} of {checklist.length} completed ({progressPct}%)</span>
                      <div className="ip-progress-bar">
                        <div className="ip-progress-fill" style={{ width: `${progressPct}%` }} />
                      </div>
                    </div>
                  </div>

                  <div className="ip-checklist-grid">
                    {checklist.map((item, idx) => {
                      const isChecked = Boolean(completedSteps[idx]);
                      return (
                        <div
                          key={idx}
                          className={`ip-checklist-item ${isChecked ? "is-checked" : ""}`}
                          onClick={() => toggleStep(idx)}
                        >
                          <button
                            type="button"
                            className={`ip-checkbox ${isChecked ? "is-checked" : ""}`}
                            aria-label={item.step}
                          >
                            {isChecked && <Check size={14} strokeWidth={3} />}
                          </button>
                          <div className="ip-checklist-body">
                            <div className="ip-checklist-header">
                              <span className="ip-timeline-badge">{item.timeline}</span>
                              <strong className="ip-step-title">{item.step}</strong>
                            </div>
                            <p className="ip-step-details">{item.details}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* SECTION 2: LIKELY QUESTIONS & HOW TO ANSWER */}
              {(activeTab === "all" || activeTab === "questions") && questions.length > 0 && (
                <section className="ip-section">
                  <div className="ip-section-head">
                    <div>
                      <h3 className="ip-section-title">
                        <HelpCircle size={18} style={{ color: "#016BFB", marginRight: 8 }} />
                        {t("candidate.likelyQuestionsTitle", "Probable Interview Questions & How to Answer")}
                      </h3>
                      <p className="ip-section-desc">
                        Specific technical and behavioral questions tailored to this role, along with model answers using the STAR method.
                      </p>
                    </div>
                  </div>

                  <div className="ip-questions-list">
                    {questions.map((q, idx) => {
                      const isExpanded = expandedQuestion === (q.id || idx + 1);
                      return (
                        <div
                          key={q.id || idx}
                          className={`ip-question-card ${isExpanded ? "is-expanded" : ""}`}
                        >
                          <div
                            className="ip-question-head"
                            onClick={() =>
                              setExpandedQuestion(isExpanded ? null : (q.id || idx + 1))
                            }
                          >
                            <div className="ip-question-num">{idx + 1}</div>
                            <div className="ip-question-text-wrap">
                              <span className="ip-cat-pill">{q.category || "Technical"}</span>
                              <h4 className="ip-question-title">{q.question}</h4>
                            </div>
                            <button
                              type="button"
                              className="ip-question-toggle"
                              aria-label={isExpanded ? "Collapse" : "Expand"}
                            >
                              {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                            </button>
                          </div>

                          {isExpanded && (
                            <div className="ip-question-body animate-fade-in">
                              {q.why_asked && (
                                <div className="ip-why-asked">
                                  <strong>Why Interviewers Ask This:</strong>
                                  <p>{q.why_asked}</p>
                                </div>
                              )}

                              <div className="ip-model-answer">
                                <div className="ip-model-answer-head">
                                  <ShieldCheck size={16} color="#059669" />
                                  <strong>How to Answer Properly:</strong>
                                </div>
                                <p>{q.model_answer}</p>
                              </div>

                              {q.key_points_to_include && q.key_points_to_include.length > 0 && (
                                <div className="ip-key-points">
                                  <span className="ip-key-points-label">Key Points & Keywords to Include:</span>
                                  <div className="ip-key-tags">
                                    {q.key_points_to_include.map((pt, pIdx) => (
                                      <span key={pIdx} className="ip-key-tag">
                                        {pt}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* SECTION 3: DO'S AND DON'TS */}
              {(activeTab === "all" || activeTab === "dos_donts") && (
                <section className="ip-section">
                  <div className="ip-section-head">
                    <div>
                      <h3 className="ip-section-title">
                        <ThumbsUp size={18} style={{ color: "#016BFB", marginRight: 8 }} />
                        {t("candidate.dosAndDontsTitle", "What to Do & What to Avoid (Do's and Don'ts)")}
                      </h3>
                      <p className="ip-section-desc">
                        Critical behavioral guidelines and common traps to steer clear of during your conversation.
                      </p>
                    </div>
                  </div>

                  <div className="ip-dos-donts-grid">
                    {/* What You SHOULD Do */}
                    <div className="ip-dos-card">
                      <div className="ip-dos-head">
                        <div className="ip-dos-icon">
                          <CheckCircle2 size={20} color="#10B981" />
                        </div>
                        <h4>{t("candidate.whatShouldDo", "What You SHOULD Do")}</h4>
                      </div>
                      <ul className="ip-dos-list">
                        {whatShouldDo.map((item, idx) => (
                          <li key={idx}>
                            <span className="ip-dos-check">✓</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* What You Should NOT Do */}
                    <div className="ip-donts-card">
                      <div className="ip-donts-head">
                        <div className="ip-donts-icon">
                          <AlertTriangle size={20} color="#EF4444" />
                        </div>
                        <h4>{t("candidate.whatNotToDo", "What You Should NOT Do")}</h4>
                      </div>
                      <ul className="ip-donts-list">
                        {whatNotToDo.map((item, idx) => (
                          <li key={idx}>
                            <span className="ip-donts-cross">✕</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </section>
              )}

              {/* SECTION 4: QUESTIONS TO ASK THE INTERVIEWER */}
              {(activeTab === "all" || activeTab === "questions") && questionsToAsk.length > 0 && (
                <section className="ip-section ip-questions-to-ask-section">
                  <div className="ip-section-head">
                    <div>
                      <h3 className="ip-section-title">
                        <MessageSquare size={18} style={{ color: "#016BFB", marginRight: 8 }} />
                        {t("candidate.askInterviewerTitle", "Smart Questions to Ask the Hiring Team")}
                      </h3>
                      <p className="ip-section-desc">
                        Asking thoughtful questions at the end of the interview highlights your technical curiosity and strategic mindset.
                      </p>
                    </div>
                  </div>

                  <div className="ip-ask-grid">
                    {questionsToAsk.map((qText, idx) => (
                      <div key={idx} className="ip-ask-card">
                        <span className="ip-ask-num">#{idx + 1}</span>
                        <p>{qText}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="ip-modal-footer">
          <div className="ip-footer-note">
            <Sparkles size={14} color="#016BFB" style={{ marginRight: 6 }} />
            <span>
              Persisted in database. Tailored specifically for <strong>{jobTitle || "your target role"}</strong>.
            </span>
          </div>
          <button type="button" className="ip-btn-primary" onClick={onClose}>
            {t("common.close", "Close Prep Guide")}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

