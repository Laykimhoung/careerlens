import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { useAuth } from "../../../hooks/useAuth";
import { useLanguage } from "../../../context/LanguageContext";
import { extractResults } from "../../../services/api";
import {
  getAdminNotifications,
  updateAdminNotification,
  markAllAdminNotificationsRead,
  deleteAdminNotification,
} from "../../../services/adminService";
import "./Notifications.css";

function Notifications() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminNotifications();
      const raw = extractResults(res);
      const items = raw.map((n) => ({
        id: n.id,
        text: n.message,
        read: Boolean(n.is_read),
        recipientName: n.recipient_name || "User",
        type: n.type || "INFO",
        t: n.created_at
          ? String(n.created_at).replace("T", " ").slice(0, 16)
          : "—",
      }));
      setNotifs(items);
      const freshUnread = items.filter((n) => !n.read).length;
      window.dispatchEvent(
        new CustomEvent("careerlens_notifications_updated", {
          detail: { unreadCount: freshUnread },
        })
      );
    } catch (err) {
      setError(
        err.response?.data?.detail || "Failed to load notifications from server."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const unreadCount = notifs.filter((n) => !n.read).length;

  const markRead = async (id) => {
    try {
      await updateAdminNotification(id, { is_read: true });
      setNotifs((prev) => {
        const next = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
        const newUnread = next.filter((n) => !n.read).length;
        window.dispatchEvent(
          new CustomEvent("careerlens_notifications_updated", {
            detail: { unreadCount: newUnread },
          })
        );
        return next;
      });
    } catch (err) {
      setError(
        err.response?.data?.detail || "Failed to mark notification as read."
      );
    }
  };

  const markAllRead = async () => {
    try {
      try {
        await markAllAdminNotificationsRead();
      } catch {
        const unread = notifs.filter((n) => !n.read);
        await Promise.all(
          unread.map((n) => updateAdminNotification(n.id, { is_read: true }))
        );
      }
      setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
      window.dispatchEvent(
        new CustomEvent("careerlens_notifications_updated", {
          detail: { unreadCount: 0 },
        })
      );
      await loadNotifications();
    } catch (err) {
      setError(
        err.response?.data?.detail || "Failed to mark all notifications as read."
      );
    }
  };

  const deleteNotif = async (id) => {
    try {
      await deleteAdminNotification(id);
      setNotifs((prev) => {
        const next = prev.filter((n) => n.id !== id);
        const newUnread = next.filter((n) => !n.read).length;
        window.dispatchEvent(
          new CustomEvent("careerlens_notifications_updated", {
            detail: { unreadCount: newUnread },
          })
        );
        return next;
      });
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to delete notification.");
    }
  };

  // Navigate directly to the main target entity when clicking the notification
  const handleNotificationClick = async (notif) => {
    // 1. Mark as read immediately and await database persistence
    if (!notif.read) {
      await markRead(notif.id);
    }

    const text = (notif.text || "").toLowerCase();
    const currentRole = (user?.role || "admin").toLowerCase();

    // A. Message Notifications: "New message from Sreymom Meas: ..."
    if (text.includes("new message from") || text.includes("message")) {
      const match = notif.text.match(/New message from ([^:]+):/i);
      const senderName = match ? match[1].trim() : "";
      const queryParam = senderName ? `?name=${encodeURIComponent(senderName)}` : "";

      if (currentRole === "candidate") {
        navigate(`/candidate/messages${queryParam}`);
      } else {
        navigate(`/company/messages${queryParam}`);
      }
      return;
    }

    // B. Interview Notifications
    if (text.includes("interview")) {
      if (currentRole === "candidate") {
        navigate("/candidate/interviews");
      } else {
        navigate("/company/interviews");
      }
      return;
    }

    // C. Application / Applicant / Shortlist / Offer Notifications
    if (
      text.includes("application") ||
      text.includes("applicant") ||
      text.includes("applied") ||
      text.includes("shortlist") ||
      text.includes("offer")
    ) {
      if (currentRole === "candidate") {
        navigate("/candidate/applications");
      } else if (currentRole === "company") {
        navigate("/company/applicants");
      } else {
        navigate("/admin/applications");
      }
      return;
    }

    // D. Job Notifications
    if (text.includes("job") || text.includes("vacancy")) {
      if (currentRole === "candidate") {
        navigate("/candidate/jobs");
      } else if (currentRole === "company") {
        navigate("/company/jobs");
      } else {
        navigate("/admin/jobs");
      }
      return;
    }

    // E. User Registration
    if (text.includes("user") || text.includes("registered") || text.includes("account")) {
      if (currentRole === "admin") {
        navigate("/admin/users");
        return;
      }
    }

    // Fallback based on role
    if (currentRole === "candidate") navigate("/candidate");
    else if (currentRole === "company") navigate("/company");
    else navigate("/admin");
  };

  return (
    <section className="workspace-page">
      <div className="workspace-heading">
        <div>
          <h1>{t("nav.notifications", "Notifications")}</h1>
          <p>{t("admin.notificationsDesc", "System-wide alerts for users across all roles.")}</p>
        </div>
        <div
          style={{
            display: "flex",
            gap: "12px",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          {unreadCount > 0 && (
            <span className="workspace-status workspace-status-danger">
              {unreadCount} {t("admin.unread", "unread")}
            </span>
          )}
          {unreadCount > 0 && (
            <button
              type="button"
              className="workspace-button"
              onClick={markAllRead}
            >
              {t("admin.markAllAsRead", "Mark All as Read")}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: "12px 16px",
            marginBottom: "16px",
            borderRadius: "8px",
            background: "#FEF2F2",
            color: "#B91C1C",
            border: "1px solid #FECACA",
            fontSize: "14px",
          }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <div className="workspace-panel workspace-empty">
          {t("admin.loadingNotifications", "Loading notifications from database...")}
        </div>
      ) : notifs.length === 0 ? (
        <div className="workspace-panel workspace-empty">
          {t("admin.noNotifications", "No system notifications logged yet.")}
        </div>
      ) : (
        <div className="workspace-list">
          {notifs.map((notif) => (
            <div
              key={notif.id}
              className={`notif-card workspace-card ${
                notif.read ? "notif-read" : "notif-unread"
              }`}
              onClick={() => handleNotificationClick(notif)}
              title="Click to open directly"
              role="button"
              tabIndex={0}
            >
              <div className="notif-left">
                <span
                  className={`notif-dot ${
                    notif.read ? "dot-read" : "dot-unread"
                  }`}
                ></span>
                <div>
                  <div className="notif-message-row">
                    <p className="notif-message">{notif.text}</p>
                    <ArrowUpRight size={15} className="notif-open-icon" />
                  </div>
                  <p className="notif-meta">
                    {t("admin.recipient", "Recipient")}: <strong>{notif.recipientName}</strong>
                    {" • "}
                    {notif.t}
                  </p>
                </div>
              </div>
              <div className="notif-actions">
                {!notif.read && (
                  <button
                    type="button"
                    className="workspace-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      markRead(notif.id);
                    }}
                  >
                    {t("admin.markRead", "Mark Read")}
                  </button>
                )}
                <button
                  type="button"
                  className="workspace-button workspace-button-danger"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNotif(notif.id);
                  }}
                >
                  {t("common.delete", "Delete")}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default Notifications;
