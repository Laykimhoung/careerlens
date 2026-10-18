import api, { extractResults } from "./api";
import { normalizeJobRecord } from "./jobService";

export const getApplications = (params = {}) =>
  api.get("/applications/", { params });

export const getApplicationById = (id) =>
  api.get(`/applications/${id}/`);

export const createApplication = (data) =>
  api.post("/applications/", data);

export const updateApplication = (id, data) =>
  api.patch(`/applications/${id}/`, data);

export const deleteApplication = (id) =>
  api.delete(`/applications/${id}/`);

export const getApplicationHistory = (params = {}) =>
  api.get("/application-history/", { params });

export const getOffers = (params = {}) =>
  api.get("/offers/", { params });

export const getOfferById = (id) =>
  api.get(`/offers/${id}/`);

export const createOffer = (data) =>
  api.post("/offers/", data);

export const updateOffer = (id, data) =>
  api.patch(`/offers/${id}/`, data);

export const deleteOffer = (id) =>
  api.delete(`/offers/${id}/`);

export const getApplicationNotes = (params = {}) =>
  api.get("/application-notes/", { params });

export const createApplicationNote = (data) =>
  api.post("/application-notes/", data);

export const deleteApplicationNote = (id) =>
  api.delete(`/application-notes/${id}/`);

export const APPLICATION_STATUS_LABELS = {
  APPLIED: "Applied",
  REVIEWING: "Reviewing",
  INTERVIEW: "Interviewing",
  OFFERED: "Offered",
  REJECTED: "Rejected",
};

export function toBackendApplicationStatus(value) {
  if (!value) return "APPLIED";
  const upper = String(value).trim().toUpperCase();
  if (["APPLIED", "REVIEWING", "INTERVIEW", "OFFERED", "REJECTED"].includes(upper)) {
    return upper;
  }
  if (upper === "SCREENING" || upper === "SHORTLISTED" || upper === "UNDER REVIEW") {
    return "REVIEWING";
  }
  if (upper === "INTERVIEWING" || upper === "INTERVIEW SCHEDULED") {
    return "INTERVIEW";
  }
  if (upper === "OFFER RECEIVED" || upper === "HIRED" || upper === "ACCEPTED") {
    return "OFFERED";
  }
  return "APPLIED";
}

export function normalizeApplicationRecord(rawApp) {
  if (!rawApp) return null;
  const jobObj = normalizeJobRecord(rawApp.job_details || {});
  const candObj = rawApp.candidate_details || {};
  const candUser = candObj.user || {};
  const candidateName =
    [candUser.first_name, candUser.last_name].filter(Boolean).join(" ") ||
    candUser.username ||
    `Candidate #${rawApp.candidate || ""}`;
  const rawStatus = String(rawApp.status || "APPLIED").toUpperCase();
  const displayStatus = APPLICATION_STATUS_LABELS[rawStatus] || rawApp.status || "Applied";
  const candidateSkills = Array.isArray(candObj.skills)
    ? candObj.skills.map((s) => (typeof s === "string" ? s : s?.skill_name || "")).filter(Boolean)
    : [];

  return {
    ...rawApp,
    id: rawApp.id,
    jobId: rawApp.job_details?.id || rawApp.job_id || null,
    jobTitle: jobObj?.title || "Job Listing",
    company: jobObj?.companyName || "Unknown Company",
    companyName: jobObj?.companyName || "Unknown Company",
    companyId: jobObj?.companyId || null,
    location: jobObj?.location || "Phnom Penh, Cambodia",
    type: jobObj?.type || "Full-time",
    workMode: jobObj?.workMode || "On-site",
    salary: jobObj?.salary || "Competitive",
    jobDetails: jobObj,
    candidateId: candObj.id || rawApp.candidate,
    candidateUserId: candUser.id || null,
    candidateName,
    candidateEmail: candUser.email || "—",
    candidatePhone: candObj.phone || "—",
    candidateUniversity: candObj.university || "—",
    candidateMajor: candObj.major || "—",
    candidateGraduationYear: candObj.graduation_year || "—",
    candidateBio: candObj.bio || "",
    candidateResume: candObj.resume_file || null,
    candidateSkills,
    candidateDetails: candObj,
    rawStatus,
    status: displayStatus,
    appliedDate: rawApp.applied_at
      ? new Date(rawApp.applied_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "Recently",
    appliedAt: rawApp.applied_at ? String(rawApp.applied_at).slice(0, 10) : "",
    updatedAt: rawApp.updated_at ? String(rawApp.updated_at).slice(0, 10) : "",
  };
}

export async function fetchNormalizedApplications(params = {}) {
  const res = await getApplications(params);
  const list = extractResults(res);
  return list.map(normalizeApplicationRecord).filter(Boolean);
}