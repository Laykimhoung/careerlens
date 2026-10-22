import api from "./api";

/**
 * Fetch candidate usage metrics (plan tier, analyses used, improvements used, limits, remaining credits).
 */
export const getUsageSummary = () =>
  api.get("/resumes/usage/");

/**
 * Simulated plan upgrade to Premium or downgrade to Free.
 */
export const upgradeCandidatePlan = (action = "upgrade") =>
  api.post("/resumes/usage/upgrade/", { action });

/**
 * Restore a historical CV version as a new draft.
 */
export const restoreResumeVersion = (id) =>
  api.post(`/resumes/improvement/versions/${id}/restore/`);
