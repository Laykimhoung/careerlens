import api from './api';

/**
 * Fetches ranked applicants for a specific job vacancy.
 * @param {number|string} jobId
 * @param {object} params - { status, min_score, search, ordering, refresh }
 */
export const getJobRankings = (jobId, params = {}) =>
  api.get('/applications/ranking/', {
    params: {
      job_id: jobId,
      ...params,
    },
  });

/**
 * Forces AI re-analysis and re-ranking of all applicants for a job vacancy.
 * @param {number|string} jobId
 */
export const refreshJobRankings = (jobId) =>
  api.post('/applications/ranking/refresh/', { job_id: jobId });

/**
 * Compares 2 to 4 candidates side-by-side for a specific vacancy.
 * @param {number[]} applicationIds
 */
export const compareCandidates = (applicationIds) =>
  api.post('/applications/ranking/compare/', { application_ids: applicationIds });

/**
 * 1-Click shortlist toggle: switches between SHORTLISTED and REVIEWING.
 * @param {number|string} applicationId
 */
export const toggleShortlist = (applicationId) =>
  api.post(`/applications/${applicationId}/shortlist/`);

/**
 * Updates application status (e.g. APPLIED, REVIEWING, SHORTLISTED, INTERVIEW, OFFERED, HIRED, REJECTED).
 * @param {number|string} applicationId
 * @param {string} status
 * @param {string} [note]
 */
export const updateApplicationStatus = (applicationId, status, note = '') =>
  api.patch(`/applications/${applicationId}/`, { status, note });

/**
 * Adds an internal recruiter note to an application.
 * @param {number|string} applicationId
 * @param {string} note
 */
export const addRecruiterNote = (applicationId, note) =>
  api.post('/application-notes/', { application: applicationId, note });

/**
 * Schedules an interview for an applicant.
 * @param {object} data - { application, scheduled_at, location, meeting_link }
 */
export const scheduleInterview = (data) =>
  api.post('/interviews/', data);
