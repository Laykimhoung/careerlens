const STORAGE_KEY = "careerlens-member3-demo";

const initialData = {
  jobs: [
    {
      id: "job-101",
      title: "Frontend Engineer",
      department: "Engineering",
      type: "Full-time",
      location: "Phnom Penh",
      status: "Published",
      applications: 18,
      createdAt: "2026-09-22",
      description: "Build accessible, reliable product experiences with our engineering team.",
    },
    {
      id: "job-102",
      title: "Product Design Intern",
      department: "Design",
      type: "Internship",
      location: "Hybrid",
      status: "Published",
      applications: 9,
      createdAt: "2026-09-18",
      description: "Support discovery, prototyping, and visual design across the product.",
    },
    {
      id: "job-103",
      title: "People Operations Associate",
      department: "People",
      type: "Full-time",
      location: "Phnom Penh",
      status: "Draft",
      applications: 0,
      createdAt: "2026-09-12",
      description: "Help build thoughtful people programs as the company grows.",
    },
  ],
  applicants: [
    { id: "app-201", name: "Sokha Chan", email: "sokha.chan@example.com", jobId: "job-101", jobTitle: "Frontend Engineer", location: "Phnom Penh", experience: "3 years", skills: ["React", "TypeScript", "CSS"], status: "New", appliedAt: "2026-09-28" },
    { id: "app-202", name: "Dara Lim", email: "dara.lim@example.com", jobId: "job-101", jobTitle: "Frontend Engineer", location: "Siem Reap", experience: "2 years", skills: ["React", "Testing", "Accessibility"], status: "Reviewing", appliedAt: "2026-09-26" },
    { id: "app-203", name: "Malis Vann", email: "malis.vann@example.com", jobId: "job-102", jobTitle: "Product Design Intern", location: "Phnom Penh", experience: "1 year", skills: ["Figma", "Research", "Prototyping"], status: "Interview", appliedAt: "2026-09-25" },
    { id: "app-204", name: "Rithy Keo", email: "rithy.keo@example.com", jobId: "job-101", jobTitle: "Frontend Engineer", location: "Battambang", experience: "4 years", skills: ["JavaScript", "Vue", "Node.js"], status: "New", appliedAt: "2026-09-23" },
  ],
  interviews: [
    { id: "int-301", candidate: "Malis Vann", role: "Product Design Intern", date: "2026-10-04", time: "10:30", format: "Video call", status: "Scheduled" },
    { id: "int-302", candidate: "Dara Lim", role: "Frontend Engineer", date: "2026-10-06", time: "14:00", format: "On-site", status: "Scheduled" },
  ],
  profile: {
    companyName: "Northstar Labs",
    industry: "Software Development",
    size: "51-200 employees",
    location: "Phnom Penh, Cambodia",
    website: "https://northstar.example",
    description: "We build useful digital products for people and businesses across Southeast Asia.",
    contactEmail: "careers@northstar.example",
  },
  users: [
    { id: "usr-401", name: "Sokha Chan", email: "sokha.chan@example.com", role: "Candidate", status: "Active", joined: "2026-09-28" },
    { id: "usr-402", name: "Northstar Labs", email: "careers@northstar.example", role: "Company", status: "Active", joined: "2026-09-26" },
    { id: "usr-403", name: "Dara Lim", email: "dara.lim@example.com", role: "Candidate", status: "Active", joined: "2026-09-24" },
    { id: "usr-404", name: "Kiri Digital", email: "hello@kiri.example", role: "Company", status: "Pending", joined: "2026-09-21" },
  ],
  candidates: [
    { id: "cand-501", name: "Sokha Chan", email: "sokha.chan@example.com", uni: "Royal University of Phnom Penh", major: "Computer Science", status: "Active" },
    { id: "cand-502", name: "Dara Lim", email: "dara.lim@example.com", uni: "Institute of Technology of Cambodia", major: "Software Engineering", status: "Active" },
    { id: "cand-503", name: "Malis Vann", email: "malis.vann@example.com", uni: "Paragon International University", major: "Digital Product Design", status: "Active" },
  ],
  companies: [
    { id: "co-601", name: "Northstar Labs", email: "careers@northstar.example", ind: "Software Development", loc: "Phnom Penh", verified: "Verified" },
    { id: "co-602", name: "Kiri Digital", email: "hello@kiri.example", ind: "Information Technology", loc: "Siem Reap", verified: "Pending Verification" },
    { id: "co-603", name: "Mekong Works", email: "team@mekong.example", ind: "Consulting", loc: "Phnom Penh", verified: "Pending Verification" },
  ],
};

function readStore() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? { ...initialData, ...JSON.parse(saved) } : initialData;
  } catch {
    return initialData;
  }
}

function writeStore(data) {
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

export function updateDemoItem(name, id, changes) {
  const items = getDemoCollection(name).map((item) => (
    item.id === id ? { ...item, ...changes } : item
  ));
  saveDemoCollection(name, items);
  return items;
}

export function resetDemoStore() {
  localStorage.removeItem(STORAGE_KEY);
  return initialData;
}
