import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../../../hooks/useAuth";
import {
  getMessages,
  sendMessageApi,
  markMessageRead,
} from "../../../services/candidateService";
import { getCompanies } from "../../../services/companyService";
import { extractResults } from "../../../services/api";
import "./Messages.css";

export default function CandidateMessages() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [activeRecipientId, setActiveRecipientId] = useState(null);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const loadMessagesData = useCallback(async () => {
    setLoading(true);
    try {
      const [msgRes, compRes] = await Promise.all([
        getMessages(),
        getCompanies().catch(() => ({ data: [] })),
      ]);
      const msgList = extractResults(msgRes);
      const compList = extractResults(compRes);

      setMessages(msgList);

      // Build contact map by user.id
      const contactMap = new Map();

      compList.forEach((comp) => {
        const uid = comp.user?.id;
        if (uid && Number(uid) !== Number(user?.id)) {
          contactMap.set(Number(uid), {
            userId: Number(uid),
            name: comp.company_name || comp.user?.username || `Company #${uid}`,
          });
        }
      });

      msgList.forEach((m) => {
        const isMeSender = Number(m.sender) === Number(user?.id);
        const otherId = Number(isMeSender ? m.recipient : m.sender);
        const otherName = isMeSender ? m.recipient_name : m.sender_name;
        if (otherId && !contactMap.has(otherId)) {
          contactMap.set(otherId, {
            userId: otherId,
            name: otherName || `User #${otherId}`,
          });
        }
      });

      const contactArr = Array.from(contactMap.values());
      setContacts(contactArr);
      if (!activeRecipientId && contactArr.length > 0) {
        setActiveRecipientId(contactArr[0].userId);
      }
    } catch {
      // Ignore error if empty
    } finally {
      setLoading(false);
    }
  }, [user?.id, activeRecipientId]);

  useEffect(() => {
    loadMessagesData();
  }, [loadMessagesData]);

  const activeThread = useMemo(() => {
    if (!activeRecipientId) return [];
    return messages
      .filter(
        (m) =>
          (Number(m.sender) === Number(user?.id) &&
            Number(m.recipient) === Number(activeRecipientId)) ||
          (Number(m.sender) === Number(activeRecipientId) &&
            Number(m.recipient) === Number(user?.id))
      )
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  }, [messages, activeRecipientId, user?.id]);

  useEffect(() => {
    // Mark unread incoming messages in active thread as read
    activeThread.forEach((m) => {
      if (Number(m.recipient) === Number(user?.id) && !m.is_read) {
        markMessageRead(m.id, true).catch(() => {});
      }
    });
  }, [activeThread, user?.id]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activeRecipientId) return;
    setSending(true);
    try {
      const res = await sendMessageApi({
        recipient: activeRecipientId,
        content: inputText.trim(),
      });
      setMessages((prev) => [...prev, res.data]);
      setInputText("");
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="messages-page">
      <h1 className="messages-page__title">Messages</h1>

      <div className="messages-container">
        {/* Left Column: Chat List */}
        <div className="messages-sidebar">
          {loading ? (
            <div style={{ padding: "16px", color: "#64748b", fontSize: "13px" }}>
              Loading contacts...
            </div>
          ) : contacts.length > 0 ? (
            contacts.map((chat) => (
              <button
                key={chat.userId}
                className={`messages-sidebar__item ${
                  Number(activeRecipientId) === Number(chat.userId) ? "active" : ""
                }`}
                onClick={() => setActiveRecipientId(chat.userId)}
              >
                {chat.name}
              </button>
            ))
          ) : (
            <div style={{ padding: "16px", color: "#64748b", fontSize: "13px" }}>
              No contacts available.
            </div>
          )}
        </div>

        {/* Right Column: Chat Window */}
        <div className="messages-chat">
          <div className="messages-chat__history">
            {loading ? (
              <div
                style={{
                  textAlign: "center",
                  color: "#94a3b8",
                  margin: "auto",
                  fontSize: "14px",
                  marginTop: "60px",
                }}
              >
                Loading conversation...
              </div>
            ) : activeThread.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  color: "#94a3b8",
                  margin: "auto",
                  fontSize: "14px",
                  marginTop: "60px",
                }}
              >
                No messages in this conversation yet. Send a message below to start chatting.
              </div>
            ) : (
              activeThread.map((msg) => {
                const isUser = Number(msg.sender) === Number(user?.id);
                return (
                  <div
                    key={msg.id}
                    className={`chat-bubble-wrapper ${
                      isUser ? "chat-bubble-wrapper--right" : "chat-bubble-wrapper--left"
                    }`}
                  >
                    <div
                      className={`chat-bubble ${
                        isUser ? "chat-bubble--user" : "chat-bubble--company"
                      }`}
                    >
                      <div>{msg.content || msg.text}</div>
                      {msg.created_at && (
                        <div
                          style={{
                            fontSize: "10px",
                            opacity: 0.75,
                            marginTop: "4px",
                            textAlign: isUser ? "right" : "left",
                          }}
                        >
                          {new Date(msg.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <form className="messages-chat__input-area" onSubmit={handleSend}>
            <input
              type="text"
              className="messages-chat__input"
              placeholder="Write a message"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={!activeRecipientId || sending}
            />
            <button
              type="submit"
              className="messages-chat__send-btn"
              disabled={!activeRecipientId || sending}
            >
              {sending ? "Sending..." : "Send"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
