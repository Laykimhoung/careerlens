import { useState } from "react";
import { readStore, saveDemoCollection } from "../../services/member3DemoStore";
import "./Notifications.css";

function Notifications() {
  const [store, setStore] = useState(() => readStore());

  const notifs = store.notifs || [];
  const users = store.users || [];

  const unreadCount = notifs.filter((n) => !n.read).length;

  const markRead = (id) => {
    const updated = notifs.map((n) => (n.id === id ? { ...n, read: true } : n));
    saveDemoCollection("notifs", updated);
    setStore((s) => ({ ...s, notifs: updated }));
  };

  const markAllRead = () => {
    const updated = notifs.map((n) => ({ ...n, read: true }));
    saveDemoCollection("notifs", updated);
    setStore((s) => ({ ...s, notifs: updated }));
  };

  const deleteNotif = (id) => {
    const updated = notifs.filter((n) => n.id !== id);
    saveDemoCollection("notifs", updated);
    setStore((s) => ({ ...s, notifs: updated }));
  };

  return (
    <section className="workspace-page">
      <div className="workspace-heading">
        <div>
          <h1>Notifications</h1>
          <p>System-wide alerts for users across all roles.</p>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {unreadCount > 0 && (
            <span className="workspace-status workspace-status-danger">{unreadCount} unread</span>
          )}
          {unreadCount > 0 && (
            <button type="button" className="workspace-button" onClick={markAllRead}>Mark all read</button>
          )}
        </div>
      </div>

      {notifs.length === 0 ? (
        <div className="workspace-panel workspace-empty">No notifications.</div>
      ) : (
        <div className="workspace-list">
          {notifs.map((notif) => {
            const targetUser = users.find((u) => u.id === notif.uid);
            return (
              <div key={notif.id} className={`notif-card workspace-card ${notif.read ? "notif-read" : "notif-unread"}`}>
                <div className="notif-left">
                  <span className={`notif-dot ${notif.read ? "dot-read" : "dot-unread"}`}></span>
                  <div>
                    <p className="notif-message">{notif.text}</p>
                    <p className="notif-meta">
                      Recipient: <strong>{targetUser ? targetUser.name : "System"}</strong>
                      {" - "}{notif.t}
                    </p>
                  </div>
                </div>
                <div className="notif-actions">
                  {!notif.read && (
                    <button type="button" className="workspace-button" onClick={() => markRead(notif.id)}>
                      Mark read
                    </button>
                  )}
                  <button
                    type="button"
                    className="workspace-button workspace-button-danger"
                    onClick={() => deleteNotif(notif.id)}
                    style={{ padding: "4px 8px", minHeight: "auto", fontSize: "11px" }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default Notifications;
