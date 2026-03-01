import React, { useState, useEffect, useRef } from "react";
import Navbar from "../components/Navbar";
import { Search, Send, Image, Smile, Paperclip, MoreVertical, Phone, Video, ArrowLeft } from "lucide-react";
// web socket
import { io } from "socket.io-client";
// import { useEffect } from "react";
import axios from "axios";
import ChatPage from "../components/ChatPage.jsx";
function Messages() {
  const [socket, setSocket] = useState(null);
  const [currentSender, setCurrentSender] = useState(null);
  const [selectedChat, setSelectedChat] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [conversionid,setconversionid]=useState();
  const [selectedUser,setSelectedUser]=useState();
  const selectedUserRef = useRef(null);
  
  // Keep ref in sync with state
  useEffect(() => {
    selectedUserRef.current = selectedUser;
  }, [selectedUser]);
  
  const [currentUserId, setCurrentUserId] = useState(null);
  useEffect(() => {
    // Fetch current user info on component mount
    const fetchCurrentUser = async () => {
      try {
        const response = await axios.get("http://localhost:5000/check-auth", {
          withCredentials: true,
        });
        setCurrentUserId(response.data.id);
        // console.log("Current User ID:", response.data);
      } catch (error) {
        console.error("Error fetching current user:", error);
      }
    };
    fetchCurrentUser();
  },[]);
  useEffect(() => {
    const newSocket = io("http://localhost:5000", {
      withCredentials: true,
    });
    setSocket(newSocket);
    newSocket.on("connect", () => {
      console.log("Connected to socket server:", newSocket.id);
    }); 
    
    // Listen for incoming messages from the server
    newSocket.on("message", (msg) => {
      console.log("Received message:", msg);
      
      // Get current selected user from ref
      const currentUser = selectedUserRef.current;
      
      // Check if message is valid and from the currently selected user
      if (msg && currentUser) {
        console.log("Message sender ID:", msg.receiver);  
        console.log("Currently selected user ID:", currentUser.userId);
        console.log(currentUser, " ", msg.sender)
        if (msg.sender._id === currentUser?.userId) {
          console.log(
            "Message is from the currently selected user. Updating chat.",
          );
          setSelectedChat((prev) => [...(prev || []), msg]);
            const find = conversations.find(conv => conv.userId === msg.sender._id);
            if(find){
              setConversations(prev => prev.map(conv => conv.userId === msg.sender._id ? { ...conv, lastMessage: msg.content, lastTime: msg.timestamp } : conv));
            }
        }
      }
    });

    // return () => {
    //   newSocket.disconnect();
    // }; 
  }, []); // Empty dependency - only run once on mount
useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/messages", { withCredentials: true });
        console.log("Fetched messages:", response.data);
        setMessages(response.data.messages);
        setConversations(response.data.messages);
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };
    fetchMessages();
  }, []);
  const [conversations,setConversations] = useState([]);

  // Mock messages for selected chat
  const [messages, setMessages] = useState([]);

  const formatTime = (date) => {
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

  // const handleSendMessage = () => {
  //   if (!messageText.trim()) return;

  //   const newMessage = {
  //     _id: Date.now().toString(),
  //     text: messageText,
  //     to_send: selectedChat?._id,
  //     timestamp: new Date(),
  //   };
    
  //   setMessages([...messages, newMessage]);
  //   setMessageText("");
  // };

  const filteredConversations = conversations.filter(conv =>
    conv.username.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const handleconversion = async (id, username) => {
    console.log("Fetching chat for user ID:", id);
    try {
      const chat = await axios.post("http://localhost:5000/api/messages/user", { reciverid: id }, { withCredentials: true });
      console.log("Fetched chat:", chat.data.messages);
      
      // Set the selected user with userId
      setSelectedUser({ userId: id, username: username });
      
      // Set the messages for the selected chat
      setSelectedChat(chat.data.messages || []);
    } catch (error) {
      console.log(error);
    }
  };

  // Handle sending a message
  const handleSendMessage = async (messageText) => {
    if (!messageText.trim() || !selectedUser) return;
    
    const newMessage = {
      _id: Date.now().toString(),
      content: messageText,
      sender: { _id: currentUserId, username: "You" },
      receiver: { _id: selectedUser.userId, username: selectedUser.username },
      timestamp: new Date().toISOString(),
      seen: false,
    };
    // set this msg in the setconversations to update the last message and time
      setConversations(prev => prev.map(conv => conv.userId === selectedUser.userId ? { ...conv, lastMessage: messageText, lastTime: newMessage.timestamp } : conv));
    // Add message to the UI immediately
    setSelectedChat((prev) => [...(prev || []), newMessage]);

    // Emit via socket - backend expects receiver as userId string
    if (socket) {
      socket.emit("sendMessage", {
        content: messageText,
        receiver: selectedUser.userId, // Backend uses this in hasmap
        timestamp: new Date().toISOString(),
      });
    }

    // Also send via API
    try {
      await axios.post("http://localhost:5000/api/send", {
        content: messageText,
        receiver: selectedUser.userId,
      }, { withCredentials: true });
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 md:ml-[260px] pt-16">
        <div className="max-w-6xl mx-auto h-[calc(100vh-64px)] flex bg-white shadow-lg rounded-lg overflow-hidden m-4">
          {/* Conversations List */}
          <div
            className={`w-full md:w-80 border-r border-gray-200 flex flex-col ${selectedChat ? "hidden md:flex" : "flex"}`}
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
              <h1 className="text-xl font-bold text-gray-800 mb-3">Messages</h1>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-100 border-0 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Conversations */}
            <div className="flex-1 overflow-y-auto">
              {filteredConversations.map((conv) => (
                <div
                  key={conv.userId}
                  onClick={() => {
                    setCurrentSender(conv.userId);
                    handleconversion(conv.userId, conv.username);
                  }}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedUser?.userId === conv.userId ? "bg-indigo-50" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 via-purple-500 to-pink-500 flex items-center justify-center font-bold text-white">
                        {conv.username[0].toUpperCase()}
                      </div>
                      {/* {conv.online && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                      )} */}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-800 truncate">
                          {conv.username}
                        </h3>
                        <span className="text-xs text-gray-400">
                          {formatTime(new Date(conv.lastTime))}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 truncate">
                        {conv.lastMessage}
                      </p>
                    </div>
                    {/* {conv.unread > 0 && (
                      <div className="flex-shrink-0 w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center">
                        <span className="text-xs text-white font-medium">
                          {conv.unread}
                        </span>
                      </div>
                    )} */}
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Chat Area */}
          {selectedUser ? (
            <ChatPage
              messages={selectedChat}
              currentUserId={currentUserId}
              socket={socket}
              selectedUser={selectedUser}
              onSendMessage={handleSendMessage}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-gray-500">
                Select a conversation to start chatting
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default Messages;
