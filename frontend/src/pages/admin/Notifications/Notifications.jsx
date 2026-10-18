import { useState, useEffect, useCallback } from "react";
import { useLanguage } from "../../../context/LanguageContext";
import { extractResults } from "../../../services/api";
import {
  getAdminNotifications,
  updateAdminNotification,
  deleteAdminNotification,
} from "../../../services/adminService";
import "./Notifications.css";

function Notifications() {
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
      setNotifs(
        raw.map((n) => ({
          id: n.id,
          text: n.message,
          read: Boolean(n.is_read),
          recipientName: n.recipient_name || "User",
          type: n.type || "INFO",
          t: n.created_at
            ? String(n.created_at).replace("T", " ").slice(0, 16)
            : "—",
        }))
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
      await loadNotifications();
    } catch (err) {
      setError(
        err.response?.data?.detail || "Failed to mark notification as read."
      );
    }
  };

  const markAllRead = async () => {
    try {
      const unread = notifs.filter((n) => !n.read);
      await Promise.all(
        unread.map((n) => updateAdminNotification(n.id, { is_read: true }))
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
      await loadNotifications();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to delete notification.");
    }
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
            >
              <div className="notif-left">
                <span
                  className={`notif-dot ${
                    notif.read ? "dot-read" : "dot-unread"
                  }`}
                ></span>
                <div>
                  <p className="notif-message">{notif.text}</p>
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
                    onClick={() => markRead(notif.id)}
                  >
                    {t("admin.markRead", "Mark Read")}
                  </button>
                )}
                <button
                  type="button"
                  className="workspace-button workspace-button-danger"
                  onClick={() => deleteNotif(notif.id)}
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
