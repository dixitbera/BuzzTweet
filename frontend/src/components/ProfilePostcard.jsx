import React, { useState, useRef, useEffect } from "react";
import { MessageCircle, Clock, MoreHorizontal, Send, Pencil, Trash2, X, Check, Loader2 } from "lucide-react";
import { HeartFilled, HeartOutlined } from "@ant-design/icons";
import axios from "axios";
import Comment from "./Comment.jsx";
import { useNavigate } from "react-router-dom";

function ProfilePostcard({ post, currentUserId, onPostUpdate, onPostDelete, onShowToast, onDeleteRequest, toast }) {
  const navigate = useNavigate();
  const [loaded, setloaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [likes, setLikes] = useState(post.likeCount);
  const [liked, setLiked] = useState(post.liked);
  const [comment, setcomment] = useState([]);
  const [image, setimage] = useState(post.image);
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

  // Check if current user is the post owner
  const isOwner =
    post.author?._id === currentUserId || post.author === currentUserId;

  const showToast = (type, message, duration = 3000, onUndo = null) => {
    if (toast) {
      toast[type](message, duration, onUndo);
    } else if (onShowToast) {
      onShowToast(type, message);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (optionsRef.current && !optionsRef.current.contains(event.target)) {
        setShowOptions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function dblike(liked) {
    try {
      await axios.patch(
        "http://localhost:5000/post",
        { like: liked, postid: post._id, date: new Date() },
        { withCredentials: true }
      );
    } catch (error) {
      navigate("/login");
      setLiked((prev) => !prev);
      setLikes((prev) => (liked ? prev - 1 : prev + 1));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!showCommentBox || !hasMore) return;
    setloaded(false);
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        Commentload();
      }
    });

    if (loaderRef.current) observer.observe(loaderRef.current);
    setloaded(true);
    return () => observer.disconnect();
  }, [hasMore]);

  function handleLike() {
    if (loading) return;
    const updatedLike = !liked;
    setLiked(updatedLike);
    setLikes((prev) => (updatedLike ? prev + 1 : prev - 1));
    setLoading(true);
    dblike(updatedLike);
  }

  async function handleComment() {
    if (!commentText.trim()) return;
    
    // Store the comment text for optimistic update
    const newCommentText = commentText;
    const tempId = `temp-${Date.now()}`;
    
    // Optimistically add the new comment to the UI
    const optimisticComment = {
      _id: tempId,
      comment: newCommentText,
      commentat: new Date().toISOString(),
      userid: { username: "You" },
      likecount: 0,
      liked: false
    };
    
    setcomment((prev) => [optimisticComment, ...prev]);
    const previousCount = commentcount || 0;
    setCommentCount(previousCount + 1);
    const currentCommentText = commentText;
    setCommentText("");
    
    try {
      await axios.post(
        "http://localhost:5000/post/comment",
        { postid: post?._id, commentText: currentCommentText },
        { withCredentials: true }
      );
      // Comment posted successfully - keep the optimistic comment in place
      // The backend will eventually sync on next load
    } catch (error) {
      // If API fails, remove the optimistic comment
      setcomment((prev) => prev.filter(c => c._id !== tempId));
      setCommentCount(previousCount);
      setCommentText(currentCommentText);
      
      if (error.response?.status === 401) {
        navigate("/login");
      }
    }
  }

  async function Commentload() {
    if (loaded && !hasMore) return;
    try {
      const req = await axios.get("http://localhost:5000/post/comment", {
        params: { postid: post._id, cursor },
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      });
      setcomment((prev) => prev.concat(req.data.newcomm));
      setHasMore(req.data.hasmore);
      setCursor(req.data.setcursor);
      setloaded(true);
    } catch (error) {
      setloaded(false);
    }
  }

  // Handle Edit Post
  async function handleEditPost() {
    if (!editContent.trim()) {
      showToast("error", "Post content cannot be empty");
      return;
    }
    
    // Store previous content for undo
    const previousContent = post.content;
    
    setIsSaving(true);
    try {
      const res = await axios.patch(
        "http://localhost:5000/post/update",
        { postid: post._id, content: editContent },
        { withCredentials: true }
      );
      if (res.data?.flag) {
        showToast("success", "Post updated successfully!", 5000, () => {
          // Undo action - revert to previous content
          handleUndoEdit(post._id, previousContent);
        });
        setIsEditing(false);
        if (onPostUpdate) {
          onPostUpdate({ ...post, content: editContent });
        }
      } else {
        showToast("error", res.data?.message || "Failed to update post");
      }
    } catch (error) {
      showToast("error", "Failed to update post. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  // Handle undo edit
  async function handleUndoEdit(postId, previousContent) {
    try {
      const res = await axios.patch(
        "http://localhost:5000/post/update",
        { postid: postId, content: previousContent },
        { withCredentials: true }
      );
      if (res.data?.flag) {
        setEditContent(previousContent);
        if (onPostUpdate) {
          onPostUpdate({ ...post, content: previousContent });
        }
      }
    } catch (error) {
      // Silent fail for undo
    }
  }

  // Cancel editing
  const cancelEdit = () => {
    setEditContent(post.content);
    setIsEditing(false);
  };

  // Format date nicely
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <>
      {/* Post Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-4 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white shadow-sm">
              {post.author?.username?.[0]?.toUpperCase() || "U"}
            </div>
            <div>
              <p className="font-semibold text-gray-800 text-sm sm:text-base">
                {post.author?.username}
              </p>
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDate(post.PostAt)}
              </p>
            </div>
          </div>

          {/* Options Button (only for owner) */}
          {isOwner && (
            <div className="relative" ref={optionsRef}>
              <button
                onClick={() => setShowOptions(!showOptions)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <MoreHorizontal className="w-5 h-5 text-gray-400" />
              </button>

              {/* Dropdown Menu */}
              {showOptions && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-10 animate-fadeIn">
                  <button
                    onClick={() => {
                      setShowOptions(false);
                      setIsEditing(true);
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                    Edit Post
                  </button>
                  <button
                    onClick={() => {
                      setShowOptions(false);
                      if (onDeleteRequest) {
                        onDeleteRequest(post._id);
                      } else {
                        setShowDeleteConfirm(true);
                      }
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
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
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-700 text-sm sm:text-base leading-relaxed outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all resize-none"
                rows={4}
                placeholder="What's on your mind?"
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={cancelEdit}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl font-medium text-sm transition-colors flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
                <button
                  onClick={handleEditPost}
                  disabled={isSaving || !editContent.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white rounded-xl font-medium text-sm transition-colors flex items-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Save
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <p className="text-gray-700 text-sm sm:text-base leading-relaxed whitespace-pre-wrap">
              {post.content}
            </p>
          )}
          {image && !isEditing && (
            <div className="mt-3 rounded-xl overflow-hidden shadow-sm">
              <img
                src={"http://localhost:5000/uploads/" + image}
                alt="postimage"
                className="w-full max-h-96 object-cover"
              />
            </div>
          )}
        </div>

        {/* Actions */}
        {!isEditing && (
          <div className="flex items-center gap-1 px-4 py-2 border-t border-gray-50">
            <button
              disabled={loading}
              onClick={handleLike}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-full transition-all duration-200 text-sm ${
                liked ? "text-red-500 bg-red-50" : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              {liked ? (
                <HeartFilled className="w-5 h-5" />
              ) : (
                <HeartOutlined className="w-5 h-5" />
              )}
              <span className="font-medium">{likes}</span>
            </button>

            <button
              onClick={() => {
                Commentload();
                setShowCommentBox(!showCommentBox);
              }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-full transition-all duration-200 text-sm ${
                showCommentBox
                  ? "text-indigo-600 bg-indigo-50"
                  : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              <MessageCircle className="w-5 h-5" />
              <span className="font-medium">{commentcount || 0}</span>
            </button>
          </div>
        )}

        {/* Comment Box */}
        {showCommentBox && !isEditing && (
          <div className="px-4 pb-4">
            <div className="bg-gray-50 rounded-xl p-3 space-y-3">
              {/* Comments List */}
              <div className="max-h-80 overflow-y-auto space-y-2 scrollbar-hide">
                {comment.length === 0 && (
                  <p className="text-center text-sm text-gray-400 py-2">
                    No comments yet
                  </p>
                )}
                {comment.map((c) => (
                  <Comment key={c._id} comm={c} />
                ))}
                {hasMore && <div ref={loaderRef} className="h-8"></div>}
              </div>

              {/* Comment Input */}
              <div className="flex gap-2">
                <input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleComment()}
                  placeholder="Write a comment..."
                  className="flex-1 bg-white border border-gray-200 px-3 py-2 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
                <button
                  onClick={handleComment}
                  disabled={!commentText.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white p-2 rounded-xl transition-colors"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-scaleIn {
          animation: scaleIn 0.2s ease-out;
        }
      `}</style>
    </>
  );
}

export default ProfilePostcard;
