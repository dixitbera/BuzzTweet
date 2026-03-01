import React, { useState } from "react";
import { Heart, MessageCircle } from "lucide-react";
import { HeartFilled, HeartOutlined } from "@ant-design/icons";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Comment({ comm }) {
  const navigate = useNavigate();
  const [com, setcom] = useState(comm);
  const [likecount, setlikecount] = useState(comm?.likecount ?? 0);
  const [loading, setLoading] = useState(false);
  const [comentliked, setcomentliked] = useState(comm?.liked);

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString();
  };

  async function handlecommentLike() {
    if (loading) return;
    const c = !comentliked;
    setcomentliked(c);
    setlikecount((prev) => (c ? prev + 1 : prev - 1));
    setLoading(true);
    try {
      await axios.post(
        "http://localhost:5000/post/commentlike",
        { commentid: com._id },
        { withCredentials: true }
      );
    } catch (error) {
      console.log(error);
      navigate("/login");
      setlikecount((prev) => (!c ? prev + 1 : prev - 1));
      setcomentliked(!c);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="group flex gap-3 py-3 px-2 hover:bg-gray-50/50 rounded-xl transition-all duration-200">
      {/* Avatar */}
      <div className="flex-shrink-0">
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-indigo-400 via-purple-500 to-pink-500 flex items-center justify-center font-bold text-white text-sm shadow-md ring-2 ring-white/50">
          {com?.userid?.username?.[0]?.toUpperCase() || "U"}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100">
          {/* Username & Time - Top Row */}
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-gray-900 hover:underline cursor-pointer">
                {com?.userid?.username}
              </span>
              <span className="text-xs text-gray-400">·</span>
              <span className="text-xs text-gray-400 font-medium">
                {formatDate(com?.commentat)}
              </span>
            </div>
          </div>

          {/* Comment Text */}
          <p className="text-sm text-gray-700 leading-relaxed break-words">
            {com?.comment}
          </p>
        </div>

        {/* Like Button - Below comment on left */}
        <button
          disabled={loading}
          onClick={handlecommentLike}
          className={`flex items-center gap-1.5 mt-1.5 ml-1 text-xs font-semibold transition-all duration-200 ${
            comentliked 
              ? "text-red-500" 
              : "text-gray-400 hover:text-red-500"
          }`}
        >
          <span className={`transition-transform duration-200 ${comentliked ? "scale-110" : "group-hover:scale-110"}`}>
            {comentliked ? (
              <HeartFilled className="w-4 h-4" />
            ) : (
              <Heart className="w-4 h-4" />
            )}
          </span>
          <span className={comentliked ? "font-bold" : ""}>{likecount}</span>
        </button>
      </div>

      {/* Like Count on Right Side - Alternative Display */}
      <div className="flex-shrink-0 flex items-start pt-1">
        <div className={`flex flex-col items-center gap-0.5 transition-colors ${
          comentliked ? "text-red-500" : "text-gray-300 group-hover:text-gray-400"
        }`}>
          <button
            disabled={loading}
            onClick={handlecommentLike}
            className="p-1.5 rounded-full hover:bg-red-50 transition-all duration-200"
          >
            {comentliked ? (
              <HeartFilled className="w-4 h-4" />
            ) : (
              <Heart className="w-4 h-4" />
            )}
          </button>
          <span className="text-xs font-semibold">{likecount}</span>
        </div>
      </div>
    </div>
  );
}

export default Comment;
