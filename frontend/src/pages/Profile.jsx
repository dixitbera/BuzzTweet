import React, { useEffect, useState, useRef } from "react";
import Navbar from "../components/Navbar";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Grid, Clock, Users, UserPlus, Loader2, Settings, Sparkles } from "lucide-react";
import Profilesetting from "../components/Profilesetting.jsx";
import ProfilePostcard from "../components/ProfilePostcard.jsx";
import Alert from "../components/Alert.jsx";
import ModalWrapper from "../components/ModalWrapper.jsx";
import { Trash2 } from "lucide-react";

function Profile({ toast }) {
  const navigate = useNavigate();
  const [data, setdata] = useState({});
  const [show, setshow] = useState(false);
  const loaderRef = useRef(null);
  const [hasmore, sethasmore] = useState(true);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cursor, setCursor] = useState(undefined);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastConfig, setToastConfig] = useState({ type: "", message: "" });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => { getdetails(); fetchPost(undefined); }, []);

  async function getdetails() {
    try {
      const req = await axios.get(`${import.meta.env.VITE_API_URL}/profile`, {
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      });
      setdata(req.data);
      setCurrentUserId(req.data._id);
    } catch { navigate("/login"); }
  }

  async function fetchPost(cursor) {
    if (!hasmore || loading) return;
    setLoading(true);
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/user/post/`, {
        params: { cursor },
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      });
      const { dataf: newPosts, hasmore: more, cursorb } = res.data;
      if (!cursor) setPosts(newPosts);
      else setPosts((prev) => [...prev, ...newPosts]);
      sethasmore(more);
      setCursor(cursorb);
    } catch {}
    finally { setLoading(false); }
  }

  const handlePostUpdate = (updatedPost) =>
    setPosts((prev) => prev.map((p) => (p._id === updatedPost._id ? updatedPost : p)));

  const handlePostDelete = (postId) => {
    setPosts((prev) => prev.filter((p) => p._id !== postId));
    setdata((prev) => ({ ...prev, postcount: Math.max(0, (prev.postcount || 1) - 1) }));
  };

  const handleShowToast = (type, message) => {
    if (toast) toast[type](message);
    else { setToastConfig({ type, message }); setShowToast(true); }
  };

  const handleDeleteRequest = (postId) => { setPostToDelete(postId); setShowDeleteConfirm(true); };

  const confirmDeletePost = async () => {
    if (!postToDelete) return;
    setIsDeleting(true);
    try {
      const res = await axios.delete(`${import.meta.env.VITE_API_URL}/post/delete`, {
        data: { postid: postToDelete },
        withCredentials: true,
      });
      if (res.data?.flag) {
        handleShowToast("success", "Post deleted successfully!");
        setPosts((prev) => prev.filter((p) => {
          const pId = p._id?.toString();
          const dId = postToDelete?.toString();
          return pId !== dId;
        }));
        setdata((prev) => ({ ...prev, postcount: Math.max(0, (prev.postcount || 1) - 1) }));
      } else {
        handleShowToast("error", res.data?.message || "Failed to delete post");
      }
    } catch { handleShowToast("error", "Failed to delete post. Please try again."); }
    finally { setIsDeleting(false); setShowDeleteConfirm(false); setPostToDelete(null); }
  };

  useEffect(() => {
    if (!hasmore) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting && !loading) fetchPost(cursor); },
      { threshold: 0.5 }
    );
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [hasmore, loading, cursor]);

  const handleUpdate = (newValue) => { getdetails(); setshow(newValue); };

  return (
    <>
      <Navbar />
      {show && <Profilesetting showf={handleUpdate} dataf={data} />}

      {showToast && (
        <Alert type={toastConfig.type} message={toastConfig.message} onClose={() => setShowToast(false)} duration={3000} />
      )}

      {/* Delete Modal */}
      {showDeleteConfirm && (
        <ModalWrapper showf={setShowDeleteConfirm}>
          <div className="p-6 max-w-sm mx-auto">
            <div className="text-center">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)" }}
              >
                <Trash2 className="w-8 h-8 text-red-400" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Delete Post?</h3>
              <p className="text-slate-400 mb-6">This action cannot be undone. Your post will be permanently deleted.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowDeleteConfirm(false); setPostToDelete(null); }}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeletePost}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-white flex items-center justify-center gap-2 disabled:opacity-70 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                  style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)" }}
                >
                  {isDeleting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />Deleting…</>
                  ) : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </ModalWrapper>
      )}

      <div className="page-content py-8 px-4" style={{ background: "var(--bg-base)" }}>
        {/* Background accents */}
        <div className="fixed inset-0 -z-10 pointer-events-none">
          <div className="absolute top-0 left-1/3 w-[400px] h-[300px] rounded-full"
            style={{ background: "rgba(99,102,241,0.05)", filter: "blur(80px)" }} />
        </div>

        <div className="max-w-2xl mx-auto space-y-5">

          {/* ── Profile Card ─────────────────────────────────────────── */}
          <div className="glass-card overflow-hidden">
            {/* Banner */}
            <div
              className="h-24 relative"
              style={{
                background: "linear-gradient(135deg, rgba(99,102,241,0.4) 0%, rgba(168,85,247,0.35) 50%, rgba(6,182,212,0.25) 100%)",
              }}
            >
              {/* Decorative overlay */}
              <div className="absolute inset-0 opacity-20"
                style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.3) 1px, transparent 1px)", backgroundSize: "16px 16px" }} />
            </div>

            <div className="px-5 pb-5">
              {/* Avatar row */}
              <div className="flex items-end justify-between -mt-10 mb-4">
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-xl"
                  style={{
                    background: "linear-gradient(135deg, #6366f1, #a855f7)",
                    border: "3px solid rgba(13,14,28,0.9)",
                    boxShadow: "0 0 0 3px rgba(99,102,241,0.3)",
                  }}
                >
                  {data?.username?.[0]?.toUpperCase() || "U"}
                </div>
                <button
                  onClick={() => handleUpdate(true)}
                  aria-label="Edit profile settings"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-slate-300 hover:text-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                >
                  <Settings className="w-4 h-4" aria-hidden="true" />
                  Edit Profile
                </button>
              </div>

              {/* Username & bio */}
              <div className="mb-4">
                <h1 className="text-xl font-bold text-white mb-0.5">{data.username || "Loading…"}</h1>
                <p className="text-slate-400 text-sm">@{data.username || "user"}</p>
                {data?.bio && <p className="text-slate-300 text-sm mt-2 leading-relaxed">{data.bio}</p>}
              </div>

              {/* Stats */}
              <div className="flex flex-wrap gap-4">
                {[
                  { icon: Grid, value: data?.postcount || 0, label: "Posts", color: "text-indigo-400" },
                  { icon: Users, value: data?.followers || 0, label: "Followers", color: "text-pink-400" },
                  { icon: UserPlus, value: data?.following || 0, label: "Following", color: "text-emerald-400" },
                ].map(({ icon: Icon, value, label, color }) => (
                  <div
                    key={label}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    <Icon className={`w-4 h-4 ${color}`} aria-hidden="true" />
                    <span className="font-bold text-white text-sm" style={{ fontVariantNumeric: "tabular-nums" }}>{value}</span>
                    <span className="text-slate-500 text-xs">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Posts Section ─────────────────────────────────────────── */}
          {(data?.postcount ?? -1) < 1 && (data?.postcount ?? -1) !== -1 && (
            <div className="glass-card p-10 text-center">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: "rgba(99,102,241,0.1)" }}
              >
                <Sparkles className="w-7 h-7 text-indigo-400" aria-hidden="true" />
              </div>
              <h3 className="text-white font-semibold mb-2">No Posts Yet</h3>
              <p className="text-slate-500 text-sm">Start sharing your thoughts with the world!</p>
            </div>
          )}

          {(data?.postcount ?? 0) > 0 && (
            <>
              {/* Posts header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg, #6366f1, #a855f7)" }}
                  >
                    <Grid className="w-4.5 h-4.5 text-white" aria-hidden="true" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">Your Posts</h2>
                    <p className="text-xs text-slate-500">{data?.postcount || 0} total</p>
                  </div>
                </div>
                <div
                  className="flex items-center gap-1.5 text-xs text-slate-400 px-3 py-1.5 rounded-full"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                  Recent first
                </div>
              </div>

              {/* Posts list */}
              <div className="space-y-4">
                {posts.map((post, idx) => (
                  <div
                    key={post._id}
                    className="animate-fade-in"
                    style={{ animationDelay: `${idx * 80}ms` }}
                  >
                    <ProfilePostcard
                      post={post}
                      currentUserId={currentUserId}
                      onPostUpdate={handlePostUpdate}
                      onPostDelete={handlePostDelete}
                      onShowToast={handleShowToast}
                      onDeleteRequest={handleDeleteRequest}
                      toast={toast}
                    />
                  </div>
                ))}
              </div>

              {/* Infinite scroll loader */}
              {hasmore && (
                <div ref={loaderRef} className="h-14 flex items-center justify-center" aria-live="polite">
                  {loading && (
                    <div
                      className="w-8 h-8 rounded-full animate-spin"
                      style={{ border: "2px solid rgba(99,102,241,0.2)", borderTopColor: "#6366f1" }}
                    />
                  )}
                </div>
              )}

              {!hasmore && posts.length > 0 && (
                <div className="glass-card p-5 text-center">
                  <p className="text-slate-500 text-sm">🎉 You're all caught up!</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default Profile;
