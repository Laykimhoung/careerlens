import api from "./api";

/**
 * Fetch weaknesses diagnosis & selectable improvement options.
 */
export const getImprovementDiagnosis = () =>
  api.get("/resumes/improvement/diagnosis/");

/**
 * Fetch personalized missing-information questionnaire based on actual gaps.
 */
export const getImprovementQuestionnaire = () =>
  api.get("/resumes/improvement/questionnaire/");

/**
 * Generate improved CV and create a new ResumeVersion record.
 * @param {Object} data - { selected_improvements, questionnaire_answers, template, target_role }
 */
export const generateImprovedCV = (data) =>
  api.post("/resumes/improvement/generate/", data);

/**
 * Get all versions/drafts for the candidate.
 */
export const getResumeVersions = () =>
  api.get("/resumes/improvement/versions/");

/**
 * Get a specific CV version by ID.
 */
export const getResumeVersionById = (id) =>
  api.get(`/resumes/improvement/versions/${id}/`);

/**
 * Update/save a draft version (content, title, template).
 */
export const updateResumeVersion = (id, data) =>
  api.patch(`/resumes/improvement/versions/${id}/`, data);

/**
 * Delete a CV version.
 */
export const deleteResumeVersion = (id) =>
  api.delete(`/resumes/improvement/versions/${id}/`);

/**
 * Candidate approves this version as their final active CV.
 */
export const approveResumeVersion = (id) =>
  api.post(`/resumes/improvement/versions/${id}/approve/`);

/**
 * Re-evaluate version with the Priority 1 scoring rubric.
 */
export const reanalyzeResumeVersion = (id) =>
  api.post(`/resumes/improvement/versions/${id}/reanalyze/`);

/**
 * Download version as a formatted Microsoft Word (.docx) document.
 */
export const exportResumeVersionDocx = async (id, filename = "My_Improved_CV.docx") => {
  const response = await api.get(`/resumes/improvement/versions/${id}/export-docx/`, {
    responseType: "blob",
  });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

/**
 * Priority 4: Usage tracking & summary
 */
export const getUsageSummary = () =>
  api.get("/resumes/usage/");

/**
 * Priority 4: Simulated plan upgrade or downgrade (FREE <-> PREMIUM)
 */
export const upgradeCandidatePlan = (action = "upgrade") =>
  api.post("/resumes/usage/upgrade/", { action });

/**
 * Priority 4: Restore a historical CV version as a new editable draft without consuming credits.
 */
export const restoreResumeVersion = (id) =>
  api.post(`/resumes/improvement/versions/${id}/restore/`);

