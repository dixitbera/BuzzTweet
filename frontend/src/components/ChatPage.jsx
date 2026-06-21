import React, { useState, useEffect, useRef, useCallback } from "react";
import { Send, Smile, ArrowLeft, MoreVertical, Phone, Video, X } from "lucide-react";

const QUICK_EMOJIS = [
  "😊", "😂", "❤️", "👍", "🎉", "🔥", "💯", "🙌", "😢", "😮",
  "🥰", "😎", "👏", "🤔", "😅", "🙏", "✨", "💪", "🥳", "😭",
];
const TYPING_IDLE_MS = 2000;

function ChatPage({
  messages = [], currentUserId, selectedUser,
  onSendMessage, socket, lastReadAt,
  onBack, onProfileClick, isOnline = false,
}) {
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const typingTimerRef = useRef(null);
  const isTypingEmitted = useRef(false);

  const [messageText, setMessageText] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  // Typing listeners
  useEffect(() => {
    const sock = socket?.current;
    if (!sock || !selectedUser) return;
    const onTyping = ({ sender }) => { if (sender === selectedUser.userId) setIsTyping(true); };
    const onStopTyping = ({ sender }) => { if (sender === selectedUser.userId) setIsTyping(false); };
    sock.on("typing", onTyping);
    sock.on("stopTyping", onStopTyping);
    return () => { sock.off("typing", onTyping); sock.off("stopTyping", onStopTyping); };
  }, [socket, selectedUser]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isTyping]);
  useEffect(() => { inputRef.current?.focus(); }, [selectedUser]);
  useEffect(() => {
    const handler = (e) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target)) setShowEmojiPicker(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const formatTimestamp = (ts) => new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
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
    const today = new Date().toLocaleDateString();
    const yesterday = new Date(Date.now() - 86400000).toLocaleDateString();
    if (dateStr === today) return "Today";
    if (dateStr === yesterday) return "Yesterday";
    return new Date(dateStr).toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
  };

  const emitStopTyping = useCallback(() => {
    if (isTypingEmitted.current && socket?.current && selectedUser) {
      socket.current.emit("stopTyping", { receiver: selectedUser.userId });
      isTypingEmitted.current = false;
    }
    clearTimeout(typingTimerRef.current);
  }, [socket, selectedUser]);

  const handleSend = () => {
    if (!messageText.trim()) return;
    emitStopTyping();
    onSendMessage?.(messageText);
    setMessageText("");
    setShowEmojiPicker(false);
    // Use a small timeout so the virtual keyboard doesn't close on mobile
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleKeyDown = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } };

  const handleInputChange = (e) => {
    setMessageText(e.target.value);
    if (!socket?.current || !selectedUser) return;
    if (!isTypingEmitted.current) {
      socket.current.emit("typing", { receiver: selectedUser.userId });
      isTypingEmitted.current = true;
    }
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(emitStopTyping, TYPING_IDLE_MS);
  };

  const addEmoji = (emoji) => {
    setMessageText((prev) => prev + emoji);
    setTimeout(() => inputRef.current?.focus(), 50);
  };
  const messageGroups = groupMessagesByDate(messages);

  return (
    <div className="chat-page-root">
      {/* ── Header ── */}
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
          <button className="chat-action-btn" title="Voice call" aria-label="Voice call"><Phone size={18} /></button>
          <button className="chat-action-btn" title="Video call" aria-label="Video call"><Video size={18} /></button>
          <button className="chat-action-btn" title="More" aria-label="More options"><MoreVertical size={18} /></button>
        </div>
      </div>

      {/* ── Messages ── */}
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
                const prevMsg = dateMessages[index - 1];
                const prevSenderId = prevMsg ? (typeof prevMsg.sender === "object" ? prevMsg.sender._id : prevMsg.sender) : null;
                const curSenderId = typeof msg.sender === "object" ? msg.sender._id : msg.sender;
                const isGroupStart = prevSenderId !== curSenderId;
                const isSeen = lastReadAt && new Date(msg.timestamp) <= new Date(lastReadAt);

                return (
                  <div
                    key={msg._id}
                    className={`msg-row ${isSender ? "msg-row-sent" : "msg-row-received"} ${isGroupStart ? "msg-group-start" : ""}`}
                  >
                    {!isSender && (
                      <div className="msg-avatar-col">
                        {isGroupStart
                          ? <div className="msg-avatar received-avatar">{msg.sender?.username?.charAt(0).toUpperCase()}</div>
                          : <div className="msg-avatar-spacer" />}
                      </div>
                    )}
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
                  </div>
                );
              })}
            </div>
          ))}

          {/* Typing bubble */}
          {isTyping && (
            <div className="msg-row msg-row-received msg-group-start">
              <div className="msg-avatar-col">
                <div className="msg-avatar received-avatar">
                  {selectedUser?.username?.charAt(0).toUpperCase()}
                </div>
              </div>
              <div className="msg-bubble-col bubble-col-received">
                <div className="msg-bubble bubble-received typing-bubble">
                  <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      )}

      {/* ── Input ── */}
      <div className="chat-input-area">
        {showEmojiPicker && (
          <div className="emoji-picker" ref={emojiPickerRef}>
            <div className="emoji-picker-header">
              <span>Quick Emojis</span>
              <button
                onClick={(e) => { e.preventDefault(); setShowEmojiPicker(false); }}
                aria-label="Close emoji picker"
              >
                <X size={14} />
              </button>
            </div>
            <div className="emoji-grid">
              {QUICK_EMOJIS.map((emoji, i) => (
                <button
                  key={i}
                  onPointerDown={(e) => { e.preventDefault(); addEmoji(emoji); }}
                  className="emoji-btn"
                  aria-label={emoji}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="chat-input-row">
          <button
            className={`chat-input-icon-btn ${showEmojiPicker ? "active" : ""}`}
            onPointerDown={(e) => { e.preventDefault(); setShowEmojiPicker((v) => !v); }}
            title="Emoji"
            aria-label="Open emoji picker"
            type="button"
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
              aria-label="Message input"
              autoComplete="off"
              autoCorrect="on"
              autoCapitalize="sentences"
              spellCheck="true"
            />
          </div>

          <button
            onPointerDown={(e) => { e.preventDefault(); handleSend(); }}
            disabled={!messageText.trim()}
            className="chat-send-btn"
            title="Send"
            aria-label="Send message"
            type="button"
          >
            <Send size={18} />
          </button>
        </div>
      </div>

      {/* ── Styles ── */}
      <style>{`
        /* ── Root: fill parent flex cell, never overflow ── */
        .chat-page-root {
          display: flex;
          flex-direction: column;
          flex: 1;
          min-height: 0;
          position: relative;
          background: #080810;
          overflow: hidden;
        }

        /* ── Header ── */
        .chat-header {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 14px;
          background: rgba(13,14,28,0.97);
          border-bottom: 1px solid rgba(255,255,255,0.06);
          box-shadow: 0 1px 12px rgba(0,0,0,0.3);
          z-index: 10; flex-shrink: 0;
          /* safe area for notched phones */
          padding-left: max(14px, env(safe-area-inset-left));
          padding-right: max(14px, env(safe-area-inset-right));
        }
        .chat-back-btn {
          background: none; border: none; cursor: pointer;
          color: #64748b; padding: 8px; border-radius: 8px;
          display: flex; align-items: center;
          -webkit-tap-highlight-color: transparent;
          transition: background .15s, color .15s;
          min-width: 36px; min-height: 36px;
        }
        .chat-back-btn:hover, .chat-back-btn:active { background: rgba(255,255,255,0.06); color: #6366f1; }
        @media (min-width: 768px) { .chat-back-btn { display: none; } }

        .chat-header-user {
          display: flex; align-items: center; gap: 10px;
          background: none; border: none; cursor: pointer;
          flex: 1; text-align: left; padding: 4px 6px;
          border-radius: 10px; transition: background .15s; min-width: 0;
          -webkit-tap-highlight-color: transparent;
        }
        .chat-header-user:hover, .chat-header-user:active { background: rgba(255,255,255,0.04); }

        .chat-header-avatar {
          position: relative; width: 38px; height: 38px;
          border-radius: 50%;
          background: linear-gradient(135deg, #6366f1, #a855f7);
          display: flex; align-items: center; justify-content: center;
          color: #fff; font-weight: 700; font-size: 15px; flex-shrink: 0;
        }
        .chat-header-online-dot {
          position: absolute; bottom: 1px; right: 1px;
          width: 10px; height: 10px; background: #22c55e;
          border-radius: 50%; border: 2px solid #0d0e1c;
          box-shadow: 0 0 6px rgba(34,197,94,0.6);
          animation: online-pulse 2s infinite;
        }
        @keyframes online-pulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.4); }
          50%      { box-shadow: 0 0 0 4px rgba(34,197,94,0); }
        }

        .chat-header-info { display: flex; flex-direction: column; gap: 2px; min-width: 0; overflow: hidden; }
        .chat-header-name {
          font-size: 15px; font-weight: 600; color: #f1f5f9;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .chat-header-status { font-size: 12px; font-weight: 500; }
        .status-online  { color: #22c55e; }
        .status-offline { color: #475569; }

        .chat-header-typing {
          display: flex; align-items: center; gap: 4px;
          font-size: 12px; color: #818cf8; font-style: italic;
        }
        .chat-header-typing .typing-dot {
          width: 5px; height: 5px; border-radius: 50%; background: #6366f1;
          animation: typing-bounce .9s infinite ease-in-out;
        }
        .chat-header-typing .typing-dot:nth-child(2) { animation-delay: .15s; }
        .chat-header-typing .typing-dot:nth-child(3) { animation-delay: .30s; }

        .chat-header-actions { display: flex; align-items: center; gap: 2px; flex-shrink: 0; }
        .chat-action-btn {
          background: none; border: none; cursor: pointer;
          color: #475569; padding: 7px; border-radius: 8px;
          display: flex; align-items: center;
          -webkit-tap-highlight-color: transparent;
          transition: background .15s, color .15s;
          min-width: 34px; min-height: 34px;
        }
        .chat-action-btn:hover, .chat-action-btn:active { background: rgba(255,255,255,0.06); color: #6366f1; }
        /* Hide call buttons on very narrow screens to save space */
        @media (max-width: 360px) { .chat-action-btn:not(:last-child) { display: none; } }

        /* ── Messages scroll: fills all remaining vertical space ── */
        .chat-messages-scroll {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 12px 10px 8px;
          display: flex;
          flex-direction: column;
          gap: 2px;
          overscroll-behavior: contain;
          -webkit-overflow-scrolling: touch;
          background: #080810;
          /* allow scroll to reach last message above input */
          scroll-padding-bottom: 8px;
        }
        .chat-messages-scroll::-webkit-scrollbar { width: 4px; }
        .chat-messages-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }
        @media (min-width: 480px) { .chat-messages-scroll { padding: 16px 16px 10px; } }

        .chat-date-sep { display: flex; justify-content: center; margin: 12px 0 8px; }
        .chat-date-sep span {
          background: rgba(255,255,255,0.06); color: #475569; font-size: 11.5px;
          padding: 3px 12px; border-radius: 999px; font-weight: 500;
          border: 1px solid rgba(255,255,255,0.06);
        }

        /* ── Message rows ── */
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
        .received-avatar { background: linear-gradient(135deg, #6366f1, #a855f7); }
        .msg-avatar-spacer { width: 30px; height: 30px; }

        .msg-bubble-col { display: flex; flex-direction: column; max-width: min(72%, 340px); }
        @media (max-width: 480px) { .msg-bubble-col { max-width: 82%; } }
        @media (max-width: 360px) { .msg-bubble-col { max-width: 88%; } }
        .bubble-col-sent     { align-items: flex-end; }
        .bubble-col-received { align-items: flex-start; }

        .msg-sender-name { font-size: 11px; color: #64748b; margin-bottom: 2px; padding-left: 2px; }

        .msg-bubble { padding: 9px 13px; border-radius: 18px; word-break: break-word; }
        @media (max-width: 360px) { .msg-bubble { padding: 8px 11px; } }
        .bubble-sent {
          background: linear-gradient(135deg, #6366f1, #818cf8);
          color: #fff; border-bottom-right-radius: 4px;
          box-shadow: 0 4px 12px rgba(99,102,241,0.3);
        }
        .bubble-received {
          background: rgba(255,255,255,0.07); color: #e2e8f0;
          border-bottom-left-radius: 4px;
          border: 1px solid rgba(255,255,255,0.07);
        }
        .msg-text { font-size: 14px; line-height: 1.5; white-space: pre-wrap; margin: 0; }
        @media (max-width: 360px) { .msg-text { font-size: 13px; } }

        .msg-meta {
          display: flex; align-items: center; gap: 3px;
          margin-top: 3px; font-size: 11px; color: #475569; padding: 0 2px;
        }
        .msg-meta-right { justify-content: flex-end; }
        .msg-meta-left  { justify-content: flex-start; }
        .msg-tick       { color: #475569; }
        .msg-tick-seen  { color: #818cf8; font-weight: 700; }

        /* ── Typing bubble ── */
        .typing-bubble {
          display: flex !important; align-items: center; gap: 5px;
          padding: 12px 16px !important;
        }
        .typing-bubble .typing-dot {
          width: 7px; height: 7px; border-radius: 50%; background: #475569;
          animation: typing-bounce .9s infinite ease-in-out;
        }
        .typing-bubble .typing-dot:nth-child(2) { animation-delay: .15s; }
        .typing-bubble .typing-dot:nth-child(3) { animation-delay: .30s; }
        @keyframes typing-bounce {
          0%,80%,100% { transform: translateY(0); opacity: .4; }
          40%          { transform: translateY(-6px); opacity: 1; }
        }

        /* ── Empty state ── */
        .chat-body-empty {
          flex: 1; display: flex; align-items: center;
          justify-content: center; padding: 24px;
          background: #080810; overflow: hidden;
        }
        .chat-empty-bubble-wrap {
          display: flex; flex-direction: column;
          align-items: center; gap: 12px; text-align: center;
        }
        .chat-empty-bubble-icon {
          width: 80px; height: 80px; border-radius: 50%;
          background: linear-gradient(135deg, #6366f1, #a855f7);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 0 40px rgba(99,102,241,0.3);
        }
        @media (max-width: 360px) { .chat-empty-bubble-icon { width: 64px; height: 64px; } }
        .chat-empty-title { font-size: 18px; font-weight: 700; color: #f1f5f9; margin: 0; }
        .chat-empty-sub   { font-size: 13px; color: #475569; margin: 0; }
        .chat-empty-sub strong { color: #a5b4fc; }

        /* ── Input area ── */
        .chat-input-area {
          background: rgba(13,14,28,0.97);
          border-top: 1px solid rgba(255,255,255,0.06);
          padding: 8px 10px;
          position: relative;
          flex-shrink: 0;
          z-index: 5;
        }
        @media (min-width: 480px) {
          .chat-input-area { padding: 10px 14px; }
        }

        .chat-input-row {
          display: flex; align-items: flex-end; gap: 6px;
          background: rgba(255,255,255,0.05); border-radius: 24px;
          padding: 5px 6px 5px 10px;
          border: 1.5px solid rgba(255,255,255,0.08);
          transition: border-color .2s, background .2s;
        }
        .chat-input-row:focus-within {
          border-color: rgba(99,102,241,0.5);
          background: rgba(255,255,255,0.07);
        }

        .chat-input-icon-btn {
          background: none; border: none; cursor: pointer;
          color: #475569; padding: 6px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          transition: color .15s; flex-shrink: 0;
          -webkit-tap-highlight-color: transparent;
          min-width: 32px; min-height: 32px;
          touch-action: manipulation;
        }
        .chat-input-icon-btn:hover, .chat-input-icon-btn:active, .chat-input-icon-btn.active { color: #6366f1; }

        .chat-input-wrapper { flex: 1; min-width: 0; align-self: center; }
        .chat-textarea {
          display: block;
          width: 100%; background: transparent;
          border: none; outline: none; resize: none;
          font-size: 15px; color: #f1f5f9; line-height: 1.45;
          max-height: 96px; overflow-y: auto;
          font-family: inherit;
          padding: 3px 0;
          -webkit-appearance: none;
          touch-action: manipulation;
        }
        @media (min-width: 480px) { .chat-textarea { font-size: 14px; } }
        .chat-textarea::placeholder { color: #475569; }

        .chat-send-btn {
          background: linear-gradient(135deg, #6366f1, #818cf8);
          border: none; cursor: pointer; color: #fff;
          width: 36px; height: 36px; min-width: 36px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          transition: transform .15s, opacity .15s; flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(99,102,241,0.3);
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
        }
        .chat-send-btn:hover:not(:disabled), .chat-send-btn:active:not(:disabled) {
          transform: scale(1.08); box-shadow: 0 6px 20px rgba(99,102,241,0.5);
        }
        .chat-send-btn:disabled { opacity: .4; cursor: not-allowed; }

        /* ── Emoji picker: always opens upward, fits narrow screens ── */
        .emoji-picker {
          position: absolute;
          bottom: calc(100% + 6px);
          left: 10px;
          right: 10px;
          max-width: 280px;
          background: rgba(13,14,28,0.99);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 14px;
          box-shadow: 0 16px 48px rgba(0,0,0,0.7);
          padding: 10px;
          z-index: 100;
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
        }
        @media (min-width: 480px) {
          .emoji-picker { left: 12px; right: auto; width: 260px; }
        }
        .emoji-picker-header {
          display: flex; justify-content: space-between; align-items: center;
          font-size: 12px; font-weight: 600; color: #64748b;
          margin-bottom: 8px; padding: 0 2px;
        }
        .emoji-picker-header button {
          background: none; border: none; cursor: pointer;
          color: #475569; display: flex; align-items: center;
          padding: 4px; border-radius: 4px;
          -webkit-tap-highlight-color: transparent;
          transition: color .15s;
        }
        .emoji-picker-header button:hover { color: #f1f5f9; }
        .emoji-grid { display: grid; grid-template-columns: repeat(5,1fr); gap: 4px; }
        .emoji-btn {
          background: none; border: none; cursor: pointer;
          font-size: 22px; border-radius: 8px; padding: 6px 4px;
          transition: background .12s, transform .12s; line-height: 1;
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
        }
        .emoji-btn:hover, .emoji-btn:active { background: rgba(255,255,255,0.08); transform: scale(1.15); }
      `}</style>
    </div>
  );
}

export default ChatPage;
