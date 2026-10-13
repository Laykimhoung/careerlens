import api, { extractResults } from "./api";
import { getMeApi } from "./authService";

export const getCandidates = (params = {}) => api.get("/auth/candidates/", { params });

export const getCandidateById = (id) => api.get(`/auth/candidates/${id}/`);

export const updateCandidateProfile = (id, data) =>
  api.patch(`/auth/candidates/${id}/`, data);

export const deleteCandidateProfile = (id) =>
  api.delete(`/auth/candidates/${id}/`);

export async function getCurrentCandidateProfile(userId = null) {
  let targetUserId = userId;
  if (!targetUserId) {
    const meRes = await getMeApi();
    targetUserId = meRes.data?.id;
  }
  const res = await getCandidates();
  const list = extractResults(res);
  const found = list.find((c) => Number(c.user?.id) === Number(targetUserId));
  return found || null;
}

export const getProfile = (userId = null) => getCurrentCandidateProfile(userId);

export function uploadCandidateResume(candidateId, file) {
  const formData = new FormData();
  formData.append("resume_file", file);
  return api.patch(`/auth/candidates/${candidateId}/`, formData);
}

export function deleteCandidateResume(candidateId) {
  return api.patch(`/auth/candidates/${candidateId}/`, { resume_file: null });
}

// ── Notifications & Messages (/api/notifications/, /api/messages/) ───────────

export const getNotifications = (params = {}) =>
  api.get("/notifications/", { params });

export const markNotificationRead = (id, isRead = true) =>
  api.patch(`/notifications/${id}/`, { is_read: isRead });

export const createNotification = (data) =>
  api.post("/notifications/", data);

export const deleteNotification = (id) =>
  api.delete(`/notifications/${id}/`);

export const getMessages = (params = {}) =>
  api.get("/messages/", { params });

export const sendMessageApi = (data) =>
  api.post("/messages/", data);

export const markMessageRead = (id, isRead = true) =>
  api.patch(`/messages/${id}/`, { is_read: isRead });

// ── Candidate Saved Jobs (/api/saved-jobs/ Backend Persistence) ─────────────

export const getSavedJobsApi = (params = {}) =>
  api.get("/saved-jobs/", { params });

export const createSavedJobApi = (jobId) =>
  api.post("/saved-jobs/", { job_id: Number(jobId) });

export const deleteSavedJobApi = (savedJobId) =>
  api.delete(`/saved-jobs/${savedJobId}/`);

export async function fetchSavedJobRecords() {
  try {
    const res = await getSavedJobsApi();
    return extractResults(res);
  } catch {
    return [];
  }
}

export async function toggleSavedJobBackend(jobId, currentSavedRecords = []) {
  const numericJobId = Number(jobId);
  const existing = currentSavedRecords.find(
    (rec) => Number(rec.job?.id || rec.job_id || rec.job) === numericJobId
  );
  if (existing) {
    await deleteSavedJobApi(existing.id);
    return currentSavedRecords.filter((rec) => rec.id !== existing.id);
  } else {
    const res = await createSavedJobApi(numericJobId);
    return [res.data, ...currentSavedRecords];
  }
}