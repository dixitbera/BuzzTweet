import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Send, Smile, ArrowLeft, MoreVertical, Phone, Video, X,
} from "lucide-react";

const QUICK_EMOJIS = [
  "😊","😂","❤️","👍","🎉","🔥","💯","🙌","😢","😮",
  "🥰","😎","👏","🤔","😅","🙏","✨","💪","🥳","😭",
];

// How long (ms) to wait after last keystroke before emitting stopTyping
const TYPING_IDLE_MS = 2000;

function ChatPage({
  messages = [],
  currentUserId,
  selectedUser,
  onSendMessage,
  socket,
  lastReadAt,
  onBack,
  onProfileClick,
  isOnline = false,       // ← controlled by parent (Messages.jsx)
}) {
  const messagesEndRef   = useRef(null);
  const inputRef         = useRef(null);
  const emojiPickerRef   = useRef(null);
  const typingTimerRef   = useRef(null);   // timeout handle for stopTyping
  const isTypingEmitted  = useRef(false);  // track if 'typing' is currently active

  const [messageText,    setMessageText]    = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isTyping, setIsTyping] = useState(false); // remote user is typing


  // ── Typing listeners ─────────────────────────────────────────────────────
  useEffect(() => {
    const sock = socket?.current;
    if (!sock || !selectedUser) return;

    const onTyping = ({ sender }) => {
      if (sender === selectedUser.userId) setIsTyping(true);
    };
    const onStopTyping = ({ sender }) => {
      if (sender === selectedUser.userId) setIsTyping(false);
    };

    sock.on("typing",     onTyping);
    sock.on("stopTyping", onStopTyping);

    return () => {
      sock.off("typing",     onTyping);
      sock.off("stopTyping", onStopTyping);
    };
  }, [socket, selectedUser]);

  // ── Auto-scroll ───────────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // ── Focus input on conversation switch ───────────────────────────────────
  useEffect(() => {
    inputRef.current?.focus();
  }, [selectedUser]);

  // ── Close emoji picker on outside click ──────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const formatTimestamp = (ts) =>
    new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const isCurrentUser = (msg) => {
    const id = typeof msg.sender === "object" ? msg.sender._id : msg.sender;
    return id === currentUserId;
  };

  const groupMessagesByDate = (msgs) => {
    const groups = {};
    msgs.forEach((msg) => {
      const d = new Date(msg.timestamp).toLocaleDateString();
      if (!groups[d]) groups[d] = [];
      groups[d].push(msg);
    });
    return groups;
  };

  const formatDateLabel = (dateStr) => {
    const today     = new Date().toLocaleDateString();
    const yesterday = new Date(Date.now() - 86400000).toLocaleDateString();
    if (dateStr === today)     return "Today";
    if (dateStr === yesterday) return "Yesterday";
    return new Date(dateStr).toLocaleDateString(undefined, {
      weekday: "long", month: "short", day: "numeric",
    });
  };

  // ── Send message ──────────────────────────────────────────────────────────
  const handleSend = () => {
    if (!messageText.trim()) return;
    // Stop typing indicator before sending
    emitStopTyping();
    onSendMessage?.(messageText);
    setMessageText("");
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── Typing emit helpers ───────────────────────────────────────────────────
  const emitStopTyping = useCallback(() => {
    if (isTypingEmitted.current && socket?.current && selectedUser) {
      socket.current.emit("stopTyping", { receiver: selectedUser.userId });
      isTypingEmitted.current = false;
    }
    clearTimeout(typingTimerRef.current);
  }, [socket, selectedUser]);

  const handleInputChange = (e) => {
    setMessageText(e.target.value);

    if (!socket?.current || !selectedUser) return;

    // If we haven't told the server we're typing yet, do it now
    if (!isTypingEmitted.current) {
      socket.current.emit("typing", { receiver: selectedUser.userId });
      isTypingEmitted.current = true;
    }

    // Reset the idle timer every keystroke
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(emitStopTyping, TYPING_IDLE_MS);
  };

  const addEmoji = (emoji) => {
    setMessageText((prev) => prev + emoji);
    inputRef.current?.focus();
  };

  const messageGroups = groupMessagesByDate(messages);

  // ── Status text for header ────────────────────────────────────────────────
  const statusText = isTyping ? null : (isOnline ? "Online" : "Offline");

  return (
    <div className="chat-page-root">

      {/* ════════════════ HEADER ════════════════ */}
      <div className="chat-header">
        {onBack && (
          <button className="chat-back-btn" onClick={onBack} aria-label="Back">
            <ArrowLeft size={20} />
          </button>
        )}

        {selectedUser && (
          <button
            className="chat-header-user"
            onClick={() => onProfileClick?.(selectedUser.username)}
            title={`View ${selectedUser.username}'s profile`}
          >
            <div className="chat-header-avatar">
              <span>{selectedUser.username?.charAt(0).toUpperCase()}</span>
              {isOnline && <span className="chat-header-online-dot" />}
            </div>
            <div className="chat-header-info">
              <span className="chat-header-name">{selectedUser.username}</span>

              {/* Typing indicator replaces status text */}
              {isTyping ? (
                <span className="chat-header-typing">
                  <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
                  typing…
                </span>
              ) : (
                <span className={`chat-header-status ${isOnline ? "status-online" : "status-offline"}`}>
                  {isOnline ? "Online" : "Offline"}
                </span>
              )}
            </div>
          </button>
        )}

        <div className="chat-header-actions">
          <button className="chat-action-btn" title="Voice call"><Phone size={18} /></button>
          <button className="chat-action-btn" title="Video call"><Video size={18} /></button>
          <button className="chat-action-btn" title="More options"><MoreVertical size={18} /></button>
        </div>
      </div>

      {/* ════════════════ MESSAGES / EMPTY ════════════════ */}
      {messages.length === 0 ? (
        <div className="chat-body-empty">
          <div className="chat-empty-bubble-wrap">
            <div className="chat-empty-bubble-icon">
              <svg width="44" height="44" fill="none" stroke="#fff" viewBox="0 0 24 24" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="chat-empty-title">No messages yet</h3>
            <p className="chat-empty-sub">Say hello to <strong>{selectedUser?.username}</strong>!</p>
          </div>
        </div>
      ) : (
        <div className="chat-messages-scroll">
          {Object.entries(messageGroups).map(([date, dateMessages]) => (
            <div key={date}>
              <div className="chat-date-sep"><span>{formatDateLabel(date)}</span></div>

              {dateMessages.map((msg, index) => {
                const isSender = isCurrentUser(msg);
                const prevMsg  = dateMessages[index - 1];
                const prevSenderId = prevMsg
                  ? typeof prevMsg.sender === "object" ? prevMsg.sender._id : prevMsg.sender
                  : null;
                const curSenderId = typeof msg.sender === "object" ? msg.sender._id : msg.sender;
                const isGroupStart = prevSenderId !== curSenderId;
                const isSeen = lastReadAt && new Date(msg.timestamp) <= new Date(lastReadAt);

                return (
                  <div
                    key={msg._id}
                    className={`msg-row ${isSender ? "msg-row-sent" : "msg-row-received"} ${isGroupStart ? "msg-group-start" : ""}`}
                  >
                    {/* Received side avatar */}
                    {!isSender && (
                      <div className="msg-avatar-col">
                        {isGroupStart
                          ? <div className="msg-avatar received-avatar">{msg.sender?.username?.charAt(0).toUpperCase()}</div>
                          : <div className="msg-avatar-spacer" />}
                      </div>
                    )}

                    {/* Bubble */}
                    <div className={`msg-bubble-col ${isSender ? "bubble-col-sent" : "bubble-col-received"}`}>
                      {!isSender && isGroupStart && (
                        <span className="msg-sender-name">{msg.sender?.username}</span>
                      )}
                      <div className={`msg-bubble ${isSender ? "bubble-sent" : "bubble-received"}`}>
                        <p className="msg-text">{msg.content}</p>
                      </div>
                      <div className={`msg-meta ${isSender ? "msg-meta-right" : "msg-meta-left"}`}>
                        <span>{formatTimestamp(msg.timestamp)}</span>
                        {isSender && (
                          <span className={`msg-tick ${isSeen ? "msg-tick-seen" : ""}`}>
                            {isSeen ? "✓✓" : "✓"}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* NO avatar on sent side — avoids the "6" bug (MongoDB IDs start with 6) */}
                  </div>
                );
              })}
            </div>
          ))}

          {/* ── Typing bubble (remote user is typing) ── */}
          {isTyping && (
            <div className="msg-row msg-row-received msg-group-start">
              <div className="msg-avatar-col">
                <div className="msg-avatar received-avatar">
                  {selectedUser?.username?.charAt(0).toUpperCase()}
                </div>
              </div>
              <div className="msg-bubble-col bubble-col-received">
                <div className="msg-bubble bubble-received typing-bubble">
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      )}

      {/* ════════════════ INPUT ════════════════ */}
      <div className="chat-input-area">
        {showEmojiPicker && (
          <div className="emoji-picker" ref={emojiPickerRef}>
            <div className="emoji-picker-header">
              <span>Quick Emojis</span>
              <button onClick={() => setShowEmojiPicker(false)}><X size={14} /></button>
            </div>
            <div className="emoji-grid">
              {QUICK_EMOJIS.map((emoji, i) => (
                <button
                  key={i}
                  onMouseDown={(e) => { e.preventDefault(); addEmoji(emoji); }}
                  className="emoji-btn"
                >{emoji}</button>
              ))}
            </div>
          </div>
        )}

        <div className="chat-input-row">
          <button
            className={`chat-input-icon-btn ${showEmojiPicker ? "active" : ""}`}
            onMouseDown={(e) => { e.preventDefault(); setShowEmojiPicker((v) => !v); }}
            title="Emoji"
          >
            <Smile size={20} />
          </button>

          <div className="chat-input-wrapper">
            <textarea
              ref={inputRef}
              value={messageText}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Type a message…"
              className="chat-textarea"
              rows={1}
            />
          </div>

          <button
            onMouseDown={(e) => { e.preventDefault(); handleSend(); }}
            disabled={!messageText.trim()}
            className="chat-send-btn"
            title="Send"
          >
            <Send size={18} />
          </button>
        </div>
      </div>

      {/* ════════════════ STYLES ════════════════ */}
      <style>{`
        .chat-page-root {
          display: flex; flex-direction: column;
          flex: 1; min-height: 0;
          background: #f0f2f5; position: relative;
        }

        /* Header */
        .chat-header {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 14px; background: #fff;
          border-bottom: 1px solid #e5e7eb;
          box-shadow: 0 1px 4px rgba(0,0,0,0.06);
          z-index: 10; flex-shrink: 0;
        }
        .chat-back-btn {
          background: none; border: none; cursor: pointer;
          color: #6b7280; padding: 6px; border-radius: 8px;
          display: flex; align-items: center;
          transition: background .15s, color .15s;
        }
        .chat-back-btn:hover { background: #f3f4f6; color: #6366f1; }
        @media (min-width: 768px) { .chat-back-btn { display: none; } }

        .chat-header-user {
          display: flex; align-items: center; gap: 10px;
          background: none; border: none; cursor: pointer;
          flex: 1; text-align: left; padding: 4px 6px;
          border-radius: 10px; transition: background .15s; min-width: 0;
        }
        .chat-header-user:hover { background: #f3f4f6; }

        .chat-header-avatar {
          position: relative; width: 40px; height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg,#6366f1 0%,#a855f7 50%,#ec4899 100%);
          display: flex; align-items: center; justify-content: center;
          color: #fff; font-weight: 700; font-size: 15px; flex-shrink: 0;
        }
        .chat-header-online-dot {
          position: absolute; bottom: 1px; right: 1px;
          width: 11px; height: 11px; background: #22c55e;
          border-radius: 50%; border: 2px solid #fff;
          animation: pulse-online 2s infinite;
        }
        @keyframes pulse-online {
          0%,100% { box-shadow: 0 0 0 0 rgba(34,197,94,.5); }
          50%      { box-shadow: 0 0 0 4px rgba(34,197,94,0); }
        }

        .chat-header-info { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
        .chat-header-name {
          font-size: 15px; font-weight: 600; color: #111827;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .chat-header-status { font-size: 12px; font-weight: 500; }
        .status-online  { color: #22c55e; }
        .status-offline { color: #9ca3af; }

        /* Typing text in header */
        .chat-header-typing {
          display: flex; align-items: center; gap: 4px;
          font-size: 12px; color: #6366f1; font-style: italic;
        }
        .chat-header-typing .typing-dot {
          width: 5px; height: 5px; border-radius: 50%; background: #6366f1;
          animation: typing-bounce .9s infinite ease-in-out;
        }
        .chat-header-typing .typing-dot:nth-child(2) { animation-delay: .15s; }
        .chat-header-typing .typing-dot:nth-child(3) { animation-delay: .30s; }

        .chat-header-actions { display: flex; align-items: center; gap: 4px; flex-shrink: 0; }
        .chat-action-btn {
          background: none; border: none; cursor: pointer;
          color: #6b7280; padding: 7px; border-radius: 8px;
          display: flex; align-items: center;
          transition: background .15s, color .15s;
        }
        .chat-action-btn:hover { background: #f3f4f6; color: #6366f1; }

        /* Messages scroll */
        .chat-messages-scroll {
          flex: 1; overflow-y: auto;
          padding: 12px 10px 8px;
          display: flex; flex-direction: column; gap: 2px;
          overscroll-behavior: contain;
        }
        .chat-messages-scroll::-webkit-scrollbar { width: 4px; }
        .chat-messages-scroll::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 4px; }
        @media (min-width: 480px) { .chat-messages-scroll { padding: 16px 16px 10px; } }

        .chat-date-sep { display: flex; justify-content: center; margin: 12px 0 8px; }
        .chat-date-sep span {
          background: #e5e7eb; color: #6b7280; font-size: 11.5px;
          padding: 3px 12px; border-radius: 999px; font-weight: 500;
        }

        /* Message rows */
        .msg-row { display: flex; align-items: flex-end; gap: 6px; margin-bottom: 2px; }
        .msg-row.msg-group-start { margin-top: 8px; }
        .msg-row-sent     { justify-content: flex-end; }
        .msg-row-received { justify-content: flex-start; }

        .msg-avatar-col { width: 30px; flex-shrink: 0; }
        .msg-avatar {
          width: 30px; height: 30px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 700; color: #fff;
        }
        .received-avatar { background: linear-gradient(135deg,#6366f1,#a855f7); }
        .msg-avatar-spacer { width: 30px; height: 30px; }

        .msg-bubble-col { display: flex; flex-direction: column; max-width: min(70%,340px); }
        @media (max-width: 480px) { .msg-bubble-col { max-width: 80%; } }
        .bubble-col-sent     { align-items: flex-end; }
        .bubble-col-received { align-items: flex-start; }

        .msg-sender-name { font-size: 11px; color: #6b7280; margin-bottom: 2px; padding-left: 2px; }

        .msg-bubble { padding: 9px 14px; border-radius: 18px; word-break: break-word; }
        .bubble-sent {
          background: linear-gradient(135deg,#6366f1 0%,#818cf8 100%);
          color: #fff; border-bottom-right-radius: 4px;
        }
        .bubble-received {
          background: #fff; color: #1f2937;
          border-bottom-left-radius: 4px;
          box-shadow: 0 1px 3px rgba(0,0,0,.08);
        }
        .msg-text { font-size: 14px; line-height: 1.5; white-space: pre-wrap; margin: 0; }

        .msg-meta {
          display: flex; align-items: center; gap: 3px;
          margin-top: 3px; font-size: 11px; color: #9ca3af; padding: 0 2px;
        }
        .msg-meta-right { justify-content: flex-end; }
        .msg-meta-left  { justify-content: flex-start; }
        .msg-tick       { color: #9ca3af; }
        .msg-tick-seen  { color: #6366f1; font-weight: 700; }

        /* Typing bubble in message list */
        .typing-bubble {
          display: flex !important; align-items: center; gap: 5px;
          padding: 12px 16px !important;
        }
        .typing-bubble .typing-dot {
          width: 7px; height: 7px; border-radius: 50%; background: #9ca3af;
          animation: typing-bounce .9s infinite ease-in-out;
        }
        .typing-bubble .typing-dot:nth-child(2) { animation-delay: .15s; }
        .typing-bubble .typing-dot:nth-child(3) { animation-delay: .30s; }
        @keyframes typing-bounce {
          0%,80%,100% { transform: translateY(0); opacity: .4; }
          40%          { transform: translateY(-6px); opacity: 1; }
        }

        /* Empty state */
        .chat-body-empty {
          flex: 1; display: flex; align-items: center;
          justify-content: center; padding: 24px;
        }
        .chat-empty-bubble-wrap {
          display: flex; flex-direction: column;
          align-items: center; gap: 12px; text-align: center;
        }
        .chat-empty-bubble-icon {
          width: 88px; height: 88px; border-radius: 50%;
          background: linear-gradient(135deg,#6366f1,#a855f7,#ec4899);
          display: flex; align-items: center; justify-content: center;
        }
        .chat-empty-title { font-size: 20px; font-weight: 700; color: #1f2937; margin: 0; }
        .chat-empty-sub   { font-size: 14px; color: #6b7280; margin: 0; }

        /* Input */
        .chat-input-area {
          background: #fff; border-top: 1px solid #e5e7eb;
          padding: 10px 12px; position: relative; flex-shrink: 0;
        }
        @media (min-width: 480px) { .chat-input-area { padding: 12px 16px; } }

        .chat-input-row {
          display: flex; align-items: flex-end; gap: 8px;
          background: #f3f4f6; border-radius: 24px;
          padding: 6px 8px 6px 12px;
          border: 1.5px solid transparent;
          transition: border-color .2s, background .2s;
        }
        .chat-input-row:focus-within { border-color: #6366f1; background: #fff; }

        .chat-input-icon-btn {
          background: none; border: none; cursor: pointer;
          color: #6b7280; padding: 4px; border-radius: 50%;
          display: flex; align-items: center;
          transition: color .15s; flex-shrink: 0;
        }
        .chat-input-icon-btn:hover, .chat-input-icon-btn.active { color: #6366f1; }

        .chat-input-wrapper { flex: 1; min-width: 0; }
        .chat-textarea {
          width: 100%; background: transparent;
          border: none; outline: none; resize: none;
          font-size: 14px; color: #1f2937; line-height: 1.5;
          max-height: 100px; overflow-y: auto;
          font-family: inherit; padding: 4px 0;
        }
        .chat-textarea::placeholder { color: #9ca3af; }

        .chat-send-btn {
          background: linear-gradient(135deg,#6366f1,#818cf8);
          border: none; cursor: pointer; color: #fff;
          width: 36px; height: 36px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          transition: transform .15s, opacity .15s; flex-shrink: 0;
        }
        .chat-send-btn:hover:not(:disabled) { transform: scale(1.08); }
        .chat-send-btn:disabled { opacity: .4; cursor: not-allowed; }

        /* Emoji picker */
        .emoji-picker {
          position: absolute; bottom: calc(100% + 8px); left: 12px;
          background: #fff; border: 1px solid #e5e7eb; border-radius: 14px;
          box-shadow: 0 8px 24px rgba(0,0,0,.12);
          padding: 10px; z-index: 50; width: 240px;
        }
        @media (max-width: 400px) { .emoji-picker { width: calc(100vw - 40px); left: 8px; } }
        .emoji-picker-header {
          display: flex; justify-content: space-between; align-items: center;
          font-size: 12px; font-weight: 600; color: #6b7280;
          margin-bottom: 8px; padding: 0 2px;
        }
        .emoji-picker-header button {
          background: none; border: none; cursor: pointer;
          color: #9ca3af; display: flex; align-items: center;
        }
        .emoji-grid { display: grid; grid-template-columns: repeat(5,1fr); gap: 4px; }
        .emoji-btn {
          background: none; border: none; cursor: pointer;
          font-size: 22px; border-radius: 8px; padding: 4px;
          transition: background .12s, transform .12s; line-height: 1;
        }
        .emoji-btn:hover { background: #f3f4f6; transform: scale(1.15); }
      `}</style>
    </div>
  );
}

export default ChatPage;
