import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import {
  MessageSquare,
  Send,
  Plus,
  Search,
  Check,
  CheckCheck,
  Building2,
  User as UserIcon,
  Sparkles,
  Smile,
  X,
  Circle,
} from "lucide-react";
import { useAuth } from "../../../hooks/useAuth";
import { useLanguage } from "../../../context/LanguageContext";
import {
  getMessages,
  sendMessageApi,
  markMessageRead,
  fetchAllDirectoryContacts,
} from "../../../services/messageService";
import { extractResults } from "../../../services/api";
import "./Messages.css";

function formatChatTime(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);

  if (diffSec < 60) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;

  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isYesterday) return "Yesterday";

  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function getInitials(name = "User") {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getAvatarColor(name = "User") {
  const colors = [
    "linear-gradient(135deg, #638ECB 0%, #395886 100%)",
    "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
    "linear-gradient(135deg, #0d9488 0%, #0f766e 100%)",
    "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
    "linear-gradient(135deg, #ea580c 0%, #c2410c 100%)",
    "linear-gradient(135deg, #059669 0%, #047857 100%)",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

const QUICK_EMOJIS = ["👋", "👍", "😊", "💼", "🚀", "📄", "🎯", "❤️", "✨", "🙌"];

const ICEBREAKER_PROMPTS = [
  "👋 Hello! Nice to connect with you.",
  "💼 I am interested in discussing potential opportunities.",
  "📄 Thank you for reviewing my profile and credentials.",
  "📅 Are you available for a brief conversation this week?",
];

export default function Messages() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();

  const [messages, setMessages] = useState([]);
  const [directoryContacts, setDirectoryContacts] = useState([]);
  const [activeRecipientId, setActiveRecipientId] = useState(null);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Search & Filter in Chat List
  const [chatSearch, setChatSearch] = useState("");
  const [chatFilterTab, setChatFilterTab] = useState("all"); // 'all' | 'unread' | 'companies' | 'candidates'

  // New Message Modal
  const [isNewMessageModalOpen, setIsNewMessageModalOpen] = useState(false);
  const [modalSearch, setModalSearch] = useState("");
  const [modalRoleFilter, setModalRoleFilter] = useState("ALL"); // 'ALL' | 'COMPANY' | 'CANDIDATE'

  // Emoji Popover
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // References
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);

  // 1. Initial Data Fetching
  const loadInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const [msgRes, dirList] = await Promise.all([
        getMessages(),
        fetchAllDirectoryContacts(user?.id),
      ]);

      const msgList = extractResults(msgRes);
      setMessages(msgList);
      setDirectoryContacts(dirList);

      // Auto-select conversation if none selected yet
      if (!activeRecipientId) {
        if (msgList.length > 0) {
          const firstMsg = msgList[0];
          const isSenderMe = Number(firstMsg.sender) === Number(user?.id);
          const firstRecipient = isSenderMe ? firstMsg.recipient : firstMsg.sender;
          setActiveRecipientId(Number(firstRecipient));
        } else if (dirList.length > 0) {
          setActiveRecipientId(dirList[0].userId);
        }
      }
    } catch (err) {
      console.error("Failed to load initial messages:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, activeRecipientId]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Handle URL navigation directly to a conversation (e.g. from Notifications or user links)
  useEffect(() => {
    const paramId = searchParams.get("recipient") || searchParams.get("user");
    const paramName = searchParams.get("name");

    if (paramId) {
      setActiveRecipientId(Number(paramId));
    } else if (paramName) {
      const q = paramName.toLowerCase().trim();
      const foundInDir = directoryContacts.find(
        (c) => c.name.toLowerCase() === q || c.name.toLowerCase().includes(q)
      );
      if (foundInDir) {
        setActiveRecipientId(foundInDir.userId);
      } else {
        const foundInMsgs = messages.find(
          (m) =>
            (m.sender_name && m.sender_name.toLowerCase().includes(q)) ||
            (m.recipient_name && m.recipient_name.toLowerCase().includes(q))
        );
        if (foundInMsgs) {
          const isSenderMe = Number(foundInMsgs.sender) === Number(user?.id);
          const otherId = isSenderMe ? foundInMsgs.recipient : foundInMsgs.sender;
          setActiveRecipientId(Number(otherId));
        }
      }
    }
  }, [searchParams, directoryContacts, messages, user?.id]);

  // 2. Real-Time High-Frequency Polling (every 2 seconds + on tab focus)
  useEffect(() => {
    let isMounted = true;

    const pollMessages = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const res = await getMessages();
        const freshList = extractResults(res);
        if (isMounted) {
          setMessages((prev) => {
            const isDifferent =
              freshList.length !== prev.length ||
              freshList.some((m, idx) => prev[idx]?.id !== m.id || prev[idx]?.is_read !== m.is_read);
            return isDifferent ? freshList : prev;
          });
        }
      } catch (err) {
        // silent polling catch
      }
    };

    const intervalId = setInterval(pollMessages, 2000);
    window.addEventListener("focus", pollMessages);
    document.addEventListener("visibilitychange", pollMessages);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
      window.removeEventListener("focus", pollMessages);
      document.removeEventListener("visibilitychange", pollMessages);
    };
  }, []);

  // 3. Directory Map by User ID for Quick Contact Resolution
  const directoryMap = useMemo(() => {
    const map = new Map();
    directoryContacts.forEach((c) => {
      map.set(Number(c.userId), c);
    });
    return map;
  }, [directoryContacts]);

  // 4. Build List of Conversations with Previews & Unread Badges
  const conversations = useMemo(() => {
    const map = new Map();
    const currUserId = Number(user?.id);

    // Populate all participants who have existing messages
    messages.forEach((m) => {
      const isSenderMe = Number(m.sender) === currUserId;
      const otherId = Number(isSenderMe ? m.recipient : m.sender);
      if (!otherId || otherId === currUserId) return;

      if (!map.has(otherId)) {
        const dirInfo = directoryMap.get(otherId);
        const fallbackName = isSenderMe ? m.recipient_name : m.sender_name;
        map.set(otherId, {
          userId: otherId,
          name: dirInfo?.name || fallbackName || `User #${otherId}`,
          role: dirInfo?.role || "USER",
          headline: dirInfo?.headline || "CareerLens User",
          lastMessage: m,
          unreadCount: 0,
        });
      }

      const conv = map.get(otherId);
      // Update last message if this one is newer
      const msgTime = new Date(m.sent_at || m.created_at).getTime();
      const lastTime = new Date(conv.lastMessage.sent_at || conv.lastMessage.created_at).getTime();
      if (msgTime >= lastTime) {
        conv.lastMessage = m;
      }

      // Count unread incoming messages
      if (Number(m.recipient) === currUserId && !m.is_read) {
        conv.unreadCount += 1;
      }
    });

    // If activeRecipientId has no messages yet (newly initiated chat), keep it in conversations
    if (activeRecipientId && !map.has(Number(activeRecipientId))) {
      const dirInfo = directoryMap.get(Number(activeRecipientId));
      if (dirInfo) {
        map.set(Number(activeRecipientId), {
          userId: Number(activeRecipientId),
          name: dirInfo.name,
          role: dirInfo.role,
          headline: dirInfo.headline,
          lastMessage: null,
          unreadCount: 0,
        });
      }
    }

    // Sort conversations: newest message first
    const list = Array.from(map.values()).sort((a, b) => {
      if (!a.lastMessage && !b.lastMessage) return 0;
      if (!a.lastMessage) return -1;
      if (!b.lastMessage) return 1;
      return (
        new Date(b.lastMessage.sent_at || b.lastMessage.created_at) -
        new Date(a.lastMessage.sent_at || a.lastMessage.created_at)
      );
    });

    return list;
  }, [messages, directoryMap, user?.id, activeRecipientId]);

  // 5. Filter Conversations based on Search and Tab
  const filteredConversations = useMemo(() => {
    let list = conversations;

    if (chatFilterTab === "unread") {
      list = list.filter((c) => c.unreadCount > 0);
    } else if (chatFilterTab === "companies") {
      list = list.filter((c) => c.role === "COMPANY");
    } else if (chatFilterTab === "candidates") {
      list = list.filter((c) => c.role === "CANDIDATE");
    }

    if (chatSearch.trim()) {
      const q = chatSearch.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.headline.toLowerCase().includes(q) ||
          (c.lastMessage?.text || c.lastMessage?.content || "").toLowerCase().includes(q)
      );
    }

    return list;
  }, [conversations, chatFilterTab, chatSearch]);

  // 6. Active Conversation Details & Thread
  const activeRecipient = useMemo(() => {
    if (!activeRecipientId) return null;
    return (
      directoryMap.get(Number(activeRecipientId)) ||
      conversations.find((c) => Number(c.userId) === Number(activeRecipientId)) || {
        userId: Number(activeRecipientId),
        name: `User #${activeRecipientId}`,
        role: "USER",
        headline: "CareerLens User",
      }
    );
  }, [activeRecipientId, directoryMap, conversations]);

  const activeThread = useMemo(() => {
    if (!activeRecipientId) return [];
    const currUserId = Number(user?.id);
    const targetId = Number(activeRecipientId);

    return messages
      .filter(
        (m) =>
          (Number(m.sender) === currUserId && Number(m.recipient) === targetId) ||
          (Number(m.sender) === targetId && Number(m.recipient) === currUserId)
      )
      .sort((a, b) => new Date(a.sent_at || a.created_at) - new Date(b.sent_at || b.created_at));
  }, [messages, activeRecipientId, user?.id]);

  // 7. Auto-Scroll to Bottom on Thread Change / New Message
  const scrollToBottom = (behavior = "smooth") => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior,
      });
    }
  };

  useEffect(() => {
    scrollToBottom("smooth");
  }, [activeThread.length, activeRecipientId]);

  // 8. Auto-mark incoming messages in active thread as read
  useEffect(() => {
    if (!activeRecipientId) return;
    const currUserId = Number(user?.id);

    const unread = activeThread.filter(
      (m) => Number(m.recipient) === currUserId && !m.is_read
    );

    if (unread.length > 0) {
      unread.forEach((m) => {
        markMessageRead(m.id).catch(() => {});
      });

      // Update state locally so badges sync immediately
      setMessages((prev) =>
        prev.map((m) =>
          Number(m.recipient) === currUserId && Number(m.sender) === Number(activeRecipientId)
            ? { ...m, is_read: true }
            : m
        )
      );
    }
  }, [activeThread, activeRecipientId, user?.id]);

  // 9. Send Message Handler (with instant optimistic update)
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    const textToSend = inputText.trim();
    if (!textToSend || !activeRecipientId || sending) return;

    setInputText("");
    setShowEmojiPicker(false);
    setSending(true);

    const tempId = `temp-${Date.now()}`;
    const optimisticMsg = {
      id: tempId,
      sender: Number(user?.id),
      sender_name: user?.full_name || user?.username,
      recipient: Number(activeRecipientId),
      recipient_name: activeRecipient?.name,
      text: textToSend,
      content: textToSend,
      sent_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      is_read: false,
      _optimistic: true,
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setTimeout(() => scrollToBottom("smooth"), 40);

    try {
      const res = await sendMessageApi({
        recipient: Number(activeRecipientId),
        text: textToSend,
        content: textToSend,
      });

      // Swap optimistic with confirmed server message
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? res.data : m))
      );
    } catch (err) {
      console.error("Failed to send message:", err);
      // Revert optimistic on error
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setInputText(textToSend);
      alert(err.response?.data?.detail || "Could not deliver message. Please retry.");
    } finally {
      setSending(false);
      if (inputRef.current) inputRef.current.focus();
    }
  };

  // 10. Handle Enter Key vs Shift+Enter
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 11. Modal Directory Contacts Filtering
  const modalFilteredContacts = useMemo(() => {
    let list = directoryContacts;
    if (modalRoleFilter !== "ALL") {
      list = list.filter((c) => c.role === modalRoleFilter);
    }
    if (modalSearch.trim()) {
      const q = modalSearch.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.headline.toLowerCase().includes(q) ||
          (c.email || "").toLowerCase().includes(q) ||
          (c.username || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [directoryContacts, modalRoleFilter, modalSearch]);

  const handleStartChatWithContact = (contact) => {
    setActiveRecipientId(contact.userId);
    setIsNewMessageModalOpen(false);
    setModalSearch("");
    setTimeout(() => {
      if (inputRef.current) inputRef.current.focus();
    }, 100);
  };

  return (
    <div className="social-chat-page">
      {/* ── Page Header ── */}
      <div className="social-chat-topbar">
        <div className="social-chat-topbar__left">
          <h1 className="social-chat-title">{t("nav.messages", "Messages")}</h1>
          <span className="live-status-pill">
            <span className="live-status-dot" />
            <span>{t("messages.online", "Real-time Active")}</span>
          </span>
        </div>

        <button
          className="btn-add-message"
          onClick={() => setIsNewMessageModalOpen(true)}
          title={t("messages.addMessage", "+ Add Message")}
        >
          <Plus size={16} />
          <span>{t("messages.addMessage", "+ Add Message")}</span>
        </button>
      </div>

      {/* ── Main Chat Glass Container ── */}
      <div className="social-chat-card">
        {/* ── Left Sidebar (Conversations) ── */}
        <div className="chat-sidebar">
          {/* Sidebar Top: Search & Tabs */}
          <div className="chat-sidebar__header">
            <div className="chat-search-wrap">
              <Search size={15} className="chat-search-icon" />
              <input
                type="text"
                className="chat-search-input"
                placeholder={t("messages.searchPlaceholder", "Search conversations...")}
                value={chatSearch}
                onChange={(e) => setChatSearch(e.target.value)}
              />
              {chatSearch && (
                <button
                  className="chat-search-clear"
                  onClick={() => setChatSearch("")}
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="chat-tabs">
              <button
                className={`chat-tab ${chatFilterTab === "all" ? "active" : ""}`}
                onClick={() => setChatFilterTab("all")}
              >
                {t("messages.all", "All")}
              </button>
              <button
                className={`chat-tab ${chatFilterTab === "unread" ? "active" : ""}`}
                onClick={() => setChatFilterTab("unread")}
              >
                {t("messages.unread", "Unread")}
              </button>
              <button
                className={`chat-tab ${chatFilterTab === "companies" ? "active" : ""}`}
                onClick={() => setChatFilterTab("companies")}
              >
                {t("messages.companies", "Companies")}
              </button>
              <button
                className={`chat-tab ${chatFilterTab === "candidates" ? "active" : ""}`}
                onClick={() => setChatFilterTab("candidates")}
              >
                {t("messages.candidates", "Candidates")}
              </button>
            </div>
          </div>

          {/* Conversations Scrollable List */}
          <div className="chat-sidebar__list">
            {loading ? (
              <div className="chat-sidebar__state">
                <div className="chat-spinner" />
                <p>Loading your conversations...</p>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="chat-sidebar__state">
                <MessageSquare size={32} className="state-icon" />
                <p>No conversations found.</p>
                <button
                  className="btn-start-chat-inline"
                  onClick={() => setIsNewMessageModalOpen(true)}
                >
                  <Plus size={14} />
                  <span>Start New Chat</span>
                </button>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isActive = Number(activeRecipientId) === Number(conv.userId);
                const hasUnread = conv.unreadCount > 0;
                const isCompany = conv.role === "COMPANY";

                return (
                  <div
                    key={conv.userId}
                    className={`conversation-card ${isActive ? "active" : ""} ${
                      hasUnread ? "unread" : ""
                    }`}
                    onClick={() => setActiveRecipientId(conv.userId)}
                  >
                    {/* Avatar with Status Dot */}
                    <div className="conv-avatar-wrap">
                      <div
                        className="conv-avatar"
                        style={{ background: getAvatarColor(conv.name) }}
                      >
                        {getInitials(conv.name)}
                      </div>
                      <span className="conv-online-dot" />
                    </div>

                    {/* Meta info */}
                    <div className="conv-info">
                      <div className="conv-top-row">
                        <span className="conv-name">{conv.name}</span>
                        {conv.lastMessage && (
                          <span className="conv-time">
                            {formatChatTime(
                              conv.lastMessage.sent_at || conv.lastMessage.created_at
                            )}
                          </span>
                        )}
                      </div>

                      <div className="conv-bottom-row">
                        <span className="conv-snippet">
                          {conv.lastMessage ? (
                            Number(conv.lastMessage.sender) === Number(user?.id) ? (
                              <>
                                <span className="snippet-you">You: </span>
                                {conv.lastMessage.text || conv.lastMessage.content}
                              </>
                            ) : (
                              conv.lastMessage.text || conv.lastMessage.content
                            )
                          ) : (
                            <span className="snippet-new">Start conversation 👋</span>
                          )}
                        </span>

                        <div className="conv-badges">
                          <span
                            className={`conv-role-badge ${
                              isCompany ? "role-company" : "role-candidate"
                            }`}
                          >
                            {isCompany ? "Company" : "Candidate"}
                          </span>

                          {hasUnread && (
                            <span className="conv-unread-pill">
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── Right Chat Area (Active Conversation) ── */}
        <div className="chat-main">
          {activeRecipient ? (
            <>
              {/* Chat Header */}
              <div className="chat-header">
                <div className="chat-header__profile">
                  <div className="conv-avatar-wrap">
                    <div
                      className="chat-header__avatar"
                      style={{ background: getAvatarColor(activeRecipient.name) }}
                    >
                      {getInitials(activeRecipient.name)}
                    </div>
                    <span className="conv-online-dot" />
                  </div>

                  <div className="chat-header__details">
                    <div className="chat-header__name-row">
                      <h3 className="chat-header__name">{activeRecipient.name}</h3>
                      <span
                        className={`conv-role-badge ${
                          activeRecipient.role === "COMPANY"
                            ? "role-company"
                            : "role-candidate"
                        }`}
                      >
                        {activeRecipient.role === "COMPANY" ? (
                          <>
                            <Building2 size={11} /> Company
                          </>
                        ) : (
                          <>
                            <UserIcon size={11} /> Candidate
                          </>
                        )}
                      </span>
                    </div>
                    <p className="chat-header__headline">
                      {activeRecipient.headline} • <span className="status-text">Active now</span>
                    </p>
                  </div>
                </div>

                <div className="chat-header__actions">
                  <span className="live-pulse-badge">
                    <Circle size={8} fill="#10b981" color="#10b981" /> Live
                  </span>
                </div>
              </div>

              {/* Chat Messages Stream */}
              <div className="chat-messages-stream" ref={messagesContainerRef}>
                {activeThread.length === 0 ? (
                  /* Social Media Icebreaker Card for New Conversations */
                  <div className="icebreaker-container animate-fade">
                    <div
                      className="icebreaker-avatar"
                      style={{ background: getAvatarColor(activeRecipient.name) }}
                    >
                      {getInitials(activeRecipient.name)}
                    </div>
                    <h3 className="icebreaker-title">
                      Start chatting with {activeRecipient.name}
                    </h3>
                    <p className="icebreaker-desc">
                      Messages are encrypted, private, and delivered instantly in real time. Say hello or introduce yourself to get things started!
                    </p>

                    <div className="icebreaker-prompts">
                      {ICEBREAKER_PROMPTS.map((prompt, idx) => (
                        <button
                          key={idx}
                          className="icebreaker-prompt-chip"
                          onClick={() => {
                            setInputText(prompt);
                            if (inputRef.current) inputRef.current.focus();
                          }}
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="chat-date-separator">
                      <span>Conversation Thread</span>
                    </div>

                    {activeThread.map((msg, index) => {
                      const isMe = Number(msg.sender) === Number(user?.id);
                      const timeStr = formatChatTime(msg.sent_at || msg.created_at);

                      return (
                        <div
                          key={msg.id || index}
                          className={`message-row ${isMe ? "message-row--me" : "message-row--other"}`}
                        >
                          {!isMe && (
                            <div
                              className="message-mini-avatar"
                              style={{ background: getAvatarColor(activeRecipient.name) }}
                              title={activeRecipient.name}
                            >
                              {getInitials(activeRecipient.name)}
                            </div>
                          )}

                          <div className="message-content-wrap">
                            <div
                              className={`message-bubble ${
                                isMe ? "message-bubble--me" : "message-bubble--other"
                              }`}
                            >
                              <div className="message-text">
                                {msg.text || msg.content}
                              </div>

                              <div className="message-footer">
                                <span className="message-time">{timeStr}</span>
                                {isMe && (
                                  <span className="message-status">
                                    {msg.is_read ? (
                                      <CheckCheck size={14} className="status-read" />
                                    ) : (
                                      <Check size={14} className="status-delivered" />
                                    )}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>

              {/* Chat Composer / Input Bar */}
              <div className="chat-composer-wrap">
                {/* Quick Emoji Tray */}
                {showEmojiPicker && (
                  <div className="emoji-tray animate-fade">
                    {QUICK_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        className="emoji-btn"
                        onClick={() => {
                          setInputText((prev) => prev + emoji);
                          if (inputRef.current) inputRef.current.focus();
                        }}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}

                <form className="chat-composer" onSubmit={handleSendMessage}>
                  <button
                    type="button"
                    className={`btn-emoji-toggle ${showEmojiPicker ? "active" : ""}`}
                    onClick={() => setShowEmojiPicker((prev) => !prev)}
                    title="Insert emoji"
                  >
                    <Smile size={18} />
                  </button>

                  <input
                    ref={inputRef}
                    type="text"
                    className="composer-input"
                    placeholder={t("messages.typeMessage", "Type a message... (Press Enter to send)")}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={sending}
                  />

                  <button
                    type="submit"
                    className="btn-send-message"
                    disabled={!inputText.trim() || sending}
                    title={t("messages.send", "Send message")}
                  >
                    <Send size={16} />
                  </button>
                </form>
              </div>
            </>
          ) : (
            /* Empty State: No Active Conversation */
            <div className="chat-empty-state">
              <div className="chat-empty-icon-wrap">
                <MessageSquare size={44} color="#638ECB" />
              </div>
              <h2 className="chat-empty-title">{t("messages.noChatSelected", "Select or Start a Conversation")}</h2>
              <p className="chat-empty-desc">
                {t("messages.subtitle", "Connect and communicate in real time between candidates and hiring companies.")}
              </p>
              <button
                className="btn-add-message"
                onClick={() => setIsNewMessageModalOpen(true)}
              >
                <Plus size={16} />
                <span>{t("messages.addMessage", "+ Add Message for New User")}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Modal: Add Message for New User ── */}
      {isNewMessageModalOpen && (
        <div className="social-modal-overlay animate-fade">
          <div className="social-modal-card">
            <div className="social-modal-header">
              <div>
                <h3 className="social-modal-title">{t("messages.newMessage", "Start a New Message")}</h3>
                <p className="social-modal-subtitle">
                  {t("messages.selectContact", "Search and connect directly with any candidate or company")}
                </p>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setIsNewMessageModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Search Bar */}
            <div className="modal-search-wrap">
              <Search size={16} className="modal-search-icon" />
              <input
                type="text"
                className="modal-search-input"
                placeholder={t("messages.searchContacts", "Search by name, company, university, or role...")}
                value={modalSearch}
                onChange={(e) => setModalSearch(e.target.value)}
                autoFocus
              />
              {modalSearch && (
                <button
                  className="chat-search-clear"
                  onClick={() => setModalSearch("")}
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Role Filter Pills */}
            <div className="modal-filter-pills">
              <button
                className={`filter-pill ${modalRoleFilter === "ALL" ? "active" : ""}`}
                onClick={() => setModalRoleFilter("ALL")}
              >
                All Contacts ({directoryContacts.length})
              </button>
              <button
                className={`filter-pill ${modalRoleFilter === "COMPANY" ? "active" : ""}`}
                onClick={() => setModalRoleFilter("COMPANY")}
              >
                Companies (
                {directoryContacts.filter((c) => c.role === "COMPANY").length}
                )
              </button>
              <button
                className={`filter-pill ${modalRoleFilter === "CANDIDATE" ? "active" : ""}`}
                onClick={() => setModalRoleFilter("CANDIDATE")}
              >
                Candidates (
                {directoryContacts.filter((c) => c.role === "CANDIDATE").length}
                )
              </button>
            </div>

            {/* Contacts Directory List */}
            <div className="modal-contacts-list">
              {modalFilteredContacts.length === 0 ? (
                <div className="modal-no-results">
                  <UserIcon size={28} className="no-res-icon" />
                  <p>No matching users found.</p>
                </div>
              ) : (
                modalFilteredContacts.map((contact) => {
                  const isCompany = contact.role === "COMPANY";
                  return (
                    <div
                      key={contact.userId}
                      className="modal-contact-row"
                      onClick={() => handleStartChatWithContact(contact)}
                    >
                      <div
                        className="modal-contact-avatar"
                        style={{ background: getAvatarColor(contact.name) }}
                      >
                        {getInitials(contact.name)}
                      </div>

                      <div className="modal-contact-info">
                        <div className="modal-contact-title-row">
                          <span className="modal-contact-name">
                            {contact.name}
                          </span>
                          <span
                            className={`conv-role-badge ${
                              isCompany ? "role-company" : "role-candidate"
                            }`}
                          >
                            {isCompany ? "Company" : "Candidate"}
                          </span>
                        </div>
                        <p className="modal-contact-sub">
                          {contact.headline}
                        </p>
                      </div>

                      <button
                        className="modal-contact-action"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartChatWithContact(contact);
                        }}
                      >
                        <MessageSquare size={14} />
                        <span>Chat</span>
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
