import api, { extractResults } from "./api";

export const getJobs = (params = {}) => api.get("/jobs/", { params });

export const getJobById = (id) => api.get(`/jobs/${id}/`);

export const createJob = (data) => api.post("/jobs/", data);

export const updateJob = (id, data) => api.patch(`/jobs/${id}/`, data);

export const deleteJob = (id) => api.delete(`/jobs/${id}/`);

export const getSkills = (params = {}) => api.get("/skills/", { params });

export const createSkill = (data) => api.post("/skills/", data);

export const updateSkill = (id, data) => api.patch(`/skills/${id}/`, data);

export const deleteSkill = (id) => api.delete(`/skills/${id}/`);

export const EMPLOYMENT_TYPE_LABELS = {
  FULL_TIME: "Full-time",
  PART_TIME: "Part-time",
  CONTRACT: "Contract",
  INTERNSHIP: "Internship",
};

export const WORKPLACE_TYPE_LABELS = {
  ON_SITE: "On-site",
  REMOTE: "Remote",
  HYBRID: "Hybrid",
};

export const JOB_STATUS_LABELS = {
  PUBLISHED: "Published",
  DRAFT: "Draft",
  CLOSED: "Closed",
};

export function toBackendEmploymentType(value) {
  if (!value) return "FULL_TIME";
  const upper = String(value).toUpperCase().replace(/[\s-]+/g, "_");
  if (["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP"].includes(upper)) {
    return upper;
  }
  return "FULL_TIME";
}

export function toBackendWorkplaceType(value) {
  if (!value) return "ON_SITE";
  const upper = String(value).toUpperCase().replace(/[\s-]+/g, "_");
  if (["ON_SITE", "REMOTE", "HYBRID"].includes(upper)) {
    return upper;
  }
  if (upper === "ONSITE") return "ON_SITE";
  return "ON_SITE";
}

export function toBackendJobStatus(value) {
  if (!value) return "PUBLISHED";
  const upper = String(value).toUpperCase();
  if (["PUBLISHED", "DRAFT", "CLOSED"].includes(upper)) return upper;
  if (upper === "ACTIVE") return "PUBLISHED";
  if (upper === "PAUSED") return "DRAFT";
  return "PUBLISHED";
}

export function formatSalaryRange(minVal, maxVal) {
  const min = Number(minVal);
  const max = Number(maxVal);
  if (!Number.isNaN(min) && min > 0 && !Number.isNaN(max) && max > 0) {
    return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
  }
  if (!Number.isNaN(min) && min > 0) {
    return `From $${min.toLocaleString()}`;
  }
  if (!Number.isNaN(max) && max > 0) {
    return `Up to $${max.toLocaleString()}`;
  }
  return "Competitive";
}

export function formatRelativeDate(isoString) {
  if (!isoString) return "Recently";
  const dt = new Date(isoString);
  if (Number.isNaN(dt.getTime())) return String(isoString).slice(0, 10);
  const diffMs = Date.now() - dt.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "1 day ago";
  if (diffDays < 7) return `${diffDays} days ago`;
  const weeks = Math.floor(diffDays / 7);
  if (weeks === 1) return "1 week ago";
  if (weeks < 5) return `${weeks} weeks ago`;
  return dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function normalizeJobRecord(rawJob) {
  if (!rawJob) return null;
  const companyObj =
    rawJob.company && typeof rawJob.company === "object"
      ? rawJob.company
      : rawJob.company_details || {};
  const companyName =
    companyObj.company_name || rawJob.company_name || rawJob.companyName || "Unknown Company";
  const rawSkillsSource =
    Array.isArray(rawJob.skills) && rawJob.skills.length > 0
      ? rawJob.skills
      : Array.isArray(rawJob.job_skills)
      ? rawJob.job_skills.map((js) => js?.skill?.name || js?.name || "")
      : [];
  const skillsList = rawSkillsSource
    .map((s) => (typeof s === "string" ? s : s?.skill_name || s?.name || ""))
    .filter(Boolean);
  const empLabel =
    EMPLOYMENT_TYPE_LABELS[rawJob.employment_type] || rawJob.employment_type || "Full-time";
  const workLabel =
    WORKPLACE_TYPE_LABELS[rawJob.workplace_type] || rawJob.workplace_type || "On-site";
  const statusLabel = JOB_STATUS_LABELS[rawJob.status] || rawJob.status || "Published";

  return {
    ...rawJob,
    id: rawJob.id,
    title: rawJob.title || "Untitled Position",
    company: companyName,
    companyName,
    companyId: companyObj.id || (typeof rawJob.company === "number" ? rawJob.company : null),
    companyProfile: companyObj,
    companyUserId: companyObj.user?.id || null,
    location: rawJob.location || companyObj.location || "Phnom Penh, Cambodia",
    type: empLabel,
    employment_type: rawJob.employment_type || "FULL_TIME",
    setup: workLabel,
    workMode: workLabel,
    workplace_type: rawJob.workplace_type || "ON_SITE",
    status: statusLabel,
    rawStatus: rawJob.status || "PUBLISHED",
    salary: formatSalaryRange(rawJob.salary_min, rawJob.salary_max),
    salary_min: rawJob.salary_min,
    salary_max: rawJob.salary_max,
    skills: skillsList,
    tags: skillsList.length > 0 ? skillsList : [empLabel, workLabel],
    posted: formatRelativeDate(rawJob.created_at),
    createdAt: rawJob.created_at ? String(rawJob.created_at).slice(0, 10) : "",
    deadline: rawJob.deadline
      ? String(rawJob.deadline).slice(0, 10)
      : "Rolling Deadline",
    rawDeadline: rawJob.deadline || null,
    description: rawJob.description || "",
  };
}

export async function fetchNormalizedJobs(params = {}) {
  const res = await getJobs(params);
  const list = extractResults(res);
  return list.map(normalizeJobRecord).filter(Boolean);
}