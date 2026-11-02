import api, { extractResults } from "./api";
import { getCompanies } from "./companyService";
import { getCandidates } from "./candidateService";

export const getMessages = (params = {}) =>
  api.get("/messages/", { params });

export const sendMessageApi = (data) =>
  api.post("/messages/", data);

export const markMessageRead = (id) =>
  api.post(`/messages/${id}/mark_as_read/`);

/**
 * Fetches all available companies and candidates in CareerLens to allow starting
 * a new chat with any user in the directory.
 */
export async function fetchAllDirectoryContacts(currentUserId) {
  try {
    const [compRes, candRes] = await Promise.all([
      getCompanies().catch(() => ({ data: [] })),
      getCandidates().catch(() => ({ data: [] })),
    ]);

    const compList = extractResults(compRes);
    const candList = extractResults(candRes);

    const contacts = [];
    const seenUserIds = new Set();
    const currId = Number(currentUserId);

    // Companies
    compList.forEach((c) => {
      const uid = Number(c.user?.id);
      if (uid && uid !== currId && !seenUserIds.has(uid)) {
        seenUserIds.add(uid);
        const name = c.company_name || c.user?.username || `Company #${c.id}`;
        contacts.push({
          userId: uid,
          name,
          role: "COMPANY",
          headline: [c.industry, c.location].filter(Boolean).join(" • ") || "Hiring Company",
          email: c.user?.email || "",
          username: c.user?.username || "",
        });
      }
    });

    // Candidates
    candList.forEach((cand) => {
      const uid = Number(cand.user?.id);
      if (uid && uid !== currId && !seenUserIds.has(uid)) {
        seenUserIds.add(uid);
        const fullName = [cand.user?.first_name, cand.user?.last_name]
          .filter(Boolean)
          .join(" ")
          .trim();
        const name = fullName || cand.user?.username || `Candidate #${cand.id}`;
        contacts.push({
          userId: uid,
          name,
          role: "CANDIDATE",
          headline: [cand.target_role || cand.major, cand.university]
            .filter(Boolean)
            .join(" • ") || "Job Seeker",
          email: cand.user?.email || "",
          username: cand.user?.username || "",
        });
      }
    });

    return contacts.sort((a, b) => a.name.localeCompare(b.name));
  } catch (err) {
    console.error("Failed to fetch directory contacts:", err);
    return [];
  }
}
