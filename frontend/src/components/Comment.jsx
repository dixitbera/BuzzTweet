import React, { useState } from "react";
import { Heart } from "lucide-react";
import { HeartFilled } from "@ant-design/icons";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

function Comment({ comm }) {
  const navigate = useNavigate();
  const [com] = useState(comm);
  const [likecount, setlikecount] = useState(comm?.likecount ?? 0);
  const [loading, setLoading] = useState(false);
  const [comentliked, setcomentliked] = useState(comm?.liked);

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const diffMs = Date.now() - date;
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
        `${import.meta.env.VITE_API_URL}/post/commentlike`,
        { commentid: com._id },
        { withCredentials: true }
      );
    } catch {
      navigate("/login");
      setlikecount((prev) => (!c ? prev + 1 : prev - 1));
      setcomentliked(!c);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex gap-2.5 py-2 group">
      {/* Avatar */}
      <div className="flex-shrink-0">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs"
          style={{ background: "linear-gradient(135deg, #6366f1, #a855f7)" }}
        >
          {com?.userid?.username?.[0]?.toUpperCase() || "U"}
        </div>
      </div>

      {/* Comment bubble */}
      <div className="flex-1 min-w-0">
        <div
          className="px-3 py-2.5 rounded-2xl rounded-tl-sm"
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <Link
              to={`/u/${com?.userid?.username}`}
              className="text-xs font-semibold text-indigo-300 hover:text-indigo-200 transition-colors focus-visible:outline-none focus-visible:underline"
            >
              {com?.userid?.username}
            </Link>
            <span className="text-slate-600 text-xs">·</span>
            <span className="text-slate-500 text-xs">{formatDate(com?.commentat)}</span>
          </div>
          <p className="text-sm text-slate-200 leading-relaxed break-words">{com?.comment}</p>
        </div>
      </div>

      {/* Like */}
      <div className="flex-shrink-0 flex flex-col items-center pt-1">
        <button
          disabled={loading}
          onClick={handlecommentLike}
          aria-label={comentliked ? "Unlike comment" : "Like comment"}
          className={`p-1.5 rounded-full transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 ${
            comentliked ? "text-red-400" : "text-slate-600 hover:text-red-400 hover:bg-red-500/10"
          }`}
        >
          {comentliked ? (
            <HeartFilled style={{ fontSize: "14px" }} aria-hidden="true" />
          ) : (
            <Heart className="w-3.5 h-3.5" aria-hidden="true" />
          )}
        </button>
        {likecount > 0 && (
          <span className="text-[10px] font-semibold text-slate-500">{likecount}</span>
        )}
      </div>
    </div>
  );
}

export default Comment;
