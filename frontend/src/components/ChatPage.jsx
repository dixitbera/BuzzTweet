import React, { useState, useEffect, useRef } from "react";
import { Send, Smile, Image, Paperclip, Mic, ArrowLeft, MoreVertical } from "lucide-react";

function ChatPage({
  messages = [],
  currentUserId,
  selectedUser,
  onSendMessage,
  socket,
  lastReadAt
,
}) {
  const messagesEndRef = useRef(null);
  const [messageText, setMessageText] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Common emojis for quick selection
  const quickEmojis = [
    "😊",
    "😂",
    "❤️",
    "👍",
    "🎉",
    "🔥",
    "💯",
    "🙌",
    "😢",
    "😮",
  ];
  // useEffect(() => {
  //   console.log(socket);
  // }, []);
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Format timestamp for display
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Check if message is from current user
  const isCurrentUser = (msg) => {
    // Handle both string and object sender formats
    const senderId =
      typeof msg.sender === "object" ? msg.sender._id : msg.sender;
    return senderId === currentUserId;
  };

  // Group messages by date
  const groupMessagesByDate = (msgs) => {
    const groups = {};
    msgs.forEach((msg) => {
      const date = new Date(msg.timestamp).toLocaleDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(msg);
    });
    return groups;
  };

  // Handle sending message
  const handleSend = () => {
    if (messageText.trim() === "") return;

    // Use the onSendMessage callback if provided
    if (onSendMessage) {
      onSendMessage(messageText);
    }

    // Clear the input
    setMessageText("");
    setShowEmojiPicker(false);
  };

  // Handle key press
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Add emoji to message
  const addEmoji = (emoji) => {
    setMessageText((prev) => prev + emoji);
  };

  const messageGroups = groupMessagesByDate(messages);

  // If no messages
  if (!messages || messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col h-full bg-gray-50">
        {/* Chat Header */}
        {selectedUser && (
          <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 via-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold">
              {selectedUser.username?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-800">
                {selectedUser.username}
              </h3>
              <p className="text-xs text-green-500">Online</p>
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-indigo-400 via-purple-500 to-pink-500 flex items-center justify-center">
              <svg
                className="w-10 h-10 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No messages yet
            </h3>
            <p className="text-gray-500">
              Start a conversation by sending a message
            </p>
          </div>
        </div>

        {/* Message Input */}
        <div className="bg-white border-t border-gray-200 p-3">
          <div className="flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2">
            <button className="text-gray-500 hover:text-indigo-600 transition-colors p-1">
              <Paperclip size={20} />
            </button>
            <button
              className="text-gray-500 hover:text-indigo-600 transition-colors p-1"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            >
              <Smile size={20} />
            </button>
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="flex-1 bg-transparent border-none outline-none text-gray-700 placeholder-gray-400"
            />
            <button className="text-gray-500 hover:text-indigo-600 transition-colors p-1">
              <Image size={20} />
            </button>
            <button
              onClick={handleSend}
              disabled={!messageText.trim()}
              className="bg-indigo-600 text-white p-2 rounded-full hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={18} />
            </button>
          </div>

          {/* Emoji Picker */}
          {showEmojiPicker && (
            <div className="absolute bottom-20 left-4 bg-white rounded-xl shadow-lg border border-gray-200 p-3 z-10">
              <div className="grid grid-cols-5 gap-2">
                {quickEmojis.map((emoji, index) => (
                  <button
                    key={index}
                    onClick={() => addEmoji(emoji)}
                    className="text-2xl hover:bg-gray-100 rounded-lg p-1 transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50 relative">
      {/* Chat Header */}
      {selectedUser && (
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 via-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold">
            {selectedUser.username?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-800">
              {selectedUser.username}
            </h3>
            <p className="text-xs text-green-500">Online</p>
          </div>
          <button className="text-gray-500 hover:text-indigo-600 transition-colors p-2">
            <MoreVertical size={20} />
          </button>
        </div>
      )}

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {Object.entries(messageGroups).map(([date, dateMessages]) => (
          <div key={date}>
            {/* Date Separator */}
            <div className="flex items-center justify-center my-4">
              <div className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                {new Date(date).toLocaleDateString(undefined, {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                })}
              </div>
            </div>

            {/* Messages for this date */}
            {dateMessages.map((msg, index) => {
              const isSender = isCurrentUser(msg);
              const showAvatar =
                index === 0 ||
                dateMessages[index - 1].sender._id !== msg.sender._id;
              // Robust seen logic: derive, don't mutate
              const isSeen = lastReadAt && new Date(msg.timestamp) <= new Date(lastReadAt);
              return (
                <div
                  key={msg._id}
                  className={`flex items-end gap-2 mb-3 ${
                    isSender ? "justify-end" : "justify-start"
                  }`}
                >
                  {/* Avatar for received messages */}
                  {!isSender && (
                    <div className="flex-shrink-0">
                      {showAvatar ? (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 via-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-semibold">
                          {msg.sender.username?.charAt(0).toUpperCase()}
                        </div>
                      ) : (
                        <div className="w-8 h-8"></div>
                      )}
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div
                    className={`max-w-[70%] ${
                      isSender ? "order-1" : "order-2"
                    }`}
                  >
                    {/* Username for received messages */}
                    {!isSender && showAvatar && (
                      <p className="text-xs text-gray-500 ml-2 mb-1">
                        {msg.sender.username}
                      </p>
                    )}

                    {/* Message content */}
                    <div
                      className={`px-4 py-2 rounded-2xl ${
                        isSender
                          ? "bg-indigo-600 text-white rounded-br-md"
                          : "bg-white text-gray-800 rounded-bl-md shadow-sm"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {msg.content}
                      </p>
                    </div>

                    {/* Message meta (time + seen status) */}
                    <div
                      className={`flex items-center gap-1 mt-1 text-xs text-gray-400 ${
                        isSender ? "justify-end" : "justify-start"
                      }`}
                    >
                      <span>{formatTimestamp(msg.timestamp)}</span>
                      {isSender && (
                        <span className="ml-1">
                          {isSeen ? (
                            <span className="text-blue-400">✓✓</span>
                          ) : (
                            <span>✓</span>
                          )}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Avatar placeholder for sent messages */}
                  {isSender && (
                    <div className="flex-shrink-0">
                      {showAvatar ? (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 via-purple-500 to-indigo-500 flex items-center justify-center text-white text-xs font-semibold">
                          {msg.receiver?.username?.charAt(0).toUpperCase()}
                        </div>
                      ) : (
                        <div className="w-8 h-8"></div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-white border-t border-gray-200 p-3">
        <div className="flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2">
          <button className="text-gray-500 hover:text-indigo-600 transition-colors p-1">
            <Paperclip size={20} />
          </button>
          <button
            className="text-gray-500 hover:text-indigo-600 transition-colors p-1"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          >
            <Smile size={20} />
          </button>
          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 bg-transparent border-none outline-none text-gray-700 placeholder-gray-400"
          />
          <button className="text-gray-500 hover:text-indigo-600 transition-colors p-1">
            <Image size={20} />
          </button>
          <button
            onClick={handleSend}
            disabled={!messageText.trim()}
            className="bg-indigo-600 text-white p-2 rounded-full hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={18} />
          </button>
        </div>

        {/* Emoji Picker */}
        {showEmojiPicker && (
          <div className="absolute bottom-20 left-4 bg-white rounded-xl shadow-lg border border-gray-200 p-3 z-10">
            <div className="grid grid-cols-5 gap-2">
              {quickEmojis.map((emoji, index) => (
                <button
                  key={index}
                  onClick={() => addEmoji(emoji)}
                  className="text-2xl hover:bg-gray-100 rounded-lg p-1 transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ChatPage;
