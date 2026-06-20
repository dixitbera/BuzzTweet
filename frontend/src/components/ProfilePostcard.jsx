import React, { useState, useRef, useEffect } from "react";
import {
  MessageCircle, Clock, MoreHorizontal, Send, Pencil, Trash2,
  X, Check, Loader2,
} from "lucide-react";
import { HeartFilled, HeartOutlined } from "@ant-design/icons";
import axios from "axios";
import Comment from "./Comment.jsx";
import { useNavigate } from "react-router-dom";

function ProfilePostcard({
  post, currentUserId, onPostUpdate, onPostDelete,
  onShowToast, onDeleteRequest, toast,
}) {
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
  const [showOptions, setShowOptions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [isSaving, setIsSaving] = useState(false);
  const loaderRef = useRef(null);
  const [cursor, setCursor] = useState(null);
  const optionsRef = useRef(null);

  const isOwner = post.author?._id === currentUserId || post.author === currentUserId;

  const showToastMsg = (type, message, duration = 3000, onUndo = null) => {
    if (toast) toast[type](message, duration, onUndo);
    else if (onShowToast) onShowToast(type, message);
  };

  useEffect(() => {
    function handleClickOutside(e) {
      if (optionsRef.current && !optionsRef.current.contains(e.target)) setShowOptions(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function dblike(l) {
    try {
      await axios.patch(`${import.meta.env.VITE_API_URL}/post`,
        { like: l, postid: post._id, date: new Date() }, { withCredentials: true });
    } catch {
      navigate("/login");
      setLiked((p) => !p);
      setLikes((p) => (l ? p - 1 : p + 1));
    } finally { setLoading(false); }
  }

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

  function handleLike() {
    if (loading) return;
    const u = !liked;
    setLiked(u);
    setLikes((p) => (u ? p + 1 : p - 1));
    if (u) { setLikeAnim(true); setTimeout(() => setLikeAnim(false), 400); }
    setLoading(true);
    dblike(u);
  }

  async function handleComment() {
    if (!commentText.trim()) return;
    const text = commentText;
    const tempId = `temp-${Date.now()}`;
    const optimistic = { _id: tempId, comment: text, commentat: new Date().toISOString(), userid: { username: "You" }, likecount: 0, liked: false };
    setcomment((p) => [optimistic, ...p]);
    setCommentCount((p) => (p || 0) + 1);
    setCommentText("");
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/post/comment`,
        { postid: post?._id, commentText: text }, { withCredentials: true });
    } catch (e) {
      setcomment((p) => p.filter((c) => c._id !== tempId));
      setCommentCount((p) => p - 1);
      setCommentText(text);
      if (e.response?.status === 401) navigate("/login");
    }
  }

  async function Commentload() {
    if (loaded && !hasMore) return;
    try {
      const req = await axios.get(`${import.meta.env.VITE_API_URL}/post/comment`,
        { params: { postid: post._id, cursor }, withCredentials: true });
      setcomment((p) => p.concat(req.data.newcomm));
      setHasMore(req.data.hasmore);
      setCursor(req.data.setcursor);
      setloaded(true);
    } catch { setloaded(false); }
  }

  async function handleEditPost() {
    if (!editContent.trim()) { showToastMsg("error", "Post content cannot be empty"); return; }
    const prev = post.content;
    setIsSaving(true);
    try {
      const res = await axios.patch(`${import.meta.env.VITE_API_URL}/post/update`,
        { postid: post._id, content: editContent }, { withCredentials: true });
      if (res.data?.flag) {
        showToastMsg("success", "Post updated!", 5000, () => handleUndoEdit(post._id, prev));
        setIsEditing(false);
        if (onPostUpdate) onPostUpdate({ ...post, content: editContent });
      } else {
        showToastMsg("error", res.data?.message || "Failed to update post");
      }
    } catch { showToastMsg("error", "Failed to update post."); }
    finally { setIsSaving(false); }
  }

  async function handleUndoEdit(postId, prevContent) {
    try {
      const res = await axios.patch(`${import.meta.env.VITE_API_URL}/post/update`,
        { postid: postId, content: prevContent }, { withCredentials: true });
      if (res.data?.flag) {
        setEditContent(prevContent);
        if (onPostUpdate) onPostUpdate({ ...post, content: prevContent });
      }
    } catch {}
  }

  const formatDate = (ds) => {
    const d = new Date(ds); const ms = Date.now() - d;
    const m = Math.floor(ms / 60000); const h = Math.floor(ms / 3600000); const day = Math.floor(ms / 86400000);
    if (m < 1) return "Just now"; if (m < 60) return `${m}m ago`;
    if (h < 24) return `${h}h ago`; if (day < 7) return `${day}d ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className="glass-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-3">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #6366f1, #a855f7)" }}
          >
            {post.author?.username?.[0]?.toUpperCase() || "U"}
          </div>
          <div>
            <p className="font-semibold text-white text-sm">{post.author?.username}</p>
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <Clock className="w-3 h-3" aria-hidden="true" />
              {formatDate(post.PostAt)}
            </p>
          </div>
        </div>

        {isOwner && (
          <div className="relative" ref={optionsRef}>
            <button
              onClick={() => setShowOptions(!showOptions)}
              aria-label="Post options"
              aria-expanded={showOptions}
              className="p-2 hover:bg-white/5 rounded-full transition-colors text-slate-500 hover:text-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <MoreHorizontal className="w-5 h-5" aria-hidden="true" />
            </button>

            {showOptions && (
              <div
                className="absolute right-0 mt-2 w-44 rounded-xl py-1 z-10 animate-fade-in"
                style={{
                  background: "rgba(13,14,28,0.97)",
                  backdropFilter: "blur(16px)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
                }}
              >
                <button
                  onClick={() => { setShowOptions(false); setIsEditing(true); }}
                  className="w-full px-4 py-2.5 text-left text-sm text-slate-300 hover:text-white hover:bg-white/5 flex items-center gap-3 transition-colors focus-visible:outline-none focus-visible:ring-inset focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                  <Pencil className="w-4 h-4 text-indigo-400" aria-hidden="true" />
                  Edit Post
                </button>
                <button
                  onClick={() => {
                    setShowOptions(false);
                    if (onDeleteRequest) onDeleteRequest(post._id);
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 flex items-center gap-3 transition-colors focus-visible:outline-none focus-visible:ring-inset focus-visible:ring-2 focus-visible:ring-red-500"
                >
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                  Delete Post
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        {isEditing ? (
          <div className="space-y-3">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="glass-input w-full px-4 py-3 rounded-xl text-sm text-white leading-relaxed resize-none"
              rows={4}
              placeholder="What's on your mind?"
              aria-label="Edit post content"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { setEditContent(post.content); setIsEditing(false); }}
                className="px-4 py-2 text-sm text-slate-400 hover:text-white rounded-xl transition-colors flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
                style={{ background: "rgba(255,255,255,0.05)" }}
              >
                <X className="w-4 h-4" aria-hidden="true" /> Cancel
              </button>
              <button
                onClick={handleEditPost}
                disabled={isSaving || !editContent.trim()}
                className="btn-primary px-4 py-2 text-sm rounded-xl flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                {isSaving ? (
                  <><Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />Saving…</>
                ) : (
                  <><Check className="w-4 h-4" aria-hidden="true" />Save</>
                )}
              </button>
            </div>
          </div>
        ) : (
          <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap break-words">{post.content}</p>
        )}

        {post.image && !isEditing && (
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
      {!isEditing && (
        <div className="flex items-center gap-1 px-4 py-2" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <button
            disabled={loading}
            onClick={handleLike}
            aria-label={liked ? "Unlike" : "Like"}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-full transition-all text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
              liked ? "text-red-400" : "text-slate-400 hover:text-red-400 hover:bg-red-500/10"
            } ${likeAnim ? "animate-like-pop" : ""}`}
            style={liked ? { background: "rgba(239,68,68,0.1)" } : {}}
          >
            {liked ? <HeartFilled style={{ fontSize: "18px" }} aria-hidden="true" /> : <HeartOutlined style={{ fontSize: "18px" }} aria-hidden="true" />}
            <span style={{ fontVariantNumeric: "tabular-nums" }}>{likes}</span>
          </button>

          <button
            onClick={() => { Commentload(); setShowCommentBox(!showCommentBox); }}
            aria-label="Comments"
            aria-expanded={showCommentBox}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-full transition-all text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
              showCommentBox ? "text-indigo-400" : "text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10"
            }`}
            style={showCommentBox ? { background: "rgba(99,102,241,0.1)" } : {}}
          >
            <MessageCircle className="w-5 h-5" aria-hidden="true" />
            <span style={{ fontVariantNumeric: "tabular-nums" }}>{commentcount || 0}</span>
          </button>

          {!isOwner && post.author?._id && (
            <button
              onClick={() => navigate("/messages", { state: { openChatWith: { userId: post.author._id, username: post.author.username } } })}
              className="flex items-center gap-1.5 px-3 py-2 rounded-full transition-all text-sm text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 ml-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <Send className="w-4 h-4" aria-hidden="true" />
              <span className="text-xs font-medium">Message</span>
            </button>
          )}
        </div>
      )}

      {/* Comments */}
      {showCommentBox && !isEditing && (
        <div className="px-4 pb-4 animate-fade-in">
          <div className="rounded-xl p-3 space-y-3" style={{ background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.05)" }}>
            <div className="max-h-64 overflow-y-auto space-y-1 scrollbar-dark">
              {comment.length === 0 && (
                <p className="text-center text-sm text-slate-500 py-3">No comments yet. Be the first!</p>
              )}
              {comment.map((c) => <Comment key={c._id} comm={c} />)}
              {hasMore && <div ref={loaderRef} className="h-6" aria-hidden="true" />}
            </div>
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

export default ProfilePostcard;
