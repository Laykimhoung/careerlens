import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useLanguage } from "../../context/LanguageContext";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import {
  getNotifications,
  markNotificationRead,
  getMessages,
  sendMessageApi,
  getCandidates,
} from "../../services/candidateService";
import { getCompanies } from "../../services/companyService";
import { updateMeApi } from "../../services/authService";
import { fetchInterviewsList } from "../../services/interviewService";
import {
  fetchNormalizedApplications,
  getOffers,
} from "../../services/applicationService";
import { fetchNormalizedJobs } from "../../services/jobService";
import { extractResults } from "../../services/api";
import "./PlaceholderPage.css";

function NotificationsView() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getNotifications();
      setItems(extractResults(res));
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleMarkRead = async (id) => {
    try {
      const res = await markNotificationRead(id, true);
      setItems((prev) => prev.map((n) => (n.id === id ? res.data : n)));
    } catch {
      // Ignore
    }
  };

  const handleMarkAllRead = async () => {
    const unread = items.filter((n) => !n.is_read);
    await Promise.all(unread.map((n) => markNotificationRead(n.id, true).catch(() => {})));
    load();
  };

  return (
    <div className="ph-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h2 className="ph-title">Notifications</h2>
          <p className="ph-desc" style={{ margin: "4px 0 0 0" }}>
            Real-time updates on your applications, interviews, and account activity.
          </p>
        </div>
        {items.some((n) => !n.is_read) && (
          <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
            Mark All as Read
          </Button>
        )}
      </div>

      {error && (
        <div style={{ padding: "12px", background: "#fef2f2", color: "#b91c1c", borderRadius: "8px", marginBottom: "16px" }}>
          {error}
        </div>
      )}

      {loading ? (
        <p style={{ color: "#64748b", padding: "20px 0" }}>Loading notifications...</p>
      ) : items.length === 0 ? (
        <div style={{ padding: "32px", textAlign: "center", color: "#64748b", border: "1px dashed #cbd5e1", borderRadius: "8px" }}>
          You have no notifications yet.
        </div>
      ) : (
        <div style={{ display: "grid", gap: "12px" }}>
          {items.map((n) => (
            <div
              key={n.id}
              style={{
                padding: "14px 16px",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
                backgroundColor: n.is_read ? "#fff" : "#f0fdfa",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: "999px",
                      backgroundColor:
                        n.type === "SUCCESS"
                          ? "#dcfce7"
                          : n.type === "WARNING"
                          ? "#fef9c3"
                          : n.type === "ERROR"
                          ? "#fee2e2"
                          : "#e0f2fe",
                      color:
                        n.type === "SUCCESS"
                          ? "#166534"
                          : n.type === "WARNING"
                          ? "#854d0e"
                          : n.type === "ERROR"
                          ? "#991b1b"
                          : "#0369a1",
                    }}
                  >
                    {n.type || "INFO"}
                  </span>
                  <span style={{ fontSize: "12px", color: "#64748b" }}>
                    {n.created_at
                      ? new Date(n.created_at).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })
                      : ""}
                  </span>
                </div>
                <div style={{ color: "#0f172a", fontSize: "14px", fontWeight: n.is_read ? 400 : 600 }}>
                  {n.message}
                </div>
              </div>
              {!n.is_read && (
                <Button variant="outline" size="sm" onClick={() => handleMarkRead(n.id)}>
                  Mark Read
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AccountSettingsView() {
  const { user, refreshUser } = useAuth();
  const { t } = useLanguage();
  const [form, setForm] = useState({
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    password: "",
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        email: user.email || "",
        phone: user.phone || "",
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg({ type: "", text: "" });
    try {
      const payload = {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
      };
      if (form.password.trim()) {
        payload.password = form.password.trim();
      }
      await updateMeApi(payload);
      if (refreshUser) await refreshUser();
      setForm((prev) => ({ ...prev, password: "" }));
      setMsg({ type: "success", text: "Account settings saved to database." });
    } catch (err) {
      const detail =
        err.response?.data?.detail ||
        Object.values(err.response?.data || {})?.[0] ||
        "Failed to update account settings.";
      setMsg({ type: "error", text: String(detail) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ph-card" style={{ maxWidth: "1000px", margin: "0 auto" }}>
      <h2 className="ph-title">
        {t("candidate.accountSettings", "Account Settings")}
      </h2>
      <p className="ph-desc">
        {t("candidate.updateAccountSettings", "Update your account contact details and security credentials")} ({user?.username}).
      </p>

      {msg.text && (
        <div
          style={{
            padding: "12px 14px",
            borderRadius: "8px",
            marginBottom: "16px",
            backgroundColor: msg.type === "error" ? "#fef2f2" : "#f0fdf4",
            color: msg.type === "error" ? "#b91c1c" : "#15803d",
            fontSize: "14px",
          }}
        >
          {msg.text}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "16px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <Input
            id="first_name"
            label={t("candidate.firstName", "First Name")}
            value={form.first_name}
            onChange={handleChange}
          />
          <Input
            id="last_name"
            label={t("candidate.lastName", "Last Name")}
            value={form.last_name}
            onChange={handleChange}
          />
        </div>
        <Input
          id="email"
          label={t("common.email", "Email Address")}
          type="email"
          value={form.email}
          onChange={handleChange}
          required
        />
        <Input
          id="phone"
          label={t("common.phone", "Phone Number")}
          value={form.phone}
          onChange={handleChange}
          placeholder="+855 12 345 678"
        />
        <Input
          id="password"
          label={t("candidate.newPasswordKeepCurrent", "New Password (leave blank to keep current)")}
          type="password"
          value={form.password}
          onChange={handleChange}
          placeholder="••••••••"
        />
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Button type="submit" variant="primary" loading={saving}>
            {t("candidate.saveAccountSettings", "Save Account Settings")}
          </Button>
        </div>
      </form>
    </div>
  );
}

function CandidateInterviewsView() {
  const [interviews, setInterviews] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchInterviewsList().catch(() => []),
      fetchNormalizedApplications().catch(() => []),
    ])
      .then(([intList, appList]) => {
        setInterviews(intList);
        setApplications(appList);
      })
      .finally(() => setLoading(false));
  }, []);

  const enriched = useMemo(() => {
    const appMap = new Map(applications.map((a) => [Number(a.id), a]));
    return interviews.map((iv) => {
      const app = appMap.get(Number(iv.application));
      return {
        ...iv,
        jobTitle: app?.jobTitle || `Application #${iv.application}`,
        company: app?.company || "Employer",
      };
    });
  }, [interviews, applications]);

  return (
    <div className="ph-card">
      <h2 className="ph-title">My Interviews</h2>
      <p className="ph-desc">
        View your scheduled and completed interviews with employers.
      </p>

      {loading ? (
        <p style={{ color: "var(--color-text-muted)" }}>Loading interviews...</p>
      ) : enriched.length === 0 ? (
        <div className="ph-empty">
          No interviews scheduled yet.
        </div>
      ) : (
        <div className="ph-grid">
          {enriched.map((iv) => (
            <div key={iv.id} className="ph-item">
              <div>
                <div className="ph-item-title">
                  {iv.jobTitle} — {iv.company}
                </div>
                <div className="ph-item-meta">
                  Date & Time:{" "}
                  <strong>
                    {iv.scheduled_at
                      ? new Date(iv.scheduled_at).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })
                      : "TBD"}
                  </strong>{" "}
                  &middot; Status: <strong>{iv.status}</strong>
                </div>
                {iv.location && (
                  <div className="ph-item-meta">
                    Location: {iv.location}
                  </div>
                )}
                {iv.feedback && (
                  <div className="ph-item-notes">
                    Notes / Feedback: {iv.feedback}
                  </div>
                )}
              </div>
              {iv.meeting_link && (
                <a href={iv.meeting_link} target="_blank" rel="noreferrer">
                  <Button variant="primary" size="sm">
                    Join Video Call
                  </Button>
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CompanyTalentPoolView() {
  const [candidates, setCandidates] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCandidates()
      .then((res) => setCandidates(extractResults(res)))
      .catch(() => setCandidates([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return candidates;
    return candidates.filter((c) => {
      const name = `${c.user?.first_name || ""} ${c.user?.last_name || ""} ${c.user?.username || ""}`;
      const skills = (c.skills || []).map((s) => s.skill?.name || s.name || "").join(" ");
      return `${name} ${c.university || ""} ${c.major || ""} ${skills}`
        .toLowerCase()
        .includes(q);
    });
  }, [candidates, search]);

  return (
    <div className="ph-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h2 className="ph-title">Candidate Talent Pool</h2>
          <p className="ph-desc" style={{ margin: "4px 0 0 0" }}>
            Browse registered candidates, academic backgrounds, and verified skills.
          </p>
        </div>
        <input
          type="text"
          placeholder="Search by name, skill, major, or university..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: "9px 14px",
            border: "1px solid #cbd5e1",
            borderRadius: "8px",
            minWidth: "280px",
            fontSize: "14px",
          }}
        />
      </div>

      {loading ? (
        <p style={{ color: "#64748b" }}>Loading candidate profiles...</p>
      ) : filtered.length === 0 ? (
        <p style={{ color: "#64748b" }}>No candidates match your search.</p>
      ) : (
        <div style={{ display: "grid", gap: "12px" }}>
          {filtered.map((c) => {
            const fullName =
              [c.user?.first_name, c.user?.last_name].filter(Boolean).join(" ").trim() ||
              c.user?.username ||
              `Candidate #${c.id}`;
            const skillNames = (c.skills || []).map((s) => s.skill?.name || s.name).filter(Boolean);
            return (
              <div
                key={c.id}
                style={{
                  padding: "16px",
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: "16px",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: "16px", color: "#0f172a" }}>
                    {fullName}
                  </div>
                  <div style={{ fontSize: "13px", color: "#475569", marginTop: "2px" }}>
                    {c.major || "General Studies"} &middot; {c.university || "University"}
                    {c.graduation_year ? ` (Class of ${c.graduation_year})` : ""}
                  </div>
                  {c.bio && (
                    <p style={{ fontSize: "13px", color: "#334155", margin: "8px 0" }}>
                      {c.bio}
                    </p>
                  )}
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "6px" }}>
                    {skillNames.map((sk) => (
                      <span
                        key={sk}
                        style={{
                          fontSize: "12px",
                          padding: "2px 8px",
                          borderRadius: "999px",
                          backgroundColor: "#f1f5f9",
                          color: "#0f172a",
                        }}
                      >
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>
                <div style={{ fontSize: "13px", color: "#475569", textAlign: "right" }}>
                  <div>{c.user?.email}</div>
                  {c.resume_file && (
                    <a
                      href={c.resume_file}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: "#0d9488", fontWeight: 600, display: "inline-block", marginTop: "6px" }}
                    >
                      View Resume &rarr;
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CompanyReportsView() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchNormalizedJobs().catch(() => []),
      fetchNormalizedApplications().catch(() => []),
      fetchInterviewsList().catch(() => []),
      getOffers().catch(() => ({ data: [] })),
    ])
      .then(([jList, aList, iList, oRes]) => {
        const ownJobs = jList.filter(
          (j) => Number(j.companyUserId) === Number(user?.id)
        );
        setJobs(ownJobs.length > 0 ? ownJobs : jList);
        setApplications(aList);
        setInterviews(iList);
        setOffers(extractResults(oRes));
      })
      .finally(() => setLoading(false));
  }, [user?.id]);

  const statusBreakdown = useMemo(() => {
    const counts = { APPLIED: 0, REVIEWING: 0, INTERVIEW: 0, OFFERED: 0, REJECTED: 0 };
    applications.forEach((a) => {
      if (counts[a.rawStatus] !== undefined) counts[a.rawStatus] += 1;
    });
    return counts;
  }, [applications]);

  return (
    <div className="ph-card">
      <h2 className="ph-title">
        Recruitment Analytics & Reports
      </h2>
      <p className="ph-desc">
        Live recruitment metrics aggregated from your job postings and applicant pipeline.
      </p>

      {loading ? (
        <p style={{ color: "#64748b" }}>Loading recruitment analytics...</p>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "16px", marginBottom: "28px" }}>
            <div style={{ padding: "16px", borderRadius: "8px", border: "1px solid #e2e8f0", background: "#f8fafc" }}>
              <div style={{ fontSize: "24px", fontWeight: 700, color: "#0f172a" }}>{jobs.length}</div>
              <div style={{ fontSize: "13px", color: "#64748b" }}>Total Job Postings</div>
            </div>
            <div style={{ padding: "16px", borderRadius: "8px", border: "1px solid #e2e8f0", background: "#f8fafc" }}>
              <div style={{ fontSize: "24px", fontWeight: 700, color: "#0d9488" }}>
                {jobs.filter((j) => j.rawStatus === "PUBLISHED").length}
              </div>
              <div style={{ fontSize: "13px", color: "#64748b" }}>Published Jobs</div>
            </div>
            <div style={{ padding: "16px", borderRadius: "8px", border: "1px solid #e2e8f0", background: "#f8fafc" }}>
              <div style={{ fontSize: "24px", fontWeight: 700, color: "#0f172a" }}>{applications.length}</div>
              <div style={{ fontSize: "13px", color: "#64748b" }}>Total Applications</div>
            </div>
            <div style={{ padding: "16px", borderRadius: "8px", border: "1px solid #e2e8f0", background: "#f8fafc" }}>
              <div style={{ fontSize: "24px", fontWeight: 700, color: "#2563eb" }}>{interviews.length}</div>
              <div style={{ fontSize: "13px", color: "#64748b" }}>Interviews Scheduled</div>
            </div>
            <div style={{ padding: "16px", borderRadius: "8px", border: "1px solid #e2e8f0", background: "#f8fafc" }}>
              <div style={{ fontSize: "24px", fontWeight: 700, color: "#16a34a" }}>{offers.length}</div>
              <div style={{ fontSize: "13px", color: "#64748b" }}>Offers Extended</div>
            </div>
          </div>

          <h3 style={{ fontSize: "16px", color: "#0f172a", marginBottom: "12px" }}>
            Pipeline Stage Breakdown
          </h3>
          <div style={{ display: "grid", gap: "10px" }}>
            {Object.entries(statusBreakdown).map(([stage, count]) => {
              const pct = applications.length > 0 ? Math.round((count / applications.length) * 100) : 0;
              return (
                <div key={stage}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "4px" }}>
                    <span style={{ fontWeight: 600 }}>{stage}</span>
                    <span>
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div style={{ height: "8px", background: "#e2e8f0", borderRadius: "999px", overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: "#0d9488" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function SharedMessagesView() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [activeRecipientId, setActiveRecipientId] = useState(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getMessages().catch(() => ({ data: [] })),
      getCandidates().catch(() => ({ data: [] })),
      getCompanies().catch(() => ({ data: [] })),
    ])
      .then(([mRes, candRes, compRes]) => {
        const msgList = extractResults(mRes);
        setMessages(msgList);
        const map = new Map();

        extractResults(candRes).forEach((c) => {
          if (c.user?.id && Number(c.user.id) !== Number(user?.id)) {
            const fullName =
              [c.user.first_name, c.user.last_name].filter(Boolean).join(" ").trim() ||
              c.user.username;
            map.set(Number(c.user.id), { userId: Number(c.user.id), name: fullName });
          }
        });

        extractResults(compRes).forEach((comp) => {
          if (comp.user?.id && Number(comp.user.id) !== Number(user?.id)) {
            map.set(Number(comp.user.id), {
              userId: Number(comp.user.id),
              name: comp.company_name || comp.user.username,
            });
          }
        });

        msgList.forEach((m) => {
          const isMe = Number(m.sender) === Number(user?.id);
          const otherId = Number(isMe ? m.recipient : m.sender);
          const otherName = isMe ? m.recipient_name : m.sender_name;
          if (otherId && !map.has(otherId)) {
            map.set(otherId, { userId: otherId, name: otherName || `User #${otherId}` });
          }
        });

        const list = Array.from(map.values());
        setContacts(list);
        if (list.length > 0) setActiveRecipientId(list[0].userId);
      })
      .finally(() => setLoading(false));
  }, [user?.id]);

  const thread = useMemo(
    () =>
      messages.filter(
        (m) =>
          (Number(m.sender) === Number(user?.id) &&
            Number(m.recipient) === Number(activeRecipientId)) ||
          (Number(m.sender) === Number(activeRecipientId) &&
            Number(m.recipient) === Number(user?.id))
      ),
    [messages, activeRecipientId, user?.id]
  );

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || !activeRecipientId) return;
    try {
      const res = await sendMessageApi({
        recipient: activeRecipientId,
        content: text.trim(),
      });
      setMessages((prev) => [...prev, res.data]);
      setText("");
    } catch (err) {
      alert(err.response?.data?.detail || "Could not send message.");
    }
  };

  return (
    <div className="ph-card">
      <h2 className="ph-title">Messages</h2>
      <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: "16px", minHeight: "380px" }}>
        <div style={{ borderRight: "1px solid #e2e8f0", paddingRight: "12px", overflowY: "auto" }}>
          {loading ? (
            <p style={{ fontSize: "13px", color: "#64748b" }}>Loading contacts...</p>
          ) : (
            contacts.map((c) => (
              <button
                key={c.userId}
                onClick={() => setActiveRecipientId(c.userId)}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: "10px 12px",
                  borderRadius: "6px",
                  border: "none",
                  marginBottom: "4px",
                  cursor: "pointer",
                  backgroundColor:
                    Number(activeRecipientId) === Number(c.userId) ? "#eff6ff" : "transparent",
                  color:
                    Number(activeRecipientId) === Number(c.userId) ? "#016bfb" : "#0f172a",
                  fontWeight: Number(activeRecipientId) === Number(c.userId) ? 600 : 400,
                }}
              >
                {c.name}
              </button>
            ))
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div style={{ flex: 1, overflowY: "auto", padding: "12px", backgroundColor: "#f8fafc", borderRadius: "8px", marginBottom: "12px" }}>
            {thread.length === 0 ? (
              <p style={{ color: "#64748b", textAlign: "center", marginTop: "40px", fontSize: "14px" }}>
                No messages in this conversation yet.
              </p>
            ) : (
              thread.map((m) => {
                const isMine = Number(m.sender) === Number(user?.id);
                return (
                  <div
                    key={m.id}
                    style={{
                      display: "flex",
                      justifyContent: isMine ? "flex-end" : "flex-start",
                      marginBottom: "8px",
                    }}
                  >
                    <div
                      style={{
                        padding: "8px 12px",
                        borderRadius: "8px",
                        backgroundColor: isMine ? "#016bfb" : "#fff",
                        color: isMine ? "#fff" : "#0f172a",
                        border: isMine ? "none" : "1px solid #e2e8f0",
                        maxWidth: "70%",
                        fontSize: "14px",
                      }}
                    >
                      {m.content || m.text}
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <form onSubmit={handleSend} style={{ display: "flex", gap: "8px" }}>
            <input
              type="text"
              placeholder="Write a message..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              style={{ flex: 1, padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: "6px" }}
            />
            <Button type="submit" variant="primary">
              Send
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function PlaceholderPage({ title }) {
  if (title === "Notifications") return <NotificationsView />;
  if (title === "Settings") return <AccountSettingsView />;
  if (title === "Interviews") return <CandidateInterviewsView />;
  if (title === "Talent Pool") return <CompanyTalentPoolView />;
  if (title === "Reports") return <CompanyReportsView />;
  if (title === "Messages") return <SharedMessagesView />;

  return (
    <div
      style={{
        padding: "40px",
        textAlign: "center",
        backgroundColor: "#fff",
        borderRadius: "8px",
        border: "1px dashed #d1d5db",
      }}
    >
      <h2 style={{ fontSize: "24px", color: "#111827", marginBottom: "12px" }}>{title}</h2>
      <p style={{ color: "#6b7280" }}>Select a section from the navigation menu.</p>
    </div>
  );
}
