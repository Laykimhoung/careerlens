const STORAGE_KEY = "careerlens-member3-demo";

const initialData = {
  users: [
    { id: "usr-admin", name: "System Admin", email: "admin@careerlens.edu", role: "admin", status: "Active", pw: "demo123", createdAt: "2026-09-18" },
    { id: "usr-c1", name: "Northstar Labs", email: "careers@northstar.example", role: "company", status: "Active", pw: "demo123", ind: "Software Development", loc: "Phnom Penh", verified: "Verified", createdAt: "2026-09-19" },
    { id: "usr-c2", name: "Kiri Digital", email: "hello@kiri.example", role: "company", status: "Active", pw: "demo123", ind: "Information Technology", loc: "Siem Reap", verified: "Pending Verification", createdAt: "2026-09-21" },
    { id: "usr-s1", name: "Sokha Chan", email: "sokha.chan@example.com", role: "student", status: "Active", pw: "demo123", uni: "RUPP", major: "Computer Science", year: "2026", createdAt: "2026-09-22" },
    { id: "usr-s2", name: "Dara Lim", email: "dara.lim@example.com", role: "student", status: "Active", pw: "demo123", uni: "ITC", major: "Software Engineering", year: "2025", createdAt: "2026-09-24" },
  ],
  jobs: [
    { id: "job-101", title: "Frontend Engineer", co: "Northstar Labs", cid: "usr-c1", type: "Full-time", loc: "Phnom Penh", status: "Published", salary: "$800-$1200", cat: "Engineering", skills: ["React", "CSS"], desc: "Build accessible UIs", dept: "Engineering", work: "Hybrid", deadline: "2026-12-31", createdAt: "2026-09-23" },
    { id: "job-102", title: "Product Design Intern", co: "Northstar Labs", cid: "usr-c1", type: "Internship", loc: "Remote", status: "Published", salary: "$300-$500", cat: "Design", skills: ["Figma"], desc: "Design interfaces", dept: "Design", work: "Remote", deadline: "2026-11-15", createdAt: "2026-09-24" },
  ],
  apps: [
    { id: "app-201", jid: "job-101", sid: "usr-s1", status: "Applied", date: "2026-09-28", cover: "I love React.", notes: "", hist: [["Applied", "2026-09-28"]] },
    { id: "app-202", jid: "job-102", sid: "usr-s2", status: "Interviewing", date: "2026-09-25", cover: "Experienced designer.", notes: "", hist: [["Applied", "2026-09-25"], ["Interviewing", "2026-09-26"]] },
  ],
  cats: ["Engineering", "Design", "Marketing", "Sales", "Operations"],
  skills: ["React", "JavaScript", "TypeScript", "Node.js", "Python", "Figma", "CSS", "UI/UX"],
  audit: [
    { t: "2026-09-30 08:00", text: "System initialized default data" },
    { t: "2026-10-01 10:20", text: "Admin verified company Northstar Labs" },
  ],
  notifs: [
    { id: "n1", uid: "usr-c1", text: "Your company has been verified.", read: false, t: "2026-10-01 10:20" },
    { id: "n2", uid: "usr-admin", text: "New company registration: Kiri Digital", read: true, t: "2026-09-21 15:45" },
  ]
};

const initialDateById = {
  "usr-admin": "2026-09-18",
  "usr-c1": "2026-09-19",
  "usr-c2": "2026-09-21",
  "usr-s1": "2026-09-22",
  "usr-s2": "2026-09-24",
  "job-101": "2026-09-23",
  "job-102": "2026-09-24",
};

export function readStore() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return initialData;
    const parsed = { ...initialData, ...JSON.parse(saved) };
    if (Array.isArray(parsed.users)) {
      parsed.users = parsed.users.map((u) => (
        u.createdAt || !initialDateById[u.id] ? u : { ...u, createdAt: initialDateById[u.id] }
      ));
    }
    if (Array.isArray(parsed.jobs)) {
      parsed.jobs = parsed.jobs.map((j) => (
        j.createdAt || !initialDateById[j.id] ? j : { ...j, createdAt: initialDateById[j.id] }
      ));
    }
    return parsed;
  } catch {
    return initialData;
  }
}

export function writeStore(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  return data;
}

export function getDemoCollection(name) {
  const store = readStore();
  return store[name] || [];
}

export function saveDemoCollection(name, value) {
  return writeStore({ ...readStore(), [name]: value });
}

export function resetDemoStore() {
  localStorage.removeItem(STORAGE_KEY);
  return initialData;
}

export function logAudit(text) {
  const store = readStore();
  const date = new Date().toISOString().replace("T", " ").slice(0, 16);
  store.audit = [{ t: date, text }, ...(store.audit || [])];
  writeStore(store);
}

export function notifyUser(uid, text) {
  const store = readStore();
  const date = new Date().toISOString().replace("T", " ").slice(0, 16);
  store.notifs = [{ id: "n" + Date.now(), uid, text, read: false, t: date }, ...(store.notifs || [])];
  writeStore(store);
}
