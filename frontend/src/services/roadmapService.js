import api from "./api";

/**
 * Fetch candidate's active career roadmap.
 */
export const getCareerRoadmap = () =>
  api.get("/roadmap/");

/**
 * Generate or switch career roadmap for candidate.
 * @param {Object} data - { target_role, target_job_id, weekly_hours }
 */
export const generateCareerRoadmap = (data) =>
  api.post("/roadmap/generate/", data);

/**
 * Update milestone status (not_started, in_progress, completed) or personal notes.
 * @param {Object} data - { stage_id, milestone_id, status, notes }
 */
export const updateMilestoneProgress = (data) =>
  api.patch("/roadmap/milestones/", data);

/**
 * Update candidate's assessment of a skill in the gap list (gap, confirmed_know, learning, completed).
 * @param {Object} data - { skill_name, status }
 */
export const updateSkillStatus = (data) =>
  api.patch("/roadmap/skills/", data);

/**
 * Explicitly add a completed/verified skill to CandidateProfile with chosen proficiency.
 * @param {Object} data - { skill_name, proficiency }
 */
export const syncSkillToProfile = (data) =>
  api.post("/roadmap/sync-skill/", data);

/**
 * Recalculate skill gaps and readiness score based on latest profile and active CV.
 */
export const recalculateRoadmap = () =>
  api.post("/roadmap/recalculate/");

/**
 * Get popular target roles and active published job options for target selection.
 */
export const getRoadmapOptions = () =>
  api.get("/roadmap/options/");
