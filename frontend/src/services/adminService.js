import api from "./api";

// ── Raw REST API Endpoints ──────────────────────────────────────────────────

export const getUsers = (params = {}) => api.get("/auth/users/", { params });
export const createUser = (data) => api.post("/auth/users/", data);
export const updateUser = (id, data) => api.patch(`/auth/users/${id}/`, data);
export const deleteUser = (id) => api.delete(`/auth/users/${id}/`);

export const getAdminDashboardStats = (params = {}) =>
  api.get("/auth/admin/dashboard/", { params });

export const getAdminCandidates = (params = {}) =>
  api.get("/auth/candidates/", { params });
export const updateAdminCandidate = (id, data) =>
  api.patch(`/auth/candidates/${id}/`, data);
export const deleteAdminCandidate = (id) =>
  api.delete(`/auth/candidates/${id}/`);

export const getAdminCompanies = (params = {}) =>
  api.get("/auth/companies/", { params });
export const updateAdminCompany = (id, data) =>
  api.patch(`/auth/companies/${id}/`, data);
export const deleteAdminCompany = (id) =>
  api.delete(`/auth/companies/${id}/`);

export const getAdminJobs = (params = {}) =>
  api.get("/jobs/", { params });
export const createAdminJob = (data) =>
  api.post("/jobs/", data);
export const updateAdminJob = (id, data) =>
  api.patch(`/jobs/${id}/`, data);
export const deleteAdminJob = (id) =>
  api.delete(`/jobs/${id}/`);

export const getAdminApplications = (params = {}) =>
  api.get("/applications/", { params });
export const updateAdminApplication = (id, data) =>
  api.patch(`/applications/${id}/`, data);
export const deleteAdminApplication = (id) =>
  api.delete(`/applications/${id}/`);

export const getAdminSkills = (params = {}) =>
  api.get("/skills/", { params });
export const createAdminSkill = (data) =>
  api.post("/skills/", data);
export const updateAdminSkill = (id, data) =>
  api.patch(`/skills/${id}/`, data);
export const deleteAdminSkill = (id) =>
  api.delete(`/skills/${id}/`);

export const getAdminAuditLogs = (params = {}) =>
  api.get("/auth/audit-logs/", { params });
export const createAdminAuditLog = (data) =>
  api.post("/auth/audit-logs/", data);

export const getAdminNotifications = (params = {}) =>
  api.get("/notifications/", { params });
export const createAdminNotification = (data) =>
  api.post("/notifications/", data);
export const updateAdminNotification = (id, data) =>
  api.patch(`/notifications/${id}/`, data);
export const deleteAdminNotification = (id) =>
  api.delete(`/notifications/${id}/`);

// ── Status & Date Normalization Helpers ─────────────────────────────────────

const JOB_STATUS_MAP = {
  PUBLISHED: "Published",
  DRAFT: "Draft",
  CLOSED: "Closed",
  Published: "Published",
  Draft: "Draft",
  Paused: "Paused",
  Rejected: "Rejected",
  Closed: "Closed",
};

const APP_STATUS_MAP = {
  APPLIED: "Applied",
  REVIEWING: "Reviewing",
  INTERVIEW: "Interviewing",
  OFFERED: "Offered",
  REJECTED: "Rejected",
  Applied: "Applied",
  Screening: "Screening",
  Shortlisted: "Shortlisted",
  Reviewing: "Reviewing",
  Interviewing: "Interviewing",
  Offered: "Offered",
  Rejected: "Rejected",
};

const VERIFICATION_STATUS_MAP = {
  VERIFIED: "Verified",
  PENDING: "Pending Verification",
  REJECTED: "Rejected",
  Verified: "Verified",
  "Pending Verification": "Pending Verification",
  Rejected: "Rejected",
  Suspended: "Suspended",
};

function toDateKey(rawDate) {
  if (!rawDate) return null;
  const str = String(rawDate).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    return str.slice(0, 10);
  }
  const parsed = new Date(str);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
}

