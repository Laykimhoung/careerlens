import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Sparkles,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Star,
  FileText,
  Calendar,
  Users,
  ChevronRight,
  TrendingUp,
  Award,
  Layers,
  ArrowUpDown,
  ExternalLink,
  X,
  Clock,
  Briefcase,
  GraduationCap,
  FolderGit2,
  Check,
  MessageSquare,
  BarChart2,
  Plus,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';
import { getJobs } from '../../../services/jobService';
import {
  getJobRankings,
  refreshJobRankings,
  compareCandidates,
  toggleShortlist,
  updateApplicationStatus,
  addRecruiterNote,
  scheduleInterview,
} from '../../../services/candidateRankingService';
import { extractResults } from '../../../services/api';
import { useLanguage } from '../../../context/LanguageContext';
import './CandidateRanking.css';

const STAGE_TABS = [
  { id: 'ALL', labelKey: 'company.allApplicants', defaultLabel: 'All Applicants' },
  { id: 'SHORTLISTED', labelKey: 'company.shortlisted', defaultLabel: 'Shortlisted' },
  { id: 'APPLIED', labelKey: 'company.applied', defaultLabel: 'Applied' },
  { id: 'REVIEWING', labelKey: 'company.inReview', defaultLabel: 'Reviewing' },
  { id: 'INTERVIEW', labelKey: 'company.interview', defaultLabel: 'Interview' },
  { id: 'OFFERED', labelKey: 'company.offered', defaultLabel: 'Offered' },
  { id: 'HIRED', labelKey: 'company.totalHired', defaultLabel: 'Hired' },
  { id: 'REJECTED', labelKey: 'company.rejected', defaultLabel: 'Rejected' },
];

