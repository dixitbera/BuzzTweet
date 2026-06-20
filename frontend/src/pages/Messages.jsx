import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import Navbar from "../components/Navbar";
import { Search, MessageSquarePlus, X } from "lucide-react";
const notificationAudio = new Audio("/notification.mp3");
import { io } from "socket.io-client";
import axios from "axios";
import ChatPage from "../components/ChatPage.jsx";
import { useLocation, useNavigate } from "react-router-dom";

function Messages() {
  const location = useLocation();
  const navigate = useNavigate();

  const socket = useRef(null);
  const [currentSender, setCurrentSender] = useState(null);
  const [selectedChat, setSelectedChat] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [dbUsers, setDbUsers] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState(false);

  const [selectedUser, setSelectedUser] = useState();
  const selectedUserRef = useRef(null);
  const [lastReadAt, setLastReadAt] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const [conversations, setConversations] = useState([]);
  const conversationsRef = useRef([]);
  const currentUserId = useRef(null);

  // Unread counts: { [userId]: number }
  const [unreadCounts, setUnreadCounts] = useState({});

  // Online users: Set of userIds currently connected
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  // Typing users: { [userId]: true } — sidebar typing indicator
  const [typingUsers, setTypingUsers] = useState({});

  const updateLastReadAt = (newTimestamp) => {
    setLastReadAt((prev) => {
      if (!prev || (newTimestamp && new Date(newTimestamp) > new Date(prev))) {
        return newTimestamp;
      }
      return prev;
    });
  };

  useEffect(() => {
    selectedUserRef.current = selectedUser;
  }, [selectedUser]);

  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  useEffect(() => {
    if (selectedUser) {
      handleMessageSeen(selectedUser.userId);
      setUnreadCounts((prev) => {
        if (!prev[selectedUser.userId]) return prev;
        const next = { ...prev };
        delete next[selectedUser.userId];
        return next;
      });
    }
  }, [selectedUser]);

  function seensocket(senderID) {
    if (socket.current) {
      socket.current.emit("sendseen", {
        receiver: currentUserId.current,
        sender: senderID,
      });
    }
  }

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/check-auth`, {
          withCredentials: true,
        });
        currentUserId.current = response.data.id;
      } catch {
        setErrorMessage("Failed to fetch current user.");
      }
    };
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/messages`, {
          withCredentials: true,
        });
        setConversations(response.data.messages || []);
        if (response.data.unreadCounts) {
          setUnreadCounts(response.data.unreadCounts);
        }
      } catch {
        setErrorMessage("Failed to fetch messages. Please try again later.");
      }
    };
    fetchMessages();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;
    const searchUsers = async () => {
      if (!debouncedSearch) { setDbUsers([]); return; }
      setSearchingUsers(true);
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/messages/search-users`, {
          params: { q: debouncedSearch },
          withCredentials: true,
        });
        if (!cancelled) setDbUsers(Array.isArray(res.data?.users) ? res.data.users : []);
      } catch {
        if (!cancelled) setDbUsers([]);
      } finally {
        if (!cancelled) setSearchingUsers(false);
      }
    };
    searchUsers();
    return () => { cancelled = true; };
  }, [debouncedSearch]);

  useEffect(() => {
    const newSocket = io(`${import.meta.env.VITE_API_URL}`, { withCredentials: true });
    socket.current = newSocket;

    newSocket.on("message", (msg) => {
      const currentUser = selectedUserRef.current;
      const isActiveChat = currentUser && msg.sender._id === currentUser.userId;

      if (!isActiveChat) {
        setUnreadCounts((prev) => ({
          ...prev,
          [msg.sender._id]: (prev[msg.sender._id] || 0) + 1,
        }));
        try { notificationAudio.currentTime = 0; notificationAudio.play(); } catch {}
      }

      if (msg) {
        setConversations((prev) => {
          const exists = prev.some((conv) => conv.userId === msg.sender._id);
          if (exists) {
            return prev.map((conv) =>
              conv.userId === msg.sender._id
                ? { ...conv, lastMessage: msg.content, lastTime: msg.timestamp }
                : conv,
            );
          }
          return [{ userId: msg.sender._id, username: msg.sender.username, lastMessage: msg.content, lastTime: msg.timestamp }, ...prev];
        });
      }

      if (isActiveChat) {
        setSelectedChat((prev) => [...(prev || []), msg]);
        axios
          .post(`${import.meta.env.VITE_API_URL}/api/messages/seen`, { senderId: msg.sender._id }, { withCredentials: true })
          .then(() => { seensocket(msg.sender._id); })
          .catch(() => {});
      }
    });

    newSocket.on("seenreceipt", (data) => {
      if (data.sender === currentUserId.current && selectedUserRef.current?.userId === data.receiver) {
        updateLastReadAt(data.timestamp);
      }
    });

    newSocket.on("onlineUsers", (userIds) => { setOnlineUsers(new Set(userIds)); });
    newSocket.on("userOnline", ({ userId }) => { setOnlineUsers((prev) => new Set([...prev, userId])); });
    newSocket.on("userOffline", ({ userId }) => {
      setOnlineUsers((prev) => { const next = new Set(prev); next.delete(userId); return next; });
    });
    newSocket.on("typing", ({ sender }) => { setTypingUsers((prev) => ({ ...prev, [sender]: true })); });
    newSocket.on("stopTyping", ({ sender }) => {
      setTypingUsers((prev) => { const next = { ...prev }; delete next[sender]; return next; });
    });

    return () => { newSocket.disconnect(); };
  }, []);

  const formatTime = (date) => {
    if (!date || Number.isNaN(date.getTime())) return "";
    const now = new Date();
    const diff = now - date;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString();
  };

  const openConversation = useCallback(async (id, username) => {
    try {
      const chat = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/messages/user`,
        { reciverid: id },
        { withCredentials: true },
      );
      setLastReadAt(chat.data?.lastReadAt || null);
      setSelectedUser({ userId: id, username });
      setSelectedChat(chat.data?.messages || []);
      setSearchInput("");
      setDebouncedSearch("");
      setDbUsers([]);
      setConversations((prev) => {
        const exists = prev.some((c) => c.userId === id);
        if (exists) return prev;
        return [{ userId: id, username, lastMessage: "", lastTime: new Date().toISOString() }, ...prev];
      });
    } catch {
      setErrorMessage("Failed to load chat. Please try again later.");
    }
  }, []);

  useEffect(() => {
    const target = location.state?.openChatWith;
    if (target?.userId && target?.username) {
      openConversation(target.userId, target.username);
    }
  }, [location.state, openConversation]);

  const handleMessageSeen = async (senderId) => {
    try {
      if (senderId) {
        await axios.post(
          `${import.meta.env.VITE_API_URL}/api/messages/seen`,
          { senderId },
          { withCredentials: true },
        );
        seensocket(senderId);
      }
    } catch {
      setErrorMessage("Failed to mark messages as seen. Please try again later.");
    }
  };

  const handleSendMessage = async (messageText) => {
    if (!messageText.trim() || !selectedUser) return;
    const newMessage = {
      _id: Date.now().toString(),
      content: messageText,
      sender: { _id: currentUserId.current, username: "You" },
      receiver: { _id: selectedUser.userId, username: selectedUser.username },
      timestamp: new Date().toISOString(),
      seen: false,
    };
    setConversations((prev) => {
      const exists = prev.some((conv) => conv.userId === selectedUser.userId);
      if (exists) {
        return prev.map((conv) =>
          conv.userId === selectedUser.userId
            ? { ...conv, lastMessage: messageText, lastTime: newMessage.timestamp }
            : conv,
        );
      }
      return [{ userId: selectedUser.userId, username: selectedUser.username, lastMessage: messageText, lastTime: newMessage.timestamp }, ...prev];
    });
    setSelectedChat((prev) => [...(prev || []), newMessage]);
    if (socket.current) {
      socket.current.emit("sendMessage", { content: messageText, receiver: selectedUser.userId, timestamp: newMessage.timestamp });
    }
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/send`, { content: messageText, receiver: selectedUser.userId }, { withCredentials: true });
    } catch {
      setErrorMessage("Failed to send message. Please try again later.");
    }
  };

  const sortedConversations = useMemo(
    () => [...conversations].sort((a, b) => new Date(b.lastTime) - new Date(a.lastTime)),
    [conversations],
  );

  const visibleConversations = useMemo(() => {
    if (!debouncedSearch) {
      return sortedConversations.map((c) => ({ ...c, hasConversation: true }));
    }
    const localMatches = sortedConversations
      .filter((conv) => conv.username.toLowerCase().includes(debouncedSearch.toLowerCase()))
      .map((conv) => ({ ...conv, hasConversation: true }));
    const merged = new Map(localMatches.map((c) => [c.userId, c]));
    for (const u of dbUsers) {
      const id = u.userId || u._id;
      if (!id || merged.has(id)) continue;
      merged.set(id, { userId: id, username: u.username, lastMessage: u.lastMessage || "", lastTime: u.lastTime || null, hasConversation: Boolean(u.hasConversation) });
    }
    return Array.from(merged.values()).sort((a, b) => new Date(b.lastTime || 0) - new Date(a.lastTime || 0));
  }, [sortedConversations, debouncedSearch, dbUsers]);

  const totalUnread = useMemo(
    () => Object.values(unreadCounts).reduce((a, b) => a + b, 0),
    [unreadCounts],
  );

  const handleProfileClick = (username) => {
    if (username) navigate(`/u/${username}`);
  };

  return (
    <>
      <Navbar />
      <div className="messages-page-wrapper">
        {errorMessage && (
          <div className="messages-error-bar">
            <span>{errorMessage}</span>
            <button onClick={() => setErrorMessage("")}><X size={14} /></button>
          </div>
        )}

        <div className="messages-container">
          {/* ── Sidebar ── */}
          <div className={`messages-sidebar ${selectedUser ? "hidden-mobile" : ""}`}>
            {/* Header */}
            <div className="sidebar-header">
              <div className="sidebar-title-row">
                <div className="sidebar-title-group">
                  <h1 className="sidebar-title">Messages</h1>
                  {totalUnread > 0 && <span className="total-unread-badge">{totalUnread}</span>}
                </div>
                <button className="new-chat-btn" title="New message">
                  <MessageSquarePlus size={20} />
                </button>
              </div>
              {/* Search */}
              <div className="search-wrapper">
                <Search className="search-icon" size={15} />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="search-input"
                  aria-label="Search conversations"
                />
                {searchInput && (
                  <button className="search-clear-btn" onClick={() => setSearchInput("")} aria-label="Clear search">
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>

            {/* Conversation list */}
            <div className="conv-list">
              {searchingUsers && debouncedSearch && (
                <div className="conv-searching">
                  <div className="conv-searching-dots">
                    <span /><span /><span />
                  </div>
                  Searching users…
                </div>
              )}

              {visibleConversations.map((conv) => {
                const unread = unreadCounts[conv.userId] || 0;
                const isActive = selectedUser?.userId === conv.userId;
                return (
                  <div
                    key={conv.userId}
                    onClick={() => { setCurrentSender(conv.userId); openConversation(conv.userId, conv.username); }}
                    className={`conv-item ${isActive ? "conv-item-active" : ""} ${unread > 0 && !isActive ? "conv-item-unread" : ""}`}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && openConversation(conv.userId, conv.username)}
                    aria-label={`Open conversation with ${conv.username}`}
                  >
                    <div className="conv-avatar">
                      <span>{conv.username?.[0]?.toUpperCase()}</span>
                      {onlineUsers.has(conv.userId) && <span className="conv-avatar-online" />}
                    </div>
                    <div className="conv-info">
                      <div className="conv-top-row">
                        <span className={`conv-username ${unread > 0 && !isActive ? "conv-username-bold" : ""}`}>
                          {conv.username}
                        </span>
                        <span className="conv-time">
                          {conv.lastTime ? formatTime(new Date(conv.lastTime)) : ""}
                        </span>
                      </div>
                      <div className="conv-bottom-row">
                        {typingUsers[conv.userId] ? (
                          <p className="conv-last-msg conv-typing-text">
                            <span className="conv-typing-dot" />
                            <span className="conv-typing-dot" />
                            <span className="conv-typing-dot" />
                            typing…
                          </p>
                        ) : (
                          <p className={`conv-last-msg ${unread > 0 && !isActive ? "conv-last-msg-bold" : ""}`}>
                            {conv.lastMessage || (conv.hasConversation ? "No messages yet" : "Start new chat")}
                          </p>
                        )}
                        {unread > 0 && !isActive && (
                          <span className="unread-badge">{unread > 99 ? "99+" : unread}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {!searchingUsers && debouncedSearch && visibleConversations.length === 0 && (
                <div className="conv-empty">
                  <Search size={28} className="conv-empty-icon" />
                  <p>No users found for "<strong>{debouncedSearch}</strong>"</p>
                </div>
              )}

              {!debouncedSearch && visibleConversations.length === 0 && (
                <div className="conv-empty">
                  <MessageSquarePlus size={28} className="conv-empty-icon" />
                  <p>No conversations yet.<br />Search for someone to start chatting.</p>
                </div>
              )}
            </div>
          </div>

          {/* ── Chat Area ── */}
          <div className={`messages-chat-area ${!selectedUser ? "hidden-mobile" : ""}`}>
            {selectedUser ? (
              <ChatPage
                messages={selectedChat || []}
                currentUserId={currentUserId.current}
                socket={socket}
                selectedUser={selectedUser}
                onSendMessage={handleSendMessage}
                lastReadAt={lastReadAt}
                onBack={() => setSelectedUser(null)}
                onProfileClick={handleProfileClick}
                isOnline={onlineUsers.has(selectedUser.userId)}
              />
            ) : (
              <div className="chat-empty-state">
                <div className="chat-empty-icon-wrap">
                  <MessageSquarePlus size={40} className="chat-empty-icon" aria-hidden="true" />
                </div>
                <h2 className="chat-empty-title">Your Messages</h2>
                <p className="chat-empty-sub">Select a conversation or search for someone to start chatting.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .messages-page-wrapper {
          min-height: 100vh;
          background: var(--bg-base);
          padding-bottom: var(--mobile-nav-h);
        }
        @media (min-width: 768px) {
          .messages-page-wrapper { margin-left: var(--sidebar-w); padding-bottom: 0; }
        }
        .messages-error-bar {
          display: flex; align-items: center; justify-content: space-between;
          background: rgba(239,68,68,0.1); border-left: 3px solid #ef4444;
          color: #fca5a5; padding: 10px 16px; font-size: 13px; gap: 8px;
        }
        .messages-error-bar button { background: none; border: none; cursor: pointer; color: inherit; }
        .messages-container {
          display: flex;
          height: calc(100vh - var(--mobile-nav-h));
          max-width: 1100px; margin: 0 auto;
          background: rgba(255,255,255,0.03);
          backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.06);
          overflow: hidden;
        }
        @media (min-width: 768px) {
          .messages-container { margin: 12px auto; height: calc(100vh - 24px); border-radius: 20px; }
        }
        .messages-sidebar {
          width: 100%; display: flex; flex-direction: column;
          border-right: 1px solid rgba(255,255,255,0.06);
          background: rgba(13,14,28,0.8); flex-shrink: 0;
        }
        @media (min-width: 768px) { .messages-sidebar { width: 320px; } }
        .hidden-mobile { display: none !important; }
        @media (min-width: 768px) {
          .hidden-mobile { display: flex !important; }
          .messages-chat-area.hidden-mobile { display: flex !important; }
        }
        .sidebar-header {
          padding: 16px; border-bottom: 1px solid rgba(255,255,255,0.06);
          background: rgba(13,14,28,0.9);
        }
        .sidebar-title-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
        .sidebar-title-group { display: flex; align-items: center; gap: 8px; }
        .sidebar-title { font-size: 20px; font-weight: 700; color: #f1f5f9; margin: 0; }
        .total-unread-badge {
          background: #6366f1; color: #fff; font-size: 11px; font-weight: 700;
          border-radius: 999px; padding: 1px 7px; min-width: 20px; text-align: center;
          box-shadow: 0 0 12px rgba(99,102,241,0.4);
        }
        .new-chat-btn {
          background: none; border: none; cursor: pointer; color: #6366f1;
          padding: 6px; border-radius: 8px; display: flex; align-items: center; transition: background 0.15s;
        }
        .new-chat-btn:hover { background: rgba(99,102,241,0.15); }
        .search-wrapper { position: relative; display: flex; align-items: center; }
        .search-icon { position: absolute; left: 11px; color: #475569; pointer-events: none; }
        .search-input {
          width: 100%; padding: 9px 32px 9px 34px;
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px; font-size: 13.5px; color: #f1f5f9; outline: none; font-family: inherit;
          transition: border-color 0.2s, background 0.2s;
        }
        .search-input::placeholder { color: #475569; }
        .search-input:focus { background: rgba(255,255,255,0.08); border-color: rgba(99,102,241,0.5); }
        .search-clear-btn {
          position: absolute; right: 9px; background: rgba(255,255,255,0.1); border: none; cursor: pointer;
          color: #94a3b8; border-radius: 50%; width: 18px; height: 18px;
          display: flex; align-items: center; justify-content: center; padding: 0;
        }
        .conv-list { flex: 1; overflow-y: auto; overscroll-behavior: contain; }
        .conv-list::-webkit-scrollbar { width: 4px; }
        .conv-list::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }
        .conv-searching { display: flex; align-items: center; gap: 6px; padding: 10px 16px; font-size: 12px; color: #64748b; }
        .conv-searching-dots { display: flex; gap: 3px; }
        .conv-searching-dots span {
          width: 5px; height: 5px; border-radius: 50%; background: #6366f1;
          animation: typing-dot 1.2s infinite ease-in-out;
        }
        .conv-searching-dots span:nth-child(2) { animation-delay: 0.2s; }
        .conv-searching-dots span:nth-child(3) { animation-delay: 0.4s; }
        .conv-item {
          display: flex; align-items: center; gap: 12px; padding: 12px 16px; cursor: pointer;
          border-bottom: 1px solid rgba(255,255,255,0.04); transition: background 0.15s;
        }
        .conv-item:hover { background: rgba(255,255,255,0.04); }
        .conv-item-active { background: rgba(99,102,241,0.1) !important; border-left: 3px solid #6366f1; }
        .conv-item-unread { background: rgba(99,102,241,0.05); }
        .conv-avatar {
          position: relative; width: 44px; height: 44px; border-radius: 50%;
          background: linear-gradient(135deg, #6366f1, #a855f7);
          display: flex; align-items: center; justify-content: center;
          color: #fff; font-weight: 700; font-size: 16px; flex-shrink: 0;
        }
        .conv-avatar-online {
          position: absolute; bottom: 1px; right: 1px; width: 11px; height: 11px;
          border-radius: 50%; background: #22c55e;
          border: 2px solid #0d0e1c; box-shadow: 0 0 6px rgba(34,197,94,0.6);
        }
        .conv-info { flex: 1; min-width: 0; }
        .conv-top-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 3px; }
        .conv-username { font-size: 14px; font-weight: 500; color: #cbd5e1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .conv-username-bold { font-weight: 700; color: #f1f5f9; }
        .conv-time { font-size: 11px; color: #475569; white-space: nowrap; flex-shrink: 0; }
        .conv-bottom-row { display: flex; align-items: center; justify-content: space-between; gap: 6px; }
        .conv-last-msg { font-size: 13px; color: #475569; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1; margin: 0; }
        .conv-last-msg-bold { color: #94a3b8; font-weight: 600; }
        .conv-typing-text { display: flex !important; align-items: center; gap: 3px; color: #818cf8 !important; font-style: italic; font-weight: 500 !important; }
        .conv-typing-dot { width: 5px; height: 5px; border-radius: 50%; background: #6366f1; flex-shrink: 0; animation: typing-dot 0.9s infinite ease-in-out; }
        .conv-typing-dot:nth-child(2) { animation-delay: 0.15s; }
        .conv-typing-dot:nth-child(3) { animation-delay: 0.30s; }
        .unread-badge {
          background: #6366f1; color: #fff; font-size: 11px; font-weight: 700;
          border-radius: 999px; padding: 2px 7px; min-width: 20px; text-align: center;
          flex-shrink: 0; box-shadow: 0 0 8px rgba(99,102,241,0.4);
        }
        .conv-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; padding: 40px 20px; color: #475569; text-align: center; font-size: 13.5px; line-height: 1.5; }
        .conv-empty-icon { color: #334155; }
        .messages-chat-area { flex: 1; display: flex; flex-direction: column; min-width: 0; background: rgba(8,8,16,0.6); }
        .chat-empty-state { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; padding: 32px; text-align: center; }
        .chat-empty-icon-wrap {
          width: 80px; height: 80px; border-radius: 50%;
          background: linear-gradient(135deg, #6366f1, #a855f7);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 0 40px rgba(99,102,241,0.3);
        }
        .chat-empty-icon { color: #fff; }
        .chat-empty-title { font-size: 22px; font-weight: 700; color: #f1f5f9; margin: 0; }
        .chat-empty-sub { font-size: 14px; color: #475569; max-width: 260px; line-height: 1.6; margin: 0; }
        @keyframes typing-dot {
          0%,80%,100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </>
  );
}

export default Messages;