function formatShortDate(dateKey) {
  if (!dateKey) return "—";
  const [y, m, d] = dateKey.split("-").map(Number);
  if (!y || !m || !d) return dateKey;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function isWithinRange(dateKey, range, referenceDate = new Date()) {
  if (range === "all") return true;
  if (!dateKey) return false;
  const recordTime = new Date(`${dateKey}T00:00:00Z`).getTime();
  if (Number.isNaN(recordTime)) return false;

  const daysMap = { "7d": 7, "30d": 30, "90d": 90 };
  const days = daysMap[range];
  if (!days) return true;

  const refKey = referenceDate.toISOString().slice(0, 10);
  const refTime = new Date(`${refKey}T23:59:59Z`).getTime();
  const cutoffTime = refTime - days * 24 * 60 * 60 * 1000;
  return recordTime >= cutoffTime && recordTime <= refTime;
}

function buildDailySeries(items, getDateFn, valueKey) {
  const datedCounts = {};
  items.forEach((item) => {
    const key = toDateKey(getDateFn(item));
    if (key) {
      datedCounts[key] = (datedCounts[key] || 0) + 1;
    }
  });

  const sortedKeys = Object.keys(datedCounts).sort();
  if (sortedKeys.length === 0) return [];

  const firstKey = sortedKeys[0];
  const lastKey = sortedKeys[sortedKeys.length - 1];
  const start = new Date(`${firstKey}T00:00:00Z`);
  const end = new Date(`${lastKey}T00:00:00Z`);
  const diffDays = Math.round((end - start) / (24 * 60 * 60 * 1000));

  // If the span is 31 days or fewer, fill calendar days so zero-activity days are accurately shown
  if (diffDays >= 0 && diffDays <= 31) {
    const series = [];
    const cursor = new Date(start);
    while (cursor <= end) {
      const key = cursor.toISOString().slice(0, 10);
      series.push({
        dateKey: key,
        label: formatShortDate(key),
        [valueKey]: datedCounts[key] || 0,
      });
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    return series;
  }

  // Otherwise return each distinct active date in chronological order
  return sortedKeys.map((key) => ({
    dateKey: key,
    label: formatShortDate(key),
    [valueKey]: datedCounts[key],
  }));
}

// ── Normalize Backend API Payload ───────────────────────────────────────────

export function normalizeApiRecords({ candidatesRaw, companiesRaw, jobsRaw, appsRaw, logsRaw }) {
  const candidates = (candidatesRaw || []).map((c) => {
    const u = c.user || {};
    const fullName = [u.first_name, u.last_name].filter(Boolean).join(" ") || u.username || "Unnamed Candidate";
    return {
      id: c.id,
      userId: u.id,
      username: u.username,
      name: fullName,
      email: u.email || "—",
      phone: c.phone || "—",
      university: c.university || "—",
      major: c.major || "—",
      graduationYear: c.graduation_year || "—",
      bio: c.bio || "",
      resumeFile: c.resume_file || null,
      skills: Array.isArray(c.skills) ? c.skills : [],
      status: u.is_active === false ? "Suspended" : "Active",
      createdAt: toDateKey(u.date_joined),
    };
  });

  const companies = (companiesRaw || []).map((co) => {
    const u = co.user || {};
    return {
      id: co.id,
      userId: u.id,
      username: u.username,
      name: co.company_name || u.username || "Unnamed Company",
      email: u.email || "—",
      industry: co.industry || "—",
      size: co.size || "—",
      location: co.location || "—",
      website: co.website || "",
      description: co.description || "",
      verificationStatus: VERIFICATION_STATUS_MAP[co.verification_status] || co.verification_status || "Pending Verification",
      rawVerificationStatus: co.verification_status || "PENDING",
      status: u.is_active === false ? "Suspended" : "Active",
      createdAt: toDateKey(u.date_joined),
    };
  });

  const jobs = (jobsRaw || []).map((j) => {
    const companyObj = j.company && typeof j.company === "object" ? j.company : j.company_details || {};
    return {
      id: j.id,
      title: j.title || "Untitled Job",
      companyName: companyObj.company_name || "Unknown Company",
      companyId: companyObj.id || (typeof j.company === "number" ? j.company : null),
      location: j.location || "—",
      type: j.employment_type || "—",
      workMode: j.workplace_type || "—",
      category: j.employment_type ? j.employment_type.replace("_", " ") : "General",
      status: JOB_STATUS_MAP[j.status] || j.status || "Draft",
      rawStatus: j.status || "DRAFT",
      salaryMin: j.salary_min,
      salaryMax: j.salary_max,
      deadline: j.deadline,
      description: j.description || "",
      skills: Array.isArray(j.skills) ? j.skills : [],
      createdAt: toDateKey(j.created_at),
    };
  });

  const applications = (appsRaw || []).map((a) => {
    const candUser = a.candidate_details?.user || {};
    const candName =
      [candUser.first_name, candUser.last_name].filter(Boolean).join(" ") ||
      candUser.username ||
      `Candidate #${a.candidate}`;
    const jobCompanyObj =
      a.job_details?.company && typeof a.job_details.company === "object"
        ? a.job_details.company
        : a.job_details?.company_details || {};
    return {
      id: a.id,
      jobId: a.job_details?.id || a.job_id,
      jobTitle: a.job_details?.title || "Job Listing",
      companyName: jobCompanyObj.company_name || "—",
      candidateId: a.candidate,
      candidateName: candName,
      candidateEmail: candUser.email || "—",
      status: APP_STATUS_MAP[a.status] || a.status || "Applied",
      rawStatus: a.status || "APPLIED",
      appliedAt: toDateKey(a.applied_at),
    };
  });

  const auditLogs = (logsRaw || []).map((l) => ({
    id: l.id,
    timestamp: l.created_at ? String(l.created_at).replace("T", " ").slice(0, 16) : "—",
    dateKey: toDateKey(l.created_at),
    actor: l.actor_username || "Admin",
    action: l.action || "EVENT",
    targetType: l.target_type || "",
    targetId: l.target_id,
    text: l.details || `${l.action} on ${l.target_type} #${l.target_id}`,
  }));

  return { candidates, companies, jobs, applications, auditLogs };
}

// ── Compute Dashboard KPIs, Distributions, Trends & Recent Lists ────────────

export function computeDashboardAnalytics(normalized, dateRange = "all") {
  const {
    candidates = [],
    companies = [],
    jobs = [],
    applications = [],
    auditLogs = [],
  } = normalized || {};

  // Filtered subsets for date-sensitive charts
  const filteredCandidates =
    dateRange === "all"
      ? candidates
      : candidates.filter((c) => isWithinRange(c.createdAt, dateRange));

  const filteredJobs =
    dateRange === "all"
      ? jobs
      : jobs.filter((j) => isWithinRange(j.createdAt, dateRange));

  const filteredApplications =
    dateRange === "all"
      ? applications
      : applications.filter((a) => isWithinRange(a.appliedAt, dateRange));

  // 1. KPI Totals (Platform-wide totals + filtered context)
  const totalCandidates = candidates.length;
  const activeCandidates = candidates.filter((c) => c.status === "Active").length;

  const totalCompanies = companies.length;
  const verifiedCompanies = companies.filter((c) => c.verificationStatus === "Verified").length;
  const pendingVerifications = companies.filter(
    (c) => c.verificationStatus === "Pending Verification"
  ).length;

  const totalJobs = jobs.length;
  const activeJobs = jobs.filter((j) => j.status === "Published").length;
  const nonActiveJobs = totalJobs - activeJobs;

  const totalApplications = applications.length;
  const interviewsCount = applications.filter(
    (a) => a.status === "Interviewing" || a.status === "INTERVIEW"
  ).length;
  const hiresCount = applications.filter(
    (a) => a.status === "Offered" || a.status === "OFFERED" || a.status === "Hired" || a.status === "Accepted"
  ).length;
  const pendingReviewStatuses = new Set(["Applied", "Reviewing", "Screening"]);
  const pendingApplications = applications.filter((a) =>
    pendingReviewStatuses.has(a.status)
  ).length;
  const pendingReviewsTotal = pendingApplications + pendingVerifications;

  // Overview Bar Chart Data (matching the 6 platform KPI categories)
  const overviewBarData = [
    { name: "Students", value: totalCandidates, color: "#084C41" },
    { name: "Companies", value: totalCompanies, color: "#2B70F6" },
    { name: "Jobs", value: totalJobs, color: "#0095EB" },
    { name: "Applications", value: totalApplications, color: "#F59E0B" },
    { name: "Interviews", value: interviewsCount, color: "#7C3AED" },
    { name: "Hires", value: hiresCount, color: "#10B981" },
  ];

  // 2. Application Trends (Line / Area Chart)
  const applicationTrends = buildDailySeries(
    filteredApplications,
    (a) => a.appliedAt,
    "applications"
  );

  // 3. Application Status Distribution (Doughnut Chart)
  const appStatusOrder = [
    "Applied",
    "Screening",
    "Reviewing",
    "Shortlisted",
    "Interviewing",
    "Offered",
    "Rejected",
  ];
  const appStatusCounts = {};
  filteredApplications.forEach((a) => {
    const st = a.status || "Applied";
    appStatusCounts[st] = (appStatusCounts[st] || 0) + 1;
  });

  const appTotalForPct = filteredApplications.length;
  const applicationStatusDistribution = Object.entries(appStatusCounts)
    .sort((a, b) => {
      const idxA = appStatusOrder.indexOf(a[0]);
      const idxB = appStatusOrder.indexOf(b[0]);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      return b[1] - a[1];
    })
    .map(([name, value]) => ({
      name,
      value,
      percentage: appTotalForPct > 0 ? Math.round((value / appTotalForPct) * 100) : 0,
    }));

  // 4. Job Posting Status Distribution (Doughnut Chart)
  const jobStatusCounts = {};
  filteredJobs.forEach((j) => {
    const st = j.status || "Published";
    jobStatusCounts[st] = (jobStatusCounts[st] || 0) + 1;
  });
  const jobTotalForPct = filteredJobs.length;
  const jobStatusDistribution = Object.entries(jobStatusCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({
      name,
      value,
      percentage: jobTotalForPct > 0 ? Math.round((value / jobTotalForPct) * 100) : 0,
    }));

  // 5. Candidate Registration Trends (Bar Chart)
  const candidateRegistrationTrends = buildDailySeries(
    filteredCandidates,
    (c) => c.createdAt,
    "registrations"
  );

  // 6. Top Companies / Most Active Recruitment (Bar Chart)
  const companyStatsMap = {};
  companies.forEach((co) => {
    companyStatsMap[co.name] = {
      company: co.name,
      verificationStatus: co.verificationStatus,
      jobs: 0,
      applications: 0,
    };
  });

  filteredJobs.forEach((j) => {
    const name = j.companyName || "Unknown Company";
    if (!companyStatsMap[name]) {
      companyStatsMap[name] = {
        company: name,
        verificationStatus: "Verified",
        jobs: 0,
        applications: 0,
      };
    }
    companyStatsMap[name].jobs += 1;
  });

  filteredApplications.forEach((a) => {
    const name = a.companyName;
    if (name && name !== "—") {
      if (!companyStatsMap[name]) {
        companyStatsMap[name] = {
          company: name,
          verificationStatus: "Verified",
          jobs: 0,
          applications: 0,
        };
      }
      companyStatsMap[name].applications += 1;
    }
  });

  const topCompanies = Object.values(companyStatsMap)
    .filter((item) => item.jobs > 0 || item.applications > 0 || companies.length <= 5)
    .sort((a, b) => b.jobs - a.jobs || b.applications - a.applications)
    .slice(0, 6);

  // 7. Recent Activity Lists (sorted newest first)
  const sortByDateDesc = (arr, key) =>
    [...arr].sort((a, b) => {
      const da = a[key] || "";
      const db = b[key] || "";
      return db.localeCompare(da);
    });

  const recentCandidates = sortByDateDesc(candidates, "createdAt").slice(0, 5);
  const recentJobs = sortByDateDesc(jobs, "createdAt").slice(0, 5);
  const recentApplications = sortByDateDesc(applications, "appliedAt").slice(0, 5);
  const recentAuditLogs = [...auditLogs].slice(0, 8);

  return {
    kpis: {
      totalCandidates,
      activeCandidates,
      filteredCandidatesCount: filteredCandidates.length,
      totalCompanies,
      verifiedCompanies,
      pendingVerifications,
      totalJobs,
      activeJobs,
      nonActiveJobs,
      filteredJobsCount: filteredJobs.length,
      totalApplications,
      filteredApplicationsCount: filteredApplications.length,
      interviewsCount,
      hiresCount,
      pendingApplications,
      pendingReviewsTotal,
    },
    charts: {
      overviewBarData,
      applicationTrends,
      applicationStatusDistribution,
      jobStatusDistribution,
      candidateRegistrationTrends,
      topCompanies,
    },
    recent: {
      candidates: recentCandidates,
      jobs: recentJobs,
      applications: recentApplications,
      auditLogs: recentAuditLogs,
    },
  };
}

// ── Main Dashboard Data Loader (Real Backend API) ───────────────────────────

export async function fetchAdminDashboardData({ dateRange = "all" } = {}) {
  const requests = [
    { key: "candidates", label: "Candidates", fn: () => getAdminCandidates() },
    { key: "companies", label: "Companies", fn: () => getAdminCompanies() },
    { key: "jobs", label: "Jobs", fn: () => getAdminJobs() },
    { key: "applications", label: "Applications", fn: () => getAdminApplications() },
    { key: "auditLogs", label: "Audit Logs", fn: () => getAdminAuditLogs() },
  ];

  const results = await Promise.allSettled(requests.map((r) => r.fn()));
  const partialErrors = [];
  const payload = {};
  let successCount = 0;

  results.forEach((res, index) => {
    const { key, label } = requests[index];
    if (res.status === "fulfilled") {
      successCount += 1;
      const raw = res.value?.data;
      payload[key] = Array.isArray(raw) ? raw : Array.isArray(raw?.results) ? raw.results : [];
    } else {
      payload[key] = [];
      partialErrors.push(`${label} endpoint unavailable`);
    }
  });

  if (successCount === 0) {
    throw new Error(
      "Unable to load dashboard metrics from the server. Please verify that the backend API is running and try again."
    );
  }

  const normalized = normalizeApiRecords({
    candidatesRaw: payload.candidates,
    companiesRaw: payload.companies,
    jobsRaw: payload.jobs,
    appsRaw: payload.applications,
    logsRaw: payload.auditLogs,
  });

  return {
    source: "api",
    partialErrors,
    normalized,
    sectionAvailability: {
      candidates: !partialErrors.some((e) => e.startsWith("Candidates")),
      companies: !partialErrors.some((e) => e.startsWith("Companies")),
      jobs: !partialErrors.some((e) => e.startsWith("Jobs")),
      applications: !partialErrors.some((e) => e.startsWith("Applications")),
      auditLogs: !partialErrors.some((e) => e.startsWith("Audit Logs")),
    },
    analytics: computeDashboardAnalytics(normalized, dateRange),
  };
}