export default function CandidateRanking() {
  const { t } = useLanguage();

  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [jobData, setJobData] = useState(null);
  const [stats, setStats] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('ALL');
  const [minScoreFilter, setMinScoreFilter] = useState('ALL');
  const [sortOrder, setSortOrder] = useState('-match_score');
  const [showChart, setShowChart] = useState(false);

  // Modals & Drawers
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [comparisonData, setComparisonData] = useState(null);
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const [compareLoading, setCompareLoading] = useState(false);
  const [selectedForComparison, setSelectedForComparison] = useState([]);

  // Recruiter Note modal/section
  const [notesModalCandidate, setNotesModalCandidate] = useState(null);
  const [newNoteText, setNewNoteText] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);

  // Interview scheduling modal
  const [interviewModalOpen, setInterviewModalOpen] = useState(false);
  const [interviewCandidate, setInterviewCandidate] = useState(null);
  const [interviewDateTime, setInterviewDateTime] = useState('');
  const [interviewLocation, setInterviewLocation] = useState('');
  const [interviewMeetingLink, setInterviewMeetingLink] = useState('');
  const [interviewSubmitting, setInterviewSubmitting] = useState(false);

  // Status Change Confirmation modal
  const [confirmModalData, setConfirmModalData] = useState(null);

  // 1. Load company's jobs
  useEffect(() => {
    getJobs()
      .then((res) => {
        const list = extractResults(res);
        setJobs(list);
        if (list.length > 0) {
          setSelectedJobId(list[0].id);
        } else {
          setLoading(false);
        }
      })
      .catch((err) => {
        setError(err.response?.data?.detail || 'Failed to load company vacancies.');
        setLoading(false);
      });
  }, []);

  // 2. Fetch rankings for selected job
  const loadRankings = useCallback(
    async (isRefresh = false) => {
      if (!selectedJobId) return;
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError('');
      try {
        const params = {
          ordering: sortOrder,
        };
        if (activeTab !== 'ALL') {
          params.status = activeTab;
        }
        if (minScoreFilter !== 'ALL') {
          params.min_score = minScoreFilter;
        }
        if (searchQuery.trim()) {
          params.search = searchQuery.trim();
        }
        if (isRefresh) {
          params.refresh = 'true';
        }

        const res = await getJobRankings(selectedJobId, params);
        setJobData(res.data.job);
        setStats(res.data.stats);
        setApplicants(res.data.results || []);
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to load applicant rankings.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [selectedJobId, activeTab, minScoreFilter, sortOrder, searchQuery]
  );

  useEffect(() => {
    if (selectedJobId) {
      loadRankings();
    }
  }, [loadRankings, selectedJobId]);

  // Handle re-rank action
  const handleRefresh = async () => {
    if (!selectedJobId) return;
    setRefreshing(true);
    setError('');
    setSuccessMsg('');
    try {
      await refreshJobRankings(selectedJobId);
      setSuccessMsg('Candidate rankings refreshed with latest qualification assessment.');
      await loadRankings(true);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to refresh rankings.');
      setRefreshing(false);
    }
  };

  // 1-Click Shortlist toggle
  const handleToggleShortlist = async (appId) => {
    try {
      const res = await toggleShortlist(appId);
      const newStatus = res.data.status;
      setApplicants((prev) =>
        prev.map((app) => (app.id === appId ? { ...app, status: newStatus } : app))
      );
      if (selectedCandidate && selectedCandidate.id === appId) {
        setSelectedCandidate((prev) => ({ ...prev, status: newStatus }));
      }
      setSuccessMsg(res.data.message);
      if (stats) {
        const diff = newStatus === 'SHORTLISTED' ? 1 : -1;
        setStats((prev) => ({ ...prev, shortlisted_count: Math.max(0, prev.shortlisted_count + diff) }));
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to toggle shortlist.');
    }
  };

  // Status change handler (with confirmation modal for consequential statuses)
  const initiateStatusChange = (app, nextStatus) => {
    if (nextStatus === 'REJECTED' || nextStatus === 'OFFERED') {
      setConfirmModalData({ app, nextStatus });
    } else {
      executeStatusChange(app.id, nextStatus);
    }
  };

  const executeStatusChange = async (appId, nextStatus) => {
    try {
      await updateApplicationStatus(appId, nextStatus);
      setApplicants((prev) =>
        prev.map((app) => (app.id === appId ? { ...app, status: nextStatus } : app))
      );
      if (selectedCandidate && selectedCandidate.id === appId) {
        setSelectedCandidate((prev) => ({ ...prev, status: nextStatus }));
      }
      setSuccessMsg(`Status updated to ${nextStatus}.`);
      setConfirmModalData(null);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update candidate status.');
    }
  };

  // Recruiter Notes handler
  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!notesModalCandidate || !newNoteText.trim()) return;
    setSubmittingNote(true);
    try {
      const res = await addRecruiterNote(notesModalCandidate.id, newNoteText.trim());
      const createdNote = res.data;
      // Update local state
      setApplicants((prev) =>
        prev.map((app) =>
          app.id === notesModalCandidate.id
            ? { ...app, notes: [...(app.notes || []), createdNote] }
            : app
        )
      );
      if (selectedCandidate && selectedCandidate.id === notesModalCandidate.id) {
        setSelectedCandidate((prev) => ({
          ...prev,
          notes: [...(prev.notes || []), createdNote],
        }));
      }
      setNewNoteText('');
      setSuccessMsg('Recruiter evaluation note added successfully.');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to add recruiter note.');
    } finally {
      setSubmittingNote(false);
    }
  };

  // Comparison toggle
  const toggleSelectForComparison = (appId) => {
    setSelectedForComparison((prev) => {
      if (prev.includes(appId)) {
        return prev.filter((id) => id !== appId);
      }
      if (prev.length >= 4) {
        alert('You can compare a maximum of 4 candidates at once.');
        return prev;
      }
      return [...prev, appId];
    });
  };

  // Run Side-by-Side Comparison
  const handleOpenComparison = async () => {
    if (selectedForComparison.length < 2) {
      alert('Please select at least 2 candidates to compare side-by-side.');
      return;
    }
    setCompareLoading(true);
    setCompareModalOpen(true);
    setError('');
    try {
      const res = await compareCandidates(selectedForComparison);
      setComparisonData(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to generate candidate comparison.');
      setCompareModalOpen(false);
    } finally {
      setCompareLoading(false);
    }
  };

  // Open Interview Scheduler
  const openScheduleModal = (app) => {
    setInterviewCandidate(app);
    setInterviewDateTime('');
    setInterviewLocation('');
    setInterviewMeetingLink('');
    setInterviewModalOpen(true);
  };

  // Submit Interview
  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    if (!interviewCandidate || !interviewDateTime) return;
    setInterviewSubmitting(true);
    try {
      await scheduleInterview({
        application: interviewCandidate.id,
        scheduled_at: new Date(interviewDateTime).toISOString(),
        location: interviewLocation,
        meeting_link: interviewMeetingLink,
      });
      setSuccessMsg(`Interview scheduled with ${getCandidateName(interviewCandidate)}.`);
      setInterviewModalOpen(false);
      setApplicants((prev) =>
        prev.map((app) => (app.id === interviewCandidate.id ? { ...app, status: 'INTERVIEW' } : app))
      );
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to schedule interview.');
    } finally {
      setInterviewSubmitting(false);
    }
  };

  const getCandidateName = (app) => {
    if (!app) return 'Candidate';
    const candUser = app.candidate_details?.user || {};
    return (
      [candUser.first_name, candUser.last_name].filter(Boolean).join(' ') ||
      candUser.username ||
      `Applicant #${app.id}`
    );
  };

  const getScoreColorClass = (score) => {
    if (score >= 80) return 'score-high';
    if (score >= 60) return 'score-good';
    if (score >= 40) return 'score-moderate';
    return 'score-low';
  };

  const getScoreTierLabel = (score, status) => {
    if (status === 'MANUAL_REVIEW') return 'Manual Review Required';
    if (score >= 80) return 'Strong Match (Top Tier)';
    if (score >= 60) return 'Good Match';
    if (score >= 40) return 'Moderate Match';
    return 'Low Match / Needs Review';
  };

  // Chart distribution data calculation
  const distributionData = useMemo(() => {
    const buckets = [
      { range: '80-100%', label: 'Top Match', count: 0, color: '#16a34a' },
      { range: '60-79%', label: 'Good Match', count: 0, color: '#638ECB' },
      { range: '40-59%', label: 'Moderate', count: 0, count: 0, color: '#d97706' },
      { range: '< 40%', label: 'Review', count: 0, color: '#64748b' },
    ];
    applicants.forEach((app) => {
      const s = app.ranking?.match_score || 0;
      if (s >= 80) buckets[0].count += 1;
      else if (s >= 60) buckets[1].count += 1;
      else if (s >= 40) buckets[2].count += 1;
      else buckets[3].count += 1;
    });
    return buckets;
  }, [applicants]);

  return (
    <div className="candidate-ranking-container">
      {/* Header */}
      <div className="ranking-header">
        <div className="ranking-title-group">
          <div className="badge-ai-pill">
            <Sparkles size={14} className="sparkle-icon" />{' '}
            {t('company.candidateRankingNav', 'AI Candidate Ranking')}
          </div>
          <h1 className="ranking-main-title">
            {t('company.candidateRankingTitle', 'AI Candidate Ranking & Shortlisting')}
          </h1>
          <p className="ranking-subtitle">
            {t(
              'company.candidateRankingSubtitle',
              'Evaluate applicants objectively against vacancy requirements. Prioritize candidate review with explainable AI matching while keeping hiring decisions strictly under your control.'
            )}
          </p>
        </div>

        <div className="ranking-header-actions">
          {/* Job Vacancy Selector */}
          <div className="job-selector-wrapper">
            <label htmlFor="job-select" className="job-select-label">
              <Briefcase size={14} /> {t('company.selectVacancy', 'Job Vacancy:')}
            </label>
            <select
              id="job-select"
              value={selectedJobId || ''}
              onChange={(e) => setSelectedJobId(Number(e.target.value))}
              className="job-dropdown-select"
            >
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title} ({j.status})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing || !selectedJobId}
            className="btn-refresh-ranking"
            title="Re-run AI ranking analysis across all candidates"
          >
            <RefreshCw size={16} className={refreshing ? 'spin-icon' : ''} />
            <span>
              {refreshing
                ? t('company.analyzing', 'Analyzing...')
                : t('company.refreshRankings', 'Refresh AI Rankings')}
            </span>
          </button>

          <button
            onClick={() => setShowChart((prev) => !prev)}
            className={`btn-chart-toggle ${showChart ? 'active' : ''}`}
            title="Toggle candidate match score distribution visual summary"
          >
            <BarChart2 size={16} />
            <span>{showChart ? 'Hide Summary' : 'Score Distribution'}</span>
          </button>

          {selectedForComparison.length >= 2 && (
            <button
              onClick={handleOpenComparison}
              className="btn-compare-active animate-pulse"
            >
              <Layers size={16} />
              <span>
                {t('company.compareSelected', { count: selectedForComparison.length }) ||
                  `Compare Selected (${selectedForComparison.length})`}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Vacancy Requirements Banner */}
      {jobData && (
        <div className="vacancy-spec-banner">
          <div className="vacancy-spec-info">
            <div className="vacancy-meta-badge">
              <Briefcase size={13} /> {jobData.title} • {jobData.employment_type} • {jobData.workplace_type} ({jobData.location || 'Phnom Penh'})
            </div>
            <div className="spec-skills-cluster">
              {jobData.required_skills && jobData.required_skills.length > 0 && (
                <div className="spec-group">
                  <span className="spec-label-req">{t('company.requiredSkills', 'Required Skills')}:</span>
                  {jobData.required_skills.map((s, idx) => (
                    <span key={idx} className="spec-pill spec-pill-req">
                      {s}
                    </span>
                  ))}
                </div>
              )}
              {jobData.preferred_skills && jobData.preferred_skills.length > 0 && (
                <div className="spec-group">
                  <span className="spec-label-pref">{t('company.preferredSkills', 'Preferred Skills')}:</span>
                  {jobData.preferred_skills.map((s, idx) => (
                    <span key={idx} className="spec-pill spec-pill-pref">
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Notifications */}
      {error && (
        <div className="ranking-alert alert-error">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button onClick={() => setError('')} className="btn-alert-close">
            <X size={14} />
          </button>
        </div>
      )}
      {successMsg && (
        <div className="ranking-alert alert-success">
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg('')} className="btn-alert-close">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Analytics Statistics Bar */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon-wrapper icon-blue">
              <Users size={22} />
            </div>
            <div className="stat-info">
              <span className="stat-label">{t('company.totalApplicants', 'Total Applicants')}</span>
              <span className="stat-value">{stats.total_applicants}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper icon-primary-blue">
              <TrendingUp size={22} />
            </div>
            <div className="stat-info">
              <span className="stat-label">{t('company.averageScore', 'Average Match Score')}</span>
              <span className="stat-value">{stats.average_score}%</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper icon-green">
              <Award size={22} />
            </div>
            <div className="stat-info">
              <span className="stat-label">{t('company.highestMatch', 'Highest Match')}</span>
              <span className="stat-value">{stats.top_score}%</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper icon-gold">
              <Star size={22} />
            </div>
            <div className="stat-info">
              <span className="stat-label">{t('company.shortlisted', 'Shortlisted')}</span>
              <span className="stat-value">{stats.shortlisted_count}</span>
            </div>
          </div>
        </div>
      )}

      {/* Visual Summary: Match Score Distribution (Recharts) */}
      {showChart && (
        <div className="distribution-chart-card">
          <div className="chart-card-header">
            <h3 className="chart-title">
              <BarChart2 size={18} className="text-primary-blue" />{' '}
              {t('company.scoreDistribution', 'Candidate Match Score Distribution')}
            </h3>
            <span className="chart-subtitle">
              Visual overview of candidate suitability across score tiers for {jobData?.title}
            </span>
          </div>
          <div className="chart-render-wrapper">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={distributionData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                <XAxis dataKey="range" stroke="var(--cl-text-muted, #64748b)" fontSize={12} />
                <YAxis allowDecimals={false} stroke="var(--cl-text-muted, #64748b)" fontSize={12} />
                <Tooltip
                  formatter={(val, name, item) => [`${val} candidate(s)`, item.payload.label]}
                  contentStyle={{
                    backgroundColor: 'var(--cl-card-bg, #ffffff)',
                    borderColor: 'var(--cl-border, #e2e8f0)',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: 'var(--cl-text, #0f172a)',
                  }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Queue Controls & Filters */}
      <div className="queue-controls-card">
        {/* Stage Tabs */}
        <div className="stage-tabs-row">
          {STAGE_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`stage-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            >
              {t(tab.labelKey, tab.defaultLabel)}
              {tab.id === 'SHORTLISTED' && stats?.shortlisted_count > 0 && (
                <span className="tab-counter-badge">{stats.shortlisted_count}</span>
              )}
            </button>
          ))}
        </div>

        {/* Search & Sort Toolbar */}
        <div className="controls-toolbar">
          <div className="search-input-wrapper">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder={t('company.searchPlaceholder', 'Search applicant by name, email, or role...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ranking-search-field"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="btn-search-clear">
                <X size={14} />
              </button>
            )}
          </div>

          <div className="toolbar-filters">
            <div className="filter-select-wrapper">
              <Filter size={14} className="filter-icon" />
              <select
                value={minScoreFilter}
                onChange={(e) => setMinScoreFilter(e.target.value)}
                className="filter-dropdown"
              >
                <option value="ALL">{t('company.allScores', 'All Match Scores')}</option>
                <option value="80">{t('company.topMatch', '80%+ (Top Match)')}</option>
                <option value="60">{t('company.goodMatch', '60%+ (Good Match)')}</option>
                <option value="40">{t('company.moderateMatch', '40%+ (Moderate Match)')}</option>
              </select>
            </div>

            <div className="filter-select-wrapper">
              <ArrowUpDown size={14} className="filter-icon" />
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="filter-dropdown"
              >
                <option value="-match_score">{t('company.sortHighest', 'Highest Match Score')}</option>
                <option value="match_score">{t('company.sortLowest', 'Lowest Match Score')}</option>
                <option value="-applied_at">{t('company.sortNewest', 'Newest Application')}</option>
                <option value="applied_at">{t('company.sortOldest', 'Oldest Application')}</option>
                <option value="candidate_name">{t('company.sortName', 'Candidate Name (A-Z)')}</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Applicant Queue */}
      <div className="applicant-queue-section">
        {loading ? (
          <div className="ranking-loading-state">
            <RefreshCw size={36} className="spin-icon text-primary-blue" />
            <p>{t('company.analyzing', 'Analyzing and ranking candidates for this vacancy...')}</p>
          </div>
        ) : applicants.length === 0 ? (
          <div className="ranking-empty-state">
            <div className="empty-icon-circle">
              <Users size={36} />
            </div>
            <h3>{t('company.noApplicants', 'No Applicants Found')}</h3>
            <p>
              {jobs.length === 0
                ? t('company.noJobsPrompt', 'No job postings yet. Create your first opening today!')
                : t(
                    'company.noApplicantsPrompt',
                    'No candidates match your current filter criteria or have applied to this vacancy yet.'
                  )}
            </p>
          </div>
        ) : (
          <div className="applicant-cards-list">
            {applicants.map((app, index) => {
              const ranking = app.ranking || {};
              const matchScore = ranking.match_score || 0;
              const breakdown = ranking.score_breakdown || {};
              const isShortlisted = app.status === 'SHORTLISTED';
              const isSelectedForComp = selectedForComparison.includes(app.id);
              const scoreClass = getScoreColorClass(matchScore);
              const candidateName = getCandidateName(app);
              const candDetails = app.candidate_details || {};
              const notesCount = (app.notes || []).length;
              const appliedDate = app.applied_at
                ? new Date(app.applied_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : 'Recently';

              const matchingReq = breakdown.matching_required_skills || [];
              const missingReq = breakdown.missing_required_skills || [];
              const matchingPref = breakdown.matching_preferred_skills || [];
              const missingPref = breakdown.missing_preferred_skills || [];

              return (
                <div
                  key={app.id}
                  className={`applicant-card ${isShortlisted ? 'shortlisted-border' : ''} ${
                    isSelectedForComp ? 'selected-for-compare' : ''
                  }`}
                >
                  {/* Left Column: Compare Checkbox, Rank, Candidate Bio */}
                  <div className="applicant-card-left">
                    <div className="card-selection-rank">
                      <input
                        type="checkbox"
                        checked={isSelectedForComp}
                        onChange={() => toggleSelectForComparison(app.id)}
                        className="compare-checkbox"
                        title="Select for side-by-side comparison"
                      />
                      <span
                        className={`rank-badge ${
                          index === 0 ? 'rank-1' : index === 1 ? 'rank-2' : index === 2 ? 'rank-3' : ''
                        }`}
                      >
                        #{index + 1}
                      </span>
                    </div>

                    <div className="candidate-primary-info">
                      <div className="candidate-title-line">
                        <h3 className="candidate-name-text">{candidateName}</h3>
                        <span className={`status-pill status-${app.status.toLowerCase()}`}>
                          {app.status}
                        </span>
                        {breakdown.completeness !== undefined && (
                          <span
                            className="completeness-badge"
                            title="Profile & CV completeness percentage"
                          >
                            {breakdown.completeness}% CV Profile
                          </span>
                        )}
                      </div>

                      <div className="candidate-meta-line">
                        {candDetails.university && (
                          <span className="candidate-meta-item">
                            <GraduationCap size={14} /> {candDetails.university}
                            {candDetails.major ? ` • ${candDetails.major}` : ''}
                          </span>
                        )}
                        <span className="candidate-meta-item">
                          <Calendar size={14} /> Applied {appliedDate}
                        </span>
                      </div>

                      {/* Required Skills vs Preferred Skills Tags */}
                      <div className="skills-tags-cluster">
                        {matchingReq.length > 0 && (
                          <div className="skill-tag-group">
                            <span className="skill-group-label text-req">Required:</span>
                            {matchingReq.map((skill, i) => (
                              <span key={i} className="skill-pill pill-match">
                                <Check size={11} /> {skill}
                              </span>
                            ))}
                          </div>
                        )}

                        {missingReq.length > 0 && (
                          <div className="skill-tag-group">
                            <span className="skill-group-label text-missing">Missing Req:</span>
                            {missingReq.slice(0, 3).map((skill, i) => (
                              <span key={i} className="skill-pill pill-missing-req">
                                <AlertCircle size={11} /> {skill}
                              </span>
                            ))}
                          </div>
                        )}

                        {matchingPref.length > 0 && (
                          <div className="skill-tag-group">
                            <span className="skill-group-label text-pref">Preferred:</span>
                            {matchingPref.map((skill, i) => (
                              <span key={i} className="skill-pill pill-pref">
                                <Star size={11} /> {skill}
                              </span>
                            ))}
                          </div>
                        )}

                        {missingPref.length > 0 && (
                          <div className="skill-tag-group">
                            <span className="skill-group-label text-missing">Unverified:</span>
                            {missingPref.slice(0, 2).map((skill, i) => (
                              <span key={i} className="skill-pill pill-missing">
                                <HelpCircle size={11} /> {skill}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Unverified note */}
                      {ranking.unverified_requirements && ranking.unverified_requirements.length > 0 && (
                        <div className="unverified-disclaimer-note">
                          <HelpCircle size={12} />
                          <span>
                            {ranking.unverified_requirements[0]} — missing evidence in CV does not indicate lack of ability; clarify during interview.
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Match Score Meter & Action Buttons */}
                  <div className="applicant-card-right">
                    {/* Job Match Score Meter */}
                    <div className="score-meter-box">
                      <div className={`score-circle ${scoreClass}`}>
                        <span className="score-number">{matchScore}</span>
                        <span className="score-percent">%</span>
                      </div>
                      <div className="score-details">
                        <span className="score-match-label">Job Match</span>
                        <span className={`score-tier-text ${scoreClass}`}>
                          {getScoreTierLabel(matchScore, ranking.analysis_status)}
                        </span>
                      </div>
                    </div>

                    {/* Quick Recruiter Actions */}
                    <div className="applicant-actions-cluster">
                      <button
                        onClick={() => handleToggleShortlist(app.id)}
                        className={`btn-shortlist-toggle ${isShortlisted ? 'is-shortlisted' : ''}`}
                        title={isShortlisted ? 'Remove from shortlist' : 'Add to shortlist'}
                      >
                        <Star size={16} fill={isShortlisted ? 'currentColor' : 'none'} />
                        <span>
                          {isShortlisted
                            ? t('company.shortlistedBtn', 'Shortlisted')
                            : t('company.shortlist', 'Shortlist')}
                        </span>
                      </button>

                      <button
                        onClick={() => setSelectedCandidate(app)}
                        className="btn-action-outline"
                        title="View explainable AI analysis and suggested questions"
                      >
                        <Sparkles size={15} />
                        <span>{t('company.matchAnalysis', 'Match Analysis')}</span>
                      </button>

                      {app.resume_url ? (
                        <a
                          href={app.resume_url}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-action-outline"
                          title="Open candidate's CV document"
                        >
                          <FileText size={15} />
                          <span>{t('company.viewCv', 'View CV')}</span>
                        </a>
                      ) : (
                        <button
                          disabled
                          className="btn-action-outline disabled"
                          title="No CV document attached"
                        >
                          <FileText size={15} />
                          <span>{t('company.noCv', 'No CV')}</span>
                        </button>
                      )}

                      <button
                        onClick={() => setNotesModalCandidate(app)}
                        className="btn-action-outline btn-notes"
                        title="View and add internal recruiter notes"
                      >
                        <MessageSquare size={15} />
                        <span>Notes {notesCount > 0 ? `(${notesCount})` : ''}</span>
                      </button>

                      <button
                        onClick={() => openScheduleModal(app)}
                        className="btn-action-primary"
                        title="Schedule an interview"
                      >
                        <Calendar size={15} />
                        <span>{t('company.schedule', 'Schedule')}</span>
                      </button>

                      {/* Status Selector Dropdown */}
                      <select
                        value={app.status}
                        onChange={(e) => initiateStatusChange(app, e.target.value)}
                        className="card-status-dropdown"
                      >
                        <option value="APPLIED">Applied</option>
                        <option value="REVIEWING">Reviewing</option>
                        <option value="SHORTLISTED">Shortlisted</option>
                        <option value="INTERVIEW">Interview</option>
                        <option value="OFFERED">Offered</option>
                        <option value="HIRED">Hired</option>
                        <option value="REJECTED">Rejected</option>
                      </select>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* =========================================================================
          MODAL: Detailed Match Analysis Modal
         ========================================================================= */}
      {selectedCandidate && (
        <div className="ranking-modal-overlay" onClick={() => setSelectedCandidate(null)}>
          <div
            className="ranking-modal-content modal-analysis-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="ranking-modal-header">
              <div className="modal-header-info">
                <div className="badge-ai-pill">
                  <Sparkles size={14} /> AI Talent Match Analysis
                </div>
                <h2>{getCandidateName(selectedCandidate)}</h2>
                <p className="modal-subtitle">
                  Applied for <strong>{jobData?.title || 'Job Vacancy'}</strong> • Score:{' '}
                  <strong>{selectedCandidate.ranking?.match_score || 0}/100</strong>
                </p>
              </div>
              <button
                onClick={() => setSelectedCandidate(null)}
                className="btn-modal-close"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="ranking-modal-body">
              {/* Score Breakdown Bars */}
              <div className="analysis-section">
                <h4 className="section-title">
                  <TrendingUp size={16} /> Objective Match Score Breakdown
                </h4>
                <div className="breakdown-bars-grid">
                  <div className="bar-item">
                    <div className="bar-labels">
                      <span>Technical & Soft Skills</span>
                      <span>
                        {selectedCandidate.ranking?.score_breakdown?.skills || 0} / 40 pts
                      </span>
                    </div>
                    <div className="bar-track">
                      <div
                        className="bar-fill fill-blue"
                        style={{
                          width: `${((selectedCandidate.ranking?.score_breakdown?.skills || 0) / 40) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="bar-item">
                    <div className="bar-labels">
                      <span>Experience & Role Alignment</span>
                      <span>
                        {selectedCandidate.ranking?.score_breakdown?.experience || 0} / 25 pts
                      </span>
                    </div>
                    <div className="bar-track">
                      <div
                        className="bar-fill fill-purple"
                        style={{
                          width: `${((selectedCandidate.ranking?.score_breakdown?.experience || 0) / 25) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="bar-item">
                    <div className="bar-labels">
                      <span>Academic Background</span>
                      <span>
                        {selectedCandidate.ranking?.score_breakdown?.education || 0} / 15 pts
                      </span>
                    </div>
                    <div className="bar-track">
                      <div
                        className="bar-fill fill-green"
                        style={{
                          width: `${((selectedCandidate.ranking?.score_breakdown?.education || 0) / 15) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="bar-item">
                    <div className="bar-labels">
                      <span>Projects & Practical Portfolio</span>
                      <span>
                        {selectedCandidate.ranking?.score_breakdown?.projects || 0} / 15 pts
                      </span>
                    </div>
                    <div className="bar-track">
                      <div
                        className="bar-fill fill-amber"
                        style={{
                          width: `${((selectedCandidate.ranking?.score_breakdown?.projects || 0) / 15) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="bar-item">
                    <div className="bar-labels">
                      <span>Certifications & Languages</span>
                      <span>
                        {selectedCandidate.ranking?.score_breakdown?.certifications || 0} / 5 pts
                      </span>
                    </div>
                    <div className="bar-track">
                      <div
                        className="bar-fill fill-teal"
                        style={{
                          width: `${((selectedCandidate.ranking?.score_breakdown?.certifications || 0) / 5) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Explainability Explanation */}
              <div className="analysis-section">
                <h4 className="section-title">
                  <Sparkles size={16} /> Explainable Assessment
                </h4>
                <div className="assessment-card-box">
                  <p className="assessment-text">
                    {selectedCandidate.ranking?.explanation ||
                      'Match score calculated based on qualification evidence, skills, and experience.'}
                  </p>
                </div>
              </div>

              {/* Strengths & Review Areas */}
              <div className="analysis-grid-two">
                <div className="analysis-box strengths-box">
                  <h4 className="box-header text-green">
                    <CheckCircle2 size={16} /> Demonstrated Strengths
                  </h4>
                  <ul className="analysis-list">
                    {(selectedCandidate.ranking?.strengths || []).map((str, idx) => (
                      <li key={idx}>{str}</li>
                    ))}
                  </ul>
                </div>

                <div className="analysis-box review-box">
                  <h4 className="box-header text-amber">
                    <AlertCircle size={16} /> Areas to Clarify in Interview
                  </h4>
                  <ul className="analysis-list">
                    {(selectedCandidate.ranking?.areas_for_review || []).map((area, idx) => (
                      <li key={idx}>{area}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Tailored Interview Questions */}
              {selectedCandidate.ranking?.suggested_interview_questions &&
                selectedCandidate.ranking.suggested_interview_questions.length > 0 && (
                  <div className="analysis-section">
                    <h4 className="section-title">
                      <HelpCircle size={16} /> Suggested Interview Questions
                    </h4>
                    <p className="section-subtitle">
                      Tailored specifically to this applicant&apos;s background and your vacancy requirements:
                    </p>
                    <div className="questions-card-list">
                      {selectedCandidate.ranking.suggested_interview_questions.map((q, i) => (
                        <div key={i} className="question-item">
                          <span className="question-number">Q{i + 1}</span>
                          <span className="question-text">{q}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>

            {/* Modal Footer */}
            <div className="ranking-modal-footer">
              <div className="footer-left">
                {selectedCandidate.resume_url && (
                  <a
                    href={selectedCandidate.resume_url}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-action-outline"
                  >
                    <ExternalLink size={15} /> Open CV File
                  </a>
                )}
              </div>
              <div className="footer-right">
                <button
                  onClick={() => handleToggleShortlist(selectedCandidate.id)}
                  className={`btn-shortlist-toggle ${
                    selectedCandidate.status === 'SHORTLISTED' ? 'is-shortlisted' : ''
                  }`}
                >
                  <Star size={16} fill={selectedCandidate.status === 'SHORTLISTED' ? 'currentColor' : 'none'} />
                  <span>
                    {selectedCandidate.status === 'SHORTLISTED' ? 'Shortlisted' : 'Shortlist Candidate'}
                  </span>
                </button>
                <button
                  onClick={() => {
                    openScheduleModal(selectedCandidate);
                    setSelectedCandidate(null);
                  }}
                  className="btn-action-primary"
                >
                  <Calendar size={15} /> Schedule Interview
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: Recruiter Notes Modal
         ========================================================================= */}
      {notesModalCandidate && (
        <div className="ranking-modal-overlay" onClick={() => setNotesModalCandidate(null)}>
          <div
            className="ranking-modal-content modal-schedule-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="ranking-modal-header">
              <div>
                <h2>{t('company.recruiterNotes', 'Recruiter Notes')}</h2>
                <p className="modal-subtitle">
                  For candidate <strong>{getCandidateName(notesModalCandidate)}</strong>
                </p>
              </div>
              <button onClick={() => setNotesModalCandidate(null)} className="btn-modal-close">
                <X size={18} />
              </button>
            </div>

            <div className="ranking-modal-body form-body">
              {/* Existing Notes List */}
              <div className="existing-notes-list">
                {(notesModalCandidate.notes || []).length === 0 ? (
                  <p className="empty-notes-hint">{t('company.noNotesYet', 'No recruiter notes yet.')}</p>
                ) : (
                  (notesModalCandidate.notes || []).map((n) => (
                    <div key={n.id} className="note-bubble">
                      <p className="note-text">{n.note}</p>
                      <span className="note-meta">
                        {n.author_name || 'Recruiter'} • {new Date(n.created_at).toLocaleString()}
                      </span>
                    </div>
                  ))
                )}
              </div>

              {/* Add Note Form */}
              <form onSubmit={handleAddNote} className="add-note-form">
                <div className="form-group">
                  <label htmlFor="note-input" className="form-label">
                    {t('company.addNote', 'Add New Note')}
                  </label>
                  <textarea
                    id="note-input"
                    rows={3}
                    placeholder={t('company.addNotePlaceholder', 'Write internal interview feedback or notes...')}
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    className="form-control"
                    required
                  />
                </div>
                <div className="form-actions-row">
                  <button
                    type="submit"
                    disabled={submittingNote || !newNoteText.trim()}
                    className="btn-action-primary"
                  >
                    <Plus size={14} /> {submittingNote ? 'Saving...' : t('company.saveNote', 'Save Note')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: Consequential Status Change Confirmation Modal
         ========================================================================= */}
      {confirmModalData && (
        <div className="ranking-modal-overlay" onClick={() => setConfirmModalData(null)}>
          <div
            className="ranking-modal-content modal-schedule-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="ranking-modal-header">
              <h2>{t('company.confirmStatusChange', 'Confirm Status Change')}</h2>
              <button onClick={() => setConfirmModalData(null)} className="btn-modal-close">
                <X size={18} />
              </button>
            </div>
            <div className="ranking-modal-body">
              <p>
                Are you sure you want to change <strong>{getCandidateName(confirmModalData.app)}</strong>&apos;s
                application status to <strong>{confirmModalData.nextStatus}</strong>?
              </p>
            </div>
            <div className="ranking-modal-footer">
              <button onClick={() => setConfirmModalData(null)} className="btn-action-outline">
                Cancel
              </button>
              <button
                onClick={() => executeStatusChange(confirmModalData.app.id, confirmModalData.nextStatus)}
                className="btn-action-primary"
              >
                Confirm Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: Side-by-Side Candidate Comparison Modal (2 to 4 Candidates)
         ========================================================================= */}
      {compareModalOpen && (
        <div className="ranking-modal-overlay" onClick={() => setCompareModalOpen(false)}>
          <div
            className="ranking-modal-content modal-comparison-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="ranking-modal-header">
              <div className="modal-header-info">
                <div className="badge-ai-pill">
                  <Layers size={14} /> Side-by-Side Applicant Comparison
                </div>
                <h2>Comparing Candidates for &apos;{comparisonData?.job_title || jobData?.title}&apos;</h2>
                <p className="modal-subtitle">
                  Objective comparison across {comparisonData?.candidates?.length || selectedForComparison.length} selected applicants.
                </p>
              </div>
              <button onClick={() => setCompareModalOpen(false)} className="btn-modal-close">
                <X size={20} />
              </button>
            </div>

            <div className="ranking-modal-body comparison-scroll-body">
              {compareLoading ? (
                <div className="ranking-loading-state">
                  <RefreshCw size={36} className="spin-icon text-primary-blue" />
                  <p>Comparing candidate qualifications...</p>
                </div>
              ) : comparisonData ? (
                <div
                  className="comparison-columns-grid"
                  style={{
                    gridTemplateColumns: `repeat(${comparisonData.candidates.length}, minmax(280px, 1fr))`,
                  }}
                >
                  {comparisonData.candidates.map((cand, idx) => (
                    <div key={cand.application_id} className="comparison-card">
                      {/* Card Header */}
                      <div className="comp-card-top">
                        <span className="comp-rank-badge">#{idx + 1}</span>
                        <h3 className="comp-candidate-name">{cand.candidate_name}</h3>
                        <span className={`status-pill status-${cand.status.toLowerCase()}`}>
                          {cand.status}
                        </span>
                        <div className={`comp-score-badge ${getScoreColorClass(cand.match_score)}`}>
                          {cand.match_score}% Match
                        </div>
                      </div>

                      {/* Score Breakdown */}
                      <div className="comp-section">
                        <span className="comp-section-title">Score Breakdown</span>
                        <div className="comp-mini-bars">
                          <div className="comp-mini-bar-row">
                            <span>Skills</span>
                            <span>{cand.score_breakdown?.skills || 0}/40</span>
                          </div>
                          <div className="comp-mini-bar-row">
                            <span>Experience</span>
                            <span>{cand.score_breakdown?.experience || 0}/25</span>
                          </div>
                          <div className="comp-mini-bar-row">
                            <span>Education</span>
                            <span>{cand.score_breakdown?.education || 0}/15</span>
                          </div>
                          <div className="comp-mini-bar-row">
                            <span>Projects</span>
                            <span>{cand.score_breakdown?.projects || 0}/15</span>
                          </div>
                          <div className="comp-mini-bar-row">
                            <span>Certifications</span>
                            <span>{cand.score_breakdown?.certifications || 0}/5</span>
                          </div>
                        </div>
                      </div>

                      {/* Matching Skills */}
                      <div className="comp-section">
                        <span className="comp-section-title">Matching Skills</span>
                        <div className="comp-pills-list">
                          {(cand.matching_skills || []).map((s, i) => (
                            <span key={i} className="skill-pill pill-match">
                              <Check size={11} /> {s}
                            </span>
                          ))}
                          {(!cand.matching_skills || cand.matching_skills.length === 0) && (
                            <span className="comp-empty-hint">None explicitly evidenced</span>
                          )}
                        </div>
                      </div>

                      {/* Missing / Unverified Skills */}
                      <div className="comp-section">
                        <span className="comp-section-title">Missing in CV</span>
                        <div className="comp-pills-list">
                          {(cand.missing_skills || []).map((s, i) => (
                            <span key={i} className="skill-pill pill-missing">
                              <HelpCircle size={11} /> {s}
                            </span>
                          ))}
                          {(!cand.missing_skills || cand.missing_skills.length === 0) && (
                            <span className="comp-empty-hint">All required skills mentioned</span>
                          )}
                        </div>
                      </div>

                      {/* Key Strengths */}
                      <div className="comp-section">
                        <span className="comp-section-title">Key Strengths</span>
                        <ul className="comp-bullet-list">
                          {(cand.strengths || []).map((st, i) => (
                            <li key={i}>{st}</li>
                          ))}
                        </ul>
                      </div>

                      {/* Areas for Review */}
                      <div className="comp-section">
                        <span className="comp-section-title">Areas to Verify</span>
                        <ul className="comp-bullet-list text-amber">
                          {(cand.areas_for_review || []).map((ar, i) => (
                            <li key={i}>{ar}</li>
                          ))}
                        </ul>
                      </div>

                      {/* Quick Action */}
                      <div className="comp-card-actions">
                        <button
                          onClick={() => handleToggleShortlist(cand.application_id)}
                          className={`btn-shortlist-toggle ${
                            cand.status === 'SHORTLISTED' ? 'is-shortlisted' : ''
                          }`}
                        >
                          <Star size={15} fill={cand.status === 'SHORTLISTED' ? 'currentColor' : 'none'} />
                          <span>{cand.status === 'SHORTLISTED' ? 'Shortlisted' : 'Shortlist'}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: Schedule Interview Modal
         ========================================================================= */}
      {interviewModalOpen && interviewCandidate && (
        <div className="ranking-modal-overlay" onClick={() => setInterviewModalOpen(false)}>
          <div
            className="ranking-modal-content modal-schedule-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="ranking-modal-header">
              <div>
                <h2>Schedule Interview</h2>
                <p className="modal-subtitle">
                  With <strong>{getCandidateName(interviewCandidate)}</strong> for{' '}
                  <strong>{jobData?.title || 'Job'}</strong>
                </p>
              </div>
              <button onClick={() => setInterviewModalOpen(false)} className="btn-modal-close">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleScheduleSubmit}>
              <div className="ranking-modal-body form-body">
                <div className="form-group">
                  <label htmlFor="interview-time" className="form-label">
                    Date & Time *
                  </label>
                  <input
                    id="interview-time"
                    type="datetime-local"
                    required
                    value={interviewDateTime}
                    onChange={(e) => setInterviewDateTime(e.target.value)}
                    className="form-control"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="interview-location" className="form-label">
                    Interview Location / Platform
                  </label>
                  <input
                    id="interview-location"
                    type="text"
                    placeholder="e.g. Office HQ (Room 4A) or Zoom / Google Meet"
                    value={interviewLocation}
                    onChange={(e) => setInterviewLocation(e.target.value)}
                    className="form-control"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="interview-link" className="form-label">
                    Meeting Link (Optional)
                  </label>
                  <input
                    id="interview-link"
                    type="url"
                    placeholder="https://meet.google.com/xyz-abc or Zoom URL"
                    value={interviewMeetingLink}
                    onChange={(e) => setInterviewMeetingLink(e.target.value)}
                    className="form-control"
                  />
                </div>
              </div>

              <div className="ranking-modal-footer">
                <button
                  type="button"
                  onClick={() => setInterviewModalOpen(false)}
                  className="btn-action-outline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={interviewSubmitting}
                  className="btn-action-primary"
                >
                  {interviewSubmitting ? 'Scheduling...' : 'Confirm Interview'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
