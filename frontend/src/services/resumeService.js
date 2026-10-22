import api from "./api";

/**
 * Upload a resume file (PDF or DOCX) with optional target role.
 */
export function uploadResume(file, targetRole = "", onUploadProgress = null) {
  const formData = new FormData();
  formData.append("file", file);
  if (targetRole) {
    formData.append("target_role", targetRole);
  }

  const config = {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  };
  if (onUploadProgress) {
    config.onUploadProgress = onUploadProgress;
  }

  return api.post("/resumes/upload/", formData, config);
}

/**
 * Fetch candidate's active resume and latest analysis.
 */
export function getLatestResume() {
  return api.get("/resumes/latest/");
}

/**
 * Fetch a specific resume by ID.
 */
export function getResumeById(id) {
  return api.get(`/resumes/${id}/`);
}

/**
 * Save candidate edits on the review screen before or after analysis.
 */
export function updateResumeParsedData(id, parsedData, targetRole = "") {
  const payload = {
    ...parsedData,
  };
  if (targetRole) {
    payload.target_role = targetRole;
  }
  return api.patch(`/resumes/${id}/parsed-data/`, payload);
}

/**
 * Trigger quality scoring analysis out of 10.
 */
export function analyzeResume(id, targetRole = "") {
  return api.post(`/resumes/${id}/analyze/`, { target_role: targetRole });
}

/**
 * Delete a resume.
 */
export function deleteResume(id) {
  return api.delete(`/resumes/${id}/`);
}
