import api from "./api";

/**
 * Fetch AI job recommendations for the authenticated candidate.
 * @param {Object} params - { min_score, location, employment_type, search }
 */
export const getJobRecommendations = (params = {}) =>
  api.get("/recommendations/", { params });

/**
 * Recalculate job recommendations with updated preferences.
 * @param {Object} data - { target_role, preferred_location, preferred_employment_type, preferred_workplace_type }
 */
export const recalculateJobRecommendations = (data = {}) =>
  api.post("/recommendations/", data);
