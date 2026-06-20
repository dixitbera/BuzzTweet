import React, { useEffect, useRef, useState } from "react";
import Navbar from "../components/Navbar";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import PostCard from "../components/Postcard.jsx";
import ProfilePostcard from "../components/ProfilePostcard.jsx";
import {
  ArrowLeft, Clock, Grid, Loader2, UserCheck, UserPlus,
  Users, UserX, Trash2, Sparkles, MessageCircle,
} from "lucide-react";
import Alert from "../components/Alert.jsx";
import ModalWrapper from "../components/ModalWrapper.jsx";

function ProfileOfotheruser() {
  const navigate   = useNavigate();
  const { username } = useParams();

  const [data,               setData]               = useState(null);
  const [posts,              setPosts]              = useState([]);
  const [hasmore,            setHasmore]            = useState(true);
  const [loadingPosts,       setLoadingPosts]       = useState(false);
  const [cursor,             setCursor]             = useState(undefined);
  const [profileLoading,     setProfileLoading]     = useState(true);
  const [profileNotFound,    setProfileNotFound]    = useState(false);
  const [profileError,       setProfileError]       = useState("");
  const [isFollowing,        setIsFollowing]        = useState(false);
  const [isOwnProfile,       setIsOwnProfile]       = useState(false);
  const [followLoading,      setFollowLoading]      = useState(false);
  const [showDeleteConfirm,  setShowDeleteConfirm]  = useState(false);
  const [postToDelete,       setPostToDelete]       = useState(null);
  const [isDeleting,         setIsDeleting]         = useState(false);
  const [showToast,          setShowToast]          = useState(false);
  const [toastConfig,        setToastConfig]        = useState({ type: "", message: "" });
  const loaderRef = useRef(null);

  async function fetchPost(nextCursor = undefined, targetUsername = username, ignore = false) {
    if (loadingPosts) return;
    if (nextCursor && !hasmore) return;
    if (profileNotFound) return;
    setLoadingPosts(true);
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/u/post`,
        { username: targetUsername },
        { params: { cursor: nextCursor }, withCredentials: true, headers: { "Content-Type": "application/json" } },
      );
      const { dataf: newPosts = [], hasmore: more = false, cursorb } = res.data;
      if (ignore) return;
      if (!nextCursor) setPosts(newPosts); else setPosts((prev) => [...prev, ...newPosts]);
      setHasmore(Boolean(more)); setCursor(cursorb);
    } catch (error) {
      if (ignore) return;
      const status = error?.response?.status;
      if (status === 401) navigate("/login");
      else if (status === 404) setProfileNotFound(true);
      else setHasmore(false);
    } finally { if (!ignore) setLoadingPosts(false); }
  }

  async function fetchFollowStatus(targetUsername, ignore = false) {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/u/${targetUsername}/follow-status`,
        { withCredentials: true },
      );
      if (ignore) return;
      setIsFollowing(Boolean(response.data?.isFollowing));
      setIsOwnProfile(Boolean(response.data?.isOwnProfile));
    } catch (error) {
      if (ignore) return;
      if (error?.response?.status === 401) navigate("/login");
    }
  }

  useEffect(() => {
    let ignore = false;
    async function loadPage() {
      setProfileLoading(true); setProfileNotFound(false); setProfileError("");
      setData(null); setPosts([]); setHasmore(true); setCursor(undefined);
      setIsFollowing(false); setIsOwnProfile(false);
      try {
        const profileResponse = await axios.get(`http://localhost:5000/api/u/${username}`, { withCredentials: true });
        if (ignore) return;
        const profileData = profileResponse.data;
        setData(profileData);
        let ownProfile = false;
        try {
          const authRes = await axios.get(`${import.meta.env.VITE_API_URL}/check-auth`, { withCredentials: true });
          if (!ignore && authRes?.data?.id) {
            ownProfile = authRes.data.id.toString() === profileData?._id?.toString();
            setIsOwnProfile(ownProfile);
          }
        } catch { if (!ignore) { navigate("/login"); return; } }
        if (!ownProfile) await fetchFollowStatus(username, ignore);
        await fetchPost(undefined, username, ignore);
      } catch (error) {
        if (ignore) return;
        const status = error?.response?.status;
        if (status === 401) { navigate("/login"); return; }
        if (status === 404) { setProfileNotFound(true); return; }
        setProfileError("Unable to load this profile right now.");
      } finally { if (!ignore) setProfileLoading(false); }
    }
    loadPage();
    return () => { ignore = true; };
  }, [navigate, username]);

  useEffect(() => {
    if (profileLoading || profileNotFound || !data || !hasmore) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting && !loadingPosts) fetchPost(cursor); },
      { threshold: 0.5 },
    );
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [cursor, data, hasmore, loadingPosts, profileLoading, profileNotFound]);

  const handleShowToast = (type, message) => { setToastConfig({ type, message }); setShowToast(true); };
  const handlePostUpdate = (updatedPost) => setPosts((prev) => prev.map((p) => (p._id === updatedPost._id ? updatedPost : p)));
  const handlePostDelete = (postId) => {
    setPosts((prev) => prev.filter((p) => p._id !== postId));
    setData((prev) => ({ ...prev, postcount: Math.max(0, (prev.postcount || 1) - 1) }));
  };
  const handleDeleteRequest = (postId) => { setPostToDelete(postId); setShowDeleteConfirm(true); };

  const confirmDeletePost = async () => {
    if (!postToDelete) return;
    setIsDeleting(true);
    try {
      const res = await axios.delete(`${import.meta.env.VITE_API_URL}/post/delete`, {
        data: { postid: postToDelete }, withCredentials: true,
      });
      if (res.data?.flag) {
        handleShowToast("success", "Post deleted successfully!");
        setPosts((prev) => prev.filter((p) => p._id?.toString() !== postToDelete?.toString()));
        setData((prev) => ({ ...prev, postcount: Math.max(0, (prev.postcount || 1) - 1) }));
      } else {
        handleShowToast("error", res.data?.message || "Failed to delete post");
      }
    } catch { handleShowToast("error", "Failed to delete post. Please try again."); }
    finally { setIsDeleting(false); setShowDeleteConfirm(false); setPostToDelete(null); }
  };

  async function handleFollowToggle() {
    if (!data || followLoading || isOwnProfile) return;
    const nextFollowState = !isFollowing;
    setFollowLoading(true); setProfileError("");
    try {
      const response = await axios.post(
        `http://localhost:5000/api/u/${username}/follow`,
        { follow: nextFollowState }, { withCredentials: true },
      );
      const nextStatus        = Boolean(response?.data?.isFollowing);
      const nextFollowersCount = Number(response?.data?.followers);
      setIsFollowing(nextStatus);
      setData((prev) => {
        if (!prev) return prev;
        return { ...prev, followers: Number.isFinite(nextFollowersCount) ? nextFollowersCount : prev.followers || 0 };
      });
    } catch (error) {
      if (error?.response?.status === 401) { navigate("/login"); return; }
      setProfileError("Unable to update follow status. Please try again.");
    } finally { setFollowLoading(false); }
  }

  const handleMessageClick = () => {
    if (!data?._id || !data?.username) return;
    navigate("/messages", { state: { openChatWith: { userId: data._id, username: data.username } } });
  };

  /* ── Loading skeleton ── */
  if (profileLoading) {
    return (
      <>
        <Navbar />
        <div className="page-content py-8 px-4" style={{ background: "var(--bg-base)" }}>
          <div className="max-w-2xl mx-auto space-y-5 animate-pulse">
            <div className="glass-card overflow-hidden">
              <div className="h-24" style={{ background: "rgba(255,255,255,0.04)" }} />
              <div className="p-5">
                <div className="flex items-end justify-between -mt-10 mb-4">
                  <div className="w-20 h-20 rounded-2xl" style={{ background: "rgba(255,255,255,0.08)" }} />
                  <div className="w-28 h-9 rounded-xl" style={{ background: "rgba(255,255,255,0.06)" }} />
                </div>
                <div className="space-y-2">
                  <div className="h-5 w-36 rounded" style={{ background: "rgba(255,255,255,0.06)" }} />
                  <div className="h-3 w-24 rounded" style={{ background: "rgba(255,255,255,0.04)" }} />
                </div>
              </div>
            </div>
            {[1, 2].map((i) => (
              <div key={i} className="glass-card p-5 space-y-3">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }} />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-24 rounded" style={{ background: "rgba(255,255,255,0.06)" }} />
                    <div className="h-2 w-16 rounded" style={{ background: "rgba(255,255,255,0.04)" }} />
                  </div>
                </div>
                <div className="h-16 rounded-lg" style={{ background: "rgba(255,255,255,0.04)" }} />
              </div>
            ))}
          </div>
        </div>
      </>
    );
  }

  /* ── 404 ── */
  if (profileNotFound) {
    return (
      <>
        <Navbar />
        <div className="page-content flex items-center justify-center py-12 px-4" style={{ background: "var(--bg-base)" }}>
          <div className="glass-card p-10 max-w-md w-full text-center">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)" }}
            >
              <UserX className="w-8 h-8 text-red-400" aria-hidden="true" />
            </div>
            <h2 className="text-3xl font-black text-white mb-1" style={{ letterSpacing: "-0.04em" }}>404</h2>
            <p className="text-lg font-semibold text-white mb-2">User Not Found</p>
            <p className="text-sm text-slate-500 mb-7">
              We couldn't find <span className="text-slate-300">@{username}</span>. The account may not exist or was changed.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => navigate("/")}
                className="btn-primary px-6 py-2.5 rounded-xl text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                Go Home
              </button>
              <button
                onClick={() => navigate(-1)}
                className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                Go Back
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  /* ── Error ── */
  if (!data) {
    return (
      <>
        <Navbar />
        <div className="page-content flex items-center justify-center py-12 px-4" style={{ background: "var(--bg-base)" }}>
          <div className="glass-card p-8 max-w-sm w-full text-center">
            <p className="text-sm text-red-400 mb-4">{profileError || "Unable to load this profile right now."}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 rounded-xl text-sm text-slate-300 hover:text-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              Retry
            </button>
          </div>
        </div>
      </>
    );
  }

  /* ── Main ── */
  return (
    <>
      <Navbar />
      {showToast && (
        <Alert type={toastConfig.type} message={toastConfig.message} onClose={() => setShowToast(false)} duration={3000} />
      )}

      {/* Delete Confirm Modal */}
      {showDeleteConfirm && (
        <ModalWrapper showf={setShowDeleteConfirm}>
          <div className="p-6">
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
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeletePost}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-white flex items-center justify-center gap-2 disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                  style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)" }}
                >
                  {isDeleting ? <><Loader2 className="w-4 h-4 animate-spin" />Deleting…</> : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </ModalWrapper>
      )}

      <div className="page-content py-8 px-4" style={{ background: "var(--bg-base)" }}>
        {/* Background accent */}
        <div className="fixed inset-0 -z-10 pointer-events-none">
          <div className="absolute top-0 right-1/3 w-[400px] h-[300px] rounded-full"
            style={{ background: "rgba(168,85,247,0.04)", filter: "blur(80px)" }} />
        </div>

        <div className="max-w-2xl mx-auto space-y-5">

          {/* ── Profile Card ── */}
          <div className="glass-card overflow-hidden">
            {/* Banner */}
            <div
              className="h-24 relative"
              style={{
                background: "linear-gradient(135deg, rgba(168,85,247,0.4) 0%, rgba(99,102,241,0.35) 50%, rgba(6,182,212,0.25) 100%)",
              }}
            >
              <div className="absolute inset-0 opacity-20"
                style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.3) 1px, transparent 1px)", backgroundSize: "16px 16px" }} />
            </div>

            <div className="px-5 pb-5">
              <div className="flex items-end justify-between -mt-10 mb-4">
                {/* Avatar */}
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-xl"
                  style={{
                    background: "linear-gradient(135deg, #a855f7, #6366f1)",
                    border: "3px solid rgba(13,14,28,0.9)",
                    boxShadow: "0 0 0 3px rgba(168,85,247,0.3)",
                  }}
                >
                  {data?.username?.[0]?.toUpperCase() || "U"}
                </div>

                {/* Actions */}
                {!isOwnProfile && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleFollowToggle}
                      disabled={followLoading}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-70 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                        isFollowing ? "text-emerald-300" : "btn-primary"
                      }`}
                      style={isFollowing ? {
                        background: "rgba(16,185,129,0.12)",
                        border: "1px solid rgba(16,185,129,0.3)",
                      } : {}}
                    >
                      {followLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                      ) : isFollowing ? (
                        <UserCheck className="w-4 h-4" aria-hidden="true" />
                      ) : (
                        <UserPlus className="w-4 h-4" aria-hidden="true" />
                      )}
                      {followLoading ? "Updating…" : isFollowing ? "Following" : "Follow"}
                    </button>

                    <button
                      onClick={handleMessageClick}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-slate-300 hover:text-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
                      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                    >
                      <MessageCircle className="w-4 h-4" aria-hidden="true" />
                      Message
                    </button>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="mb-4">
                <h1 className="text-xl font-bold text-white mb-0.5" style={{ letterSpacing: "-0.02em" }}>
                  {data.username}
                </h1>
                <p className="text-slate-400 text-sm">@{data.username}</p>
                {data?.bio && <p className="text-slate-300 text-sm mt-2 leading-relaxed">{data.bio}</p>}
              </div>

              {/* Stats */}
              <div className="flex flex-wrap gap-3">
                {[
                  { label: "Posts",     value: data?.postcount || 0, color: "text-indigo-400" },
                  { label: "Followers", value: data?.followers  || 0, color: "text-pink-400"   },
                  { label: "Following", value: data?.following  || 0, color: "text-emerald-400" },
                ].map(({ label, value, color }) => (
                  <div
                    key={label}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    <Users className={`w-3.5 h-3.5 ${color}`} aria-hidden="true" />
                    <span className="font-bold text-white text-sm" style={{ fontVariantNumeric: "tabular-nums" }}>{value}</span>
                    <span className="text-slate-500 text-xs">{label}</span>
                  </div>
                ))}
              </div>

              {profileError && (
                <p className="text-red-400 text-sm mt-3">{profileError}</p>
              )}
            </div>
          </div>

          {/* ── Posts ── */}
          {data?.postcount < 1 && (
            <div className="glass-card p-10 text-center">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: "rgba(99,102,241,0.1)" }}>
                <Sparkles className="w-7 h-7 text-indigo-400" aria-hidden="true" />
              </div>
              <h3 className="text-white font-semibold mb-1">No Posts Yet</h3>
              <p className="text-slate-500 text-sm">This user hasn't posted anything yet.</p>
            </div>
          )}

          {data?.postcount > 0 && (
            <>
              {/* Posts header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg, #a855f7, #6366f1)" }}>
                    <Grid className="w-4 h-4 text-white" aria-hidden="true" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">Posts</h2>
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

              {/* Post list */}
              <div className="space-y-4">
                {isOwnProfile
                  ? posts.map((post, idx) => (
                      <div key={post._id} className="animate-fade-in" style={{ animationDelay: `${idx * 80}ms` }}>
                        <ProfilePostcard
                          post={post}
                          currentUserId={data?._id}
                          onPostUpdate={handlePostUpdate}
                          onPostDelete={handlePostDelete}
                          onShowToast={handleShowToast}
                          onDeleteRequest={handleDeleteRequest}
                        />
                      </div>
                    ))
                  : posts.map((post, idx) => (
                      <div key={post._id} className="animate-fade-in" style={{ animationDelay: `${idx * 80}ms` }}>
                        <PostCard post={post} IsHoveCard={false} />
                      </div>
                    ))
                }
              </div>

              {/* Infinite scroll */}
              {hasmore && (
                <div ref={loaderRef} className="h-14 flex items-center justify-center" aria-live="polite">
                  {loadingPosts && (
                    <div className="w-8 h-8 rounded-full animate-spin"
                      style={{ border: "2px solid rgba(99,102,241,0.2)", borderTopColor: "#6366f1" }} />
                  )}
                </div>
              )}

              {!hasmore && posts.length > 0 && (
                <div className="glass-card p-5 text-center">
                  <p className="text-slate-500 text-sm">🎉 No more posts to show</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default ProfileOfotheruser;
