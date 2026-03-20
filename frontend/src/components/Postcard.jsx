import React, { useState, useRef, useEffect } from "react";
import { MessageCircle, Clock, MoreHorizontal, Send } from "lucide-react";
import { HeartFilled, HeartOutlined } from "@ant-design/icons";
import axios from "axios";
import Comment from "./Comment.jsx";
import { useNavigate } from "react-router-dom";

function PostCard({ post, currentUserId }) {
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
  const loaderRef = useRef(null);
  const [cursor, setCursor] = useState(null);

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
    try {
      await axios.post(
        "http://localhost:5000/post/comment",
        { postid: post?._id, commentText: commentText },
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
  const timerRef = useRef(null);
  const cache = useRef({});
  const [profile,setProfile]=useState(null);
  const [showCard, setShowCard] = useState(false);
  const authorRef = useRef(null);
  const [cardPosition, setCardPosition] = useState({ top: 0, left: 0 });

  // Calculate card position
  useEffect(() => {
    if (showCard && authorRef.current) {
      const rect = authorRef.current.getBoundingClientRect();
      setCardPosition({
        top: rect.bottom + 12,
        left: rect.left,
      });
    }
  }, [showCard]);

  const handleMouseEnter = (id) => {
    timerRef.current = setTimeout(async () => {
      console.log("FetchProfile 300Ms ")
      console.log(post)
      setShowCard(true);
      if (cache.current[id]) {
        setProfile(cache.current[id]);
        console.log("cache", cache.current[id]);
        return
      }
      const data = await fetchproifle(id);  
      console.log("api",data)
       cache.current[id] = data;
       setProfile(data);
      // fetchProfile(userId); // only fires if user hovers 300ms+
    }, 300);
  };

  const handleMouseLeave = () => {
    clearTimeout(timerRef.current);
    setShowCard(false)
    setProfile(null) // cursor left before 300ms → no API call
  };
  const fetchproifle=async (UserID) => {
      try {
        const response = await axios.post(
          "http://localhost:5000/api/user/preview",
          { author: UserID },
            {withCredentials: true,
            headers: { "Content-Type": "application/json" },
          },
        );
       return response.data;
      } catch (e) {
        console.log(e);
        return -1;
      }
  }
  // Profile Preview Card Component
  const ProfilePreviewCard = ({ profile }) => {
    if (!profile)
      return (
        <div
          style={{
            position: "fixed",
            top: cardPosition.top,
            left: cardPosition.left,
            zIndex: 1050,
            width: "260px",
            boxShadow: "0 12px 32px rgba(60,60,90,0.15)",
            borderRadius: "18px",
            background: "#fff",
            border: "1.5px solid #e5e7eb",
            padding: "16px",
          }}
          className="animate-pulse"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-full bg-gray-100 animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-gray-100 rounded animate-pulse w-24" />
              <div className="h-2 bg-gray-100 rounded animate-pulse w-16" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
          <div className="h-7 bg-gray-100 rounded-lg animate-pulse" />
        </div>
      );
    return (
      <div
        style={{
          position: "fixed",
          top: cardPosition.top,
          left: cardPosition.left,
          zIndex: 1050,
          width: "260px",
          boxShadow: "0 12px 32px rgba(60,60,90,0.15)",
          borderRadius: "18px",
          background: "#fff",
          border: "1.5px solid #e5e7eb",
          padding: "16px",
        }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-semibold text-white text-base flex-shrink-0 shadow-md">
            {profile.username[0].toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 leading-tight">
              {profile.username}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">@{profile.username}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 divide-x divide-gray-100 border-y border-gray-100 mb-4">
          <div className="py-2 text-center">
            <p className="text-sm font-semibold text-gray-900">
              {profile.postcount}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">posts</p>
          </div>
          <div className="py-2 text-center">
            <p className="text-sm font-semibold text-gray-900">
              {profile.followers}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">followers</p>
          </div>
          <div className="py-2 text-center">
            <p className="text-sm font-semibold text-gray-900">
              {profile.following}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">following</p>
          </div>
        </div>
        <button className="w-full text-xs font-medium py-2 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 transition-colors shadow-sm">
          Follow
        </button>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-3 relative">
        <div
          className="flex items-center gap-3 cursor-pointer group"
          onMouseEnter={() => handleMouseEnter(post.author._id)}
          onMouseLeave={handleMouseLeave}
          ref={authorRef}
        >
          {showCard && <ProfilePreviewCard profile={profile} />}
          <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white shadow-md border-2 border-white">
            {post.author?.username[0].toUpperCase() || "U"}
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
        <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <MoreHorizontal className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        <p className="text-gray-700 text-sm sm:text-base leading-relaxed whitespace-pre-wrap">
          {post.content}
        </p>
        {image && (
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

      {/* Comment Box */}
      {showCommentBox && (
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
  );
}

export default PostCard;
