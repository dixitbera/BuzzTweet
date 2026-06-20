import React, { useState, useRef, useEffect } from "react";
import { MessageCircle, Clock, MoreHorizontal, Send, Heart } from "lucide-react";
import { HeartFilled, HeartOutlined } from "@ant-design/icons";
import axios from "axios";
import Comment from "./Comment.jsx";
import { useNavigate, Link } from "react-router-dom";

function PostCard({ post, currentUserId, IsHoveCard }) {
  const navigate = useNavigate();
  const [loaded, setloaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [likeAnim, setLikeAnim] = useState(false);
  const [likes, setLikes] = useState(post.likeCount);
  const [liked, setLiked] = useState(post.liked);
  const [comment, setcomment] = useState([]);
  const [commentcount, setCommentCount] = useState(post?.CommentCount);
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [hasMore, setHasMore] = useState(false);
  const loaderRef = useRef(null);
  const [cursor, setCursor] = useState(null);
  const timerRef = useRef(null);
  const cache = useRef({});
  const [profile, setProfile] = useState(null);
  const [showCard, setShowCard] = useState(false);
  const authorRef = useRef(null);
  const [cardPosition, setCardPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (showCard && authorRef.current) {
      const rect = authorRef.current.getBoundingClientRect();
      setCardPosition({ top: rect.bottom + 12, left: rect.left });
    }
  }, [showCard]);

  useEffect(() => {
    if (!showCommentBox || !hasMore) return;
    setloaded(false);
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) Commentload();
    });
    if (loaderRef.current) observer.observe(loaderRef.current);
    setloaded(true);
    return () => observer.disconnect();
  }, [hasMore]);

  async function dblike(liked) {
    try {
      await axios.patch(
        `${import.meta.env.VITE_API_URL}/post`,
        { like: liked, postid: post._id, date: new Date() },
        { withCredentials: true }
      );
    } catch {
      navigate("/login");
      setLiked((prev) => !prev);
      setLikes((prev) => (liked ? prev - 1 : prev + 1));
    } finally {
      setLoading(false);
    }
  }

  function handleLike() {
    if (loading) return;
    const updatedLike = !liked;
    setLiked(updatedLike);
    setLikes((prev) => (updatedLike ? prev + 1 : prev - 1));
    if (updatedLike) {
      setLikeAnim(true);
      setTimeout(() => setLikeAnim(false), 400);
    }
    setLoading(true);
    dblike(updatedLike);
  }

  async function handleComment() {
    if (!commentText.trim()) return;
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/post/comment`,
        { postid: post?._id, commentText },
        { withCredentials: true }
      );
      setCommentCount((prev) => prev + 1);
    } catch {
      navigate("/login");
    }
    setCommentText("");
    setCursor(null);
    setHasMore(true);
    setcomment([]);
    Commentload();
  }

  async function Commentload() {
    if (loaded && !hasMore) return;
    try {
      const req = await axios.get(`${import.meta.env.VITE_API_URL}/post/comment`, {
        params: { postid: post._id, cursor },
        withCredentials: true,
      });
      setcomment((prev) => prev.concat(req.data.newcomm));
      setHasMore(req.data.hasmore);
      setCursor(req.data.setcursor);
      setloaded(true);
    } catch {
      setloaded(false);
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const diffMs = Date.now() - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const handleMouseEnter = (id) => {
    if (!IsHoveCard) return;
    timerRef.current = setTimeout(async () => {
      if (cache.current[id]) { setProfile(cache.current[id]); setShowCard(true); return; }
      const data = await fetchProfile(id);
      cache.current[id] = data;
      setProfile(data);
      setShowCard(true);
    }, 300);
  };

  const handleMouseLeave = () => {
    if (!IsHoveCard) return;
    clearTimeout(timerRef.current);
    setShowCard(false);
    setProfile(null);
  };

  const fetchProfile = async (UserID) => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/user/preview`,
        { author: UserID },
        { withCredentials: true, headers: { "Content-Type": "application/json" } }
      );
      return response.data;
    } catch {
      return -1;
    }
  };

  const ProfilePreviewCard = ({ profile }) => (
    <div
      style={{
        position: "fixed",
        top: cardPosition.top,
        left: cardPosition.left,
        zIndex: 1050,
        width: "260px",
      }}
      className="animate-fade-in glass-card p-4 shadow-2xl"
    >
      {!profile ? (
        <div className="animate-pulse space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-white/10" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-white/10 rounded w-24" />
              <div className="h-2 bg-white/10 rounded w-16" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3].map((i) => <div key={i} className="h-8 bg-white/10 rounded" />)}
          </div>
          <div className="h-7 bg-white/10 rounded-lg" />
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-white text-sm flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #6366f1, #a855f7)" }}
            >
              {profile.username?.[0]?.toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-semibold text-white leading-tight">
                <Link to={`/u/${profile.username}`}>{profile.username}</Link>
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                <Link to={`/u/${profile.username}`}>@{profile.username}</Link>
              </p>
            </div>
          </div>
          <div
            className="grid grid-cols-3 divide-x mb-4 rounded-xl overflow-hidden"
            style={{ divideColor: "rgba(255,255,255,0.08)", borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
          >
            {[
              { val: profile.postcount, label: "posts" },
              { val: profile.followers, label: "followers" },
              { val: profile.following, label: "following" },
            ].map(({ val, label }) => (
              <div key={label} className="py-2.5 text-center" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                <p className="text-sm font-bold text-white">{val}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
          <Link
            to={`/u/${profile.username}`}
            className="block w-full py-2 text-xs font-semibold text-center rounded-lg transition-all text-indigo-300 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)" }}
          >
            View Profile
          </Link>
        </>
      )}
    </div>
  );

  return (
    <div
      className="glass-card overflow-hidden group"
      style={{ borderRadius: "16px" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-3">
        <div
          ref={authorRef}
          className="flex items-center gap-3 cursor-pointer"
          onMouseEnter={() => handleMouseEnter(post.author._id)}
          onMouseLeave={handleMouseLeave}
        >
          {showCard && <ProfilePreviewCard profile={profile} />}
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm flex-shrink-0 transition-transform group-hover:scale-105"
            style={{
              background: "linear-gradient(135deg, #6366f1, #a855f7)",
              boxShadow: "0 0 0 2px rgba(99,102,241,0.3)",
            }}
          >
            {post.author?.username?.[0]?.toUpperCase() || "U"}
          </div>
          <div>
            <p className="font-semibold text-white text-sm hover:text-indigo-300 transition-colors">
              <Link to={`/u/${post.author?.username}`}>{post.author?.username}</Link>
            </p>
            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
              <Clock className="w-3 h-3" aria-hidden="true" />
              {formatDate(post.PostAt)}
            </p>
          </div>
        </div>
        <button
          aria-label="More options"
          className="p-2 hover:bg-white/5 rounded-full transition-colors text-slate-500 hover:text-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          <MoreHorizontal className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        <p className="text-slate-200 text-sm sm:text-base leading-relaxed whitespace-pre-wrap break-words">
          {post.content}
        </p>
        {post.image && (
          <div className="mt-3 rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
            <img
              src={`${import.meta.env.VITE_API_URL}/uploads/${post.image}`}
              alt="Post image"
              width={800}
              height={600}
              className="w-full max-h-96 object-cover"
              loading="lazy"
            />
          </div>
        )}
      </div>

      {/* Actions */}
      <div
        className="flex items-center gap-1 px-4 py-2"
        style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
      >
        <button
          disabled={loading}
          onClick={handleLike}
          aria-label={liked ? "Unlike post" : "Like post"}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-full transition-all duration-200 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
            liked
              ? "text-red-400"
              : "text-slate-400 hover:text-red-400 hover:bg-red-500/10"
          } ${likeAnim ? "animate-like-pop" : ""}`}
          style={liked ? { background: "rgba(239,68,68,0.1)" } : {}}
        >
          {liked ? (
            <HeartFilled style={{ fontSize: "18px" }} aria-hidden="true" />
          ) : (
            <HeartOutlined style={{ fontSize: "18px" }} aria-hidden="true" />
          )}
          <span style={{ fontVariantNumeric: "tabular-nums" }}>{likes}</span>
        </button>

        <button
          onClick={() => { Commentload(); setShowCommentBox(!showCommentBox); }}
          aria-label={showCommentBox ? "Hide comments" : "Show comments"}
          aria-expanded={showCommentBox}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-full transition-all duration-200 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
            showCommentBox
              ? "text-indigo-400"
              : "text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10"
          }`}
          style={showCommentBox ? { background: "rgba(99,102,241,0.1)" } : {}}
        >
          <MessageCircle className="w-5 h-5" aria-hidden="true" />
          <span style={{ fontVariantNumeric: "tabular-nums" }}>{commentcount || 0}</span>
        </button>
      </div>

      {/* Comment Box */}
      {showCommentBox && (
        <div className="px-4 pb-4 animate-fade-in">
          <div
            className="rounded-xl p-3 space-y-3"
            style={{ background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.05)" }}
          >
            {/* Comments list */}
            <div className="max-h-64 overflow-y-auto space-y-2 scrollbar-dark">
              {comment.length === 0 && (
                <p className="text-center text-sm text-slate-500 py-3">
                  No comments yet. Be the first!
                </p>
              )}
              {comment.map((c) => <Comment key={c._id} comm={c} />)}
              {hasMore && <div ref={loaderRef} className="h-6" aria-hidden="true" />}
            </div>

            {/* Comment input */}
            <div className="flex gap-2">
              <input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleComment()}
                placeholder="Write a comment…"
                aria-label="Write a comment"
                className="glass-input flex-1 px-3 py-2.5 rounded-xl text-sm text-white"
              />
              <button
                onClick={handleComment}
                disabled={!commentText.trim()}
                aria-label="Send comment"
                className="btn-primary px-3 py-2 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                <Send className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PostCard;
