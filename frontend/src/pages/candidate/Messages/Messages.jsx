import { useState } from "react";
import "./Messages.css";

export default function CandidateMessages() {
  const [activeChat, setActiveChat] = useState(1);
  const [inputText, setInputText] = useState("");

  const chatSessions = [
    { id: 1, company: "Mekong Digital" },
    // You could add more mock chats here later
  ];

  const [messages, setMessages] = useState([]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    setMessages([...messages, {
      id: messages.length + 1,
      text: inputText,
      sender: "user",
      time: "Just now"
    }]);
    
    setInputText("");
  };

  return (
    <div className="messages-page">
      <h1 className="messages-page__title">Messages</h1>
      
      <div className="messages-container">
        
        {/* Left Column: Chat List */}
        <div className="messages-sidebar">
          {chatSessions.map(chat => (
            <button 
              key={chat.id}
              className={`messages-sidebar__item ${activeChat === chat.id ? "active" : ""}`}
              onClick={() => setActiveChat(chat.id)}
            >
              {chat.company}
            </button>
          ))}
        </div>

        {/* Right Column: Chat Window */}
        <div className="messages-chat">
          <div className="messages-chat__history">
            {messages.length === 0 ? (
              <div style={{ textAlign: "center", color: "#94a3b8", margin: "auto", fontSize: "14px", marginTop: "60px" }}>
                No messages yet.
              </div>
            ) : (
              messages.map(msg => (
                <div key={msg.id} className={`chat-bubble-wrapper ${msg.sender === "user" ? "chat-bubble-wrapper--right" : "chat-bubble-wrapper--left"}`}>
                  <div className={`chat-bubble ${msg.sender === "user" ? "chat-bubble--user" : "chat-bubble--company"}`}>
                    {msg.text}
                  </div>
                </div>
              ))
            )}
          </div>

          <form className="messages-chat__input-area" onSubmit={handleSend}>
            <input 
              type="text" 
              className="messages-chat__input" 
              placeholder="Write a message" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
            <button type="submit" className="messages-chat__send-btn">
              Send
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
