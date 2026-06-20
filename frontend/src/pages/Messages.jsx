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
      // Clear unread count when conversation is opened
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
        const response = await axios.get("http://localhost:5000/check-auth", {
          withCredentials: true,
        });
        currentUserId.current = response.data.id;
      } catch (error) {
        setErrorMessage("Failed to fetch current user.");
      }
    };
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/messages", {
          withCredentials: true,
        });
        setConversations(response.data.messages || []);
        // Seed unread counts from server if available
        if (response.data.unreadCounts) {
          setUnreadCounts(response.data.unreadCounts);
        }
      } catch (error) {
        setErrorMessage("Failed to fetch messages. Please try again later.");
      }
    };
    fetchMessages();
  }, []);

  // debounce typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // search users from DB
  useEffect(() => {
    let cancelled = false;

    const searchUsers = async () => {
      if (!debouncedSearch) {
        setDbUsers([]);
        return;
      }

      setSearchingUsers(true);
      try {
        const res = await axios.get("http://localhost:5000/api/messages/search-users", {
          params: { q: debouncedSearch },
          withCredentials: true,
        });

        if (!cancelled) {
          setDbUsers(Array.isArray(res.data?.users) ? res.data.users : []);
        }
      } catch {
        if (!cancelled) setDbUsers([]);
      } finally {
        if (!cancelled) setSearchingUsers(false);
      }
    };

    searchUsers();
    return () => {
      cancelled = true;
    };
  }, [debouncedSearch]);

  useEffect(() => {
    const newSocket = io("http://localhost:5000", {
      withCredentials: true,
    });
    socket.current = newSocket;

    newSocket.on("message", (msg) => {
      const currentUser = selectedUserRef.current;
      const isActiveChat = currentUser && msg.sender._id === currentUser.userId;

      if (!isActiveChat) {
        // Increment unread count for this sender
        setUnreadCounts((prev) => ({
          ...prev,
          [msg.sender._id]: (prev[msg.sender._id] || 0) + 1,
        }));
        try {
          notificationAudio.currentTime = 0;
          notificationAudio.play();
        } catch (e) {}
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
          return [
            {
              userId: msg.sender._id,
              username: msg.sender.username,
              lastMessage: msg.content,
              lastTime: msg.timestamp,
            },
            ...prev,
          ];
        });
      }

      if (isActiveChat) {
        setSelectedChat((prev) => [...(prev || []), msg]);
        axios
          .post(
            "http://localhost:5000/api/messages/seen",
            { senderId: msg.sender._id },
            { withCredentials: true },
          )
          .then(() => {
            seensocket(msg.sender._id);
          })
          .catch(() => {});
      }
    });

    newSocket.on("seenreceipt", (data) => {
      if (
        data.sender === currentUserId.current &&
        selectedUserRef.current?.userId === data.receiver
      ) {
        updateLastReadAt(data.timestamp);
      }
    });

    // ── Online / Offline tracking ──────────────────────────────────────────
    // Server sends the full list of currently-online userIds on connect
    newSocket.on("onlineUsers", (userIds) => {
      setOnlineUsers(new Set(userIds));
    });

    // A user just connected
    newSocket.on("userOnline", ({ userId }) => {
      setOnlineUsers((prev) => new Set([...prev, userId]));
    });

    // A user just disconnected
    newSocket.on("userOffline", ({ userId }) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    });

    // ── Typing indicators (sidebar) ────────────────────────────────────────
    newSocket.on("typing", ({ sender }) => {
      setTypingUsers((prev) => ({ ...prev, [sender]: true }));
    });

    newSocket.on("stopTyping", ({ sender }) => {
      setTypingUsers((prev) => {
        const next = { ...prev };
        delete next[sender];
        return next;
      });
    });

    return () => {
      newSocket.disconnect();
    };
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
        "http://localhost:5000/api/messages/user",
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
        return [
          {
            userId: id,
            username,
            lastMessage: "",
            lastTime: new Date().toISOString(),
          },
          ...prev,
        ];
      });
    } catch (error) {
      setErrorMessage("Failed to load chat. Please try again later.");
    }
  }, []);

  // from profile redirect
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
          "http://localhost:5000/api/messages/seen",
          { senderId },
          { withCredentials: true },
        );
        seensocket(senderId);
      }
    } catch (error) {
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
            ? {
                ...conv,
                lastMessage: messageText,
                lastTime: newMessage.timestamp,
              }
            : conv,
        );
      }
      return [
        {
          userId: selectedUser.userId,
          username: selectedUser.username,
          lastMessage: messageText,
          lastTime: newMessage.timestamp,
        },
        ...prev,
      ];
    });

    setSelectedChat((prev) => [...(prev || []), newMessage]);

    if (socket.current) {
      socket.current.emit("sendMessage", {
        content: messageText,
        receiver: selectedUser.userId,
        timestamp: newMessage.timestamp,
      });
    }

    try {
      await axios.post(
        "http://localhost:5000/api/send",
        {
          content: messageText,
          receiver: selectedUser.userId,
        },
        { withCredentials: true },
      );
    } catch (error) {
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
      .filter((conv) =>
        conv.username.toLowerCase().includes(debouncedSearch.toLowerCase()),
      )
      .map((conv) => ({ ...conv, hasConversation: true }));

    const merged = new Map(localMatches.map((c) => [c.userId, c]));

    for (const u of dbUsers) {
      const id = u.userId || u._id;
      if (!id || merged.has(id)) continue;

      merged.set(id, {
        userId: id,
        username: u.username,
        lastMessage: u.lastMessage || "",
        lastTime: u.lastTime || null,
        hasConversation: Boolean(u.hasConversation),
      });
    }

    return Array.from(merged.values()).sort(
      (a, b) => new Date(b.lastTime || 0) - new Date(a.lastTime || 0),
    );
  }, [sortedConversations, debouncedSearch, dbUsers]);

  const totalUnread = useMemo(
    () => Object.values(unreadCounts).reduce((a, b) => a + b, 0),
    [unreadCounts],
  );

  // Navigate to user profile using /u/username route
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
            <button onClick={() => setErrorMessage("")}>
              <X size={14} />
            </button>
          </div>
        )}

        <div className="messages-container">
          {/* ── Sidebar ── */}
          <div className={`messages-sidebar ${selectedUser ? "hidden-mobile" : ""}`}>
            {/* Sidebar header */}
            <div className="sidebar-header">
              <div className="sidebar-title-row">
                <div className="sidebar-title-group">
                  <h1 className="sidebar-title">Messages</h1>
                  {totalUnread > 0 && (
                    <span className="total-unread-badge">{totalUnread}</span>
                  )}
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
                />
                {searchInput && (
                  <button
                    className="search-clear-btn"
                    onClick={() => setSearchInput("")}
                  >
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
                    onClick={() => {
                      setCurrentSender(conv.userId);
                      openConversation(conv.userId, conv.username);
                    }}
                    className={`conv-item ${isActive ? "conv-item-active" : ""} ${unread > 0 && !isActive ? "conv-item-unread" : ""}`}
                  >
                    {/* Avatar — green dot only if actually online */}
                    <div className="conv-avatar">
                      <span>{conv.username?.[0]?.toUpperCase()}</span>
                      {onlineUsers.has(conv.userId) && (
                        <span className="conv-avatar-online" />
                      )}
                    </div>

                    {/* Info */}
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
                            {conv.lastMessage ||
                              (conv.hasConversation ? "No messages yet" : "Start new chat")}
                          </p>
                        )}
                        {unread > 0 && !isActive && (
                          <span className="unread-badge">
                            {unread > 99 ? "99+" : unread}
                          </span>
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
                  <MessageSquarePlus size={40} className="chat-empty-icon" />
                </div>
                <h2 className="chat-empty-title">Your Messages</h2>
                <p className="chat-empty-sub">
                  Select a conversation or search for someone to start chatting.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        /* ── Page wrapper ── */
        .messages-page-wrapper {
          min-height: 100vh;
          background: #f0f2f5;
          padding-top: 64px;
          margin-left: 0;
        }
        @media (min-width: 768px) {
          .messages-page-wrapper { margin-left: 260px; }
        }

        /* ── Error bar ── */
        .messages-error-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #fef2f2;
          border-left: 3px solid #ef4444;
          color: #b91c1c;
          padding: 10px 16px;
          font-size: 13px;
          gap: 8px;
        }
        .messages-error-bar button { background: none; border: none; cursor: pointer; color: inherit; }

        /* ── Container ── */
        .messages-container {
          display: flex;
          height: calc(100vh - 64px);
          max-width: 1100px;
          margin: 0 auto;
          background: #fff;
          box-shadow: 0 4px 30px rgba(0,0,0,0.08);
          border-radius: 16px;
          overflow: hidden;
        }
        @media (min-width: 768px) {
          .messages-container { margin: 12px auto; height: calc(100vh - 88px); }
        }

        /* ── Sidebar ── */
        .messages-sidebar {
          width: 100%;
          display: flex;
          flex-direction: column;
          border-right: 1px solid #e5e7eb;
          background: #fff;
          flex-shrink: 0;
        }
        @media (min-width: 768px) {
          .messages-sidebar { width: 320px; }
        }
        .hidden-mobile {
          display: none !important;
        }
        @media (min-width: 768px) {
          .hidden-mobile { display: flex !important; }
          .messages-chat-area.hidden-mobile { display: flex !important; }
        }

        /* Sidebar header */
        .sidebar-header {
          padding: 16px;
          border-bottom: 1px solid #f0f2f5;
          background: #fff;
        }
        .sidebar-title-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }
        .sidebar-title-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .sidebar-title {
          font-size: 20px;
          font-weight: 700;
          color: #111827;
          margin: 0;
        }
        .total-unread-badge {
          background: #6366f1;
          color: #fff;
          font-size: 11px;
          font-weight: 700;
          border-radius: 999px;
          padding: 1px 7px;
          min-width: 20px;
          text-align: center;
        }
        .new-chat-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: #6366f1;
          padding: 6px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          transition: background 0.15s;
        }
        .new-chat-btn:hover { background: #eef2ff; }

        /* Search */
        .search-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }
        .search-icon {
          position: absolute;
          left: 11px;
          color: #9ca3af;
          pointer-events: none;
        }
        .search-input {
          width: 100%;
          padding: 9px 32px 9px 34px;
          background: #f3f4f6;
          border: 1.5px solid transparent;
          border-radius: 12px;
          font-size: 13.5px;
          color: #1f2937;
          outline: none;
          transition: border-color 0.2s, background 0.2s;
        }
        .search-input:focus {
          background: #fff;
          border-color: #6366f1;
        }
        .search-clear-btn {
          position: absolute;
          right: 9px;
          background: #d1d5db;
          border: none;
          cursor: pointer;
          color: #6b7280;
          border-radius: 50%;
          width: 18px;
          height: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
        }

        /* ── Conversation list ── */
        .conv-list {
          flex: 1;
          overflow-y: auto;
          overscroll-behavior: contain;
        }
        .conv-list::-webkit-scrollbar { width: 4px; }
        .conv-list::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 4px; }

        .conv-searching {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 10px 16px;
          font-size: 12px;
          color: #9ca3af;
        }
        .conv-searching-dots { display: flex; gap: 3px; }
        .conv-searching-dots span {
          width: 5px; height: 5px;
          border-radius: 50%;
          background: #6366f1;
          animation: pulse-dot 1.2s infinite ease-in-out;
        }
        .conv-searching-dots span:nth-child(2) { animation-delay: 0.2s; }
        .conv-searching-dots span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes pulse-dot {
          0%,80%,100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }

        /* Conversation item */
        .conv-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          cursor: pointer;
          border-bottom: 1px solid #f9fafb;
          transition: background 0.15s;
          position: relative;
        }
        .conv-item:hover { background: #f9fafb; }
        .conv-item-active {
          background: #eef2ff !important;
          border-left: 3px solid #6366f1;
        }
        .conv-item-unread {
          background: #fafbff;
        }

        /* Avatar */
        .conv-avatar {
          position: relative;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-weight: 700;
          font-size: 17px;
          flex-shrink: 0;
        }
        .conv-avatar-online {
          position: absolute;
          bottom: 2px;
          right: 2px;
          width: 11px;
          height: 11px;
          border-radius: 50%;
          background: #22c55e;
          border: 2px solid #fff;
        }

        /* Conv info */
        .conv-info { flex: 1; min-width: 0; }
        .conv-top-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 3px;
        }
        .conv-username {
          font-size: 14px;
          font-weight: 500;
          color: #1f2937;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .conv-username-bold { font-weight: 700; color: #111827; }
        .conv-time { font-size: 11px; color: #9ca3af; white-space: nowrap; flex-shrink: 0; }
        .conv-bottom-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 6px;
        }
        .conv-last-msg {
          font-size: 13px;
          color: #6b7280;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          flex: 1;
          margin: 0;
        }
        .conv-last-msg-bold { color: #111827; font-weight: 600; }

        /* Sidebar typing indicator */
        .conv-typing-text {
          display: flex !important;
          align-items: center;
          gap: 3px;
          color: #6366f1 !important;
          font-style: italic;
          font-weight: 500 !important;
        }
        .conv-typing-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #6366f1;
          flex-shrink: 0;
          animation: sidebar-typing-bounce 0.9s infinite ease-in-out;
        }
        .conv-typing-dot:nth-child(2) { animation-delay: 0.15s; }
        .conv-typing-dot:nth-child(3) { animation-delay: 0.30s; }
        @keyframes sidebar-typing-bounce {
          0%,80%,100% { transform: translateY(0); opacity: 0.4; }
          40%          { transform: translateY(-4px); opacity: 1; }
        }

        /* Unread badge */
        .unread-badge {
          background: #6366f1;
          color: #fff;
          font-size: 11px;
          font-weight: 700;
          border-radius: 999px;
          padding: 2px 7px;
          min-width: 20px;
          text-align: center;
          flex-shrink: 0;
          animation: badge-pop 0.2s ease;
        }
        @keyframes badge-pop {
          0% { transform: scale(0.5); }
          70% { transform: scale(1.15); }
          100% { transform: scale(1); }
        }

        /* Empty states */
        .conv-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 40px 20px;
          color: #9ca3af;
          text-align: center;
          font-size: 13.5px;
          line-height: 1.5;
        }
        .conv-empty-icon { color: #d1d5db; }

        /* ── Chat area ── */
        .messages-chat-area {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
          background: #f8fafc;
        }

        .chat-empty-state {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 14px;
          padding: 32px;
          text-align: center;
        }
        .chat-empty-icon-wrap {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: linear-gradient(135deg, #6366f1, #a855f7);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .chat-empty-icon { color: #fff; }
        .chat-empty-title {
          font-size: 22px;
          font-weight: 700;
          color: #1f2937;
          margin: 0;
        }
        .chat-empty-sub {
          font-size: 14px;
          color: #6b7280;
          max-width: 260px;
          line-height: 1.6;
          margin: 0;
        }
      `}</style>
    </>
  );
}

export default Messages;
