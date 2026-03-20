import React, { useEffect, useState, useRef } from "react";
import Navbar from "../components/Navbar";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { EditOutlined } from "@ant-design/icons";
import { Grid, Clock, Users, UserPlus, Trash2, Loader2 } from "lucide-react";
import Profilesetting from "../components/Profilesetting.jsx";
import ProfilePostcard from "../components/ProfilePostcard.jsx";
import Alert from "../components/Alert.jsx";
import ModalWrapper from "../components/ModalWrapper.jsx";

function Profile({ toast }) {
  const navigate = useNavigate();
  const [data, setdata] = useState([]);
  const [show, setshow] = useState(false);
  const loaderRef = useRef(null);
  const [hasmore, sethasmore] = useState(true);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cursor, setCursor] = useState(undefined);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastConfig, setToastConfig] = useState({ type: "", message: "" });
  
  // Delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    getdetails();
    fetchPost(undefined);
  }, []);

  async function getdetails() {
    try {
      const req = await axios.get("http://localhost:5000/profile", {
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      });
      setdata(req.data);
      setCurrentUserId(req.data._id);
    } catch (error) {
      navigate("/login");
    }
  }

  async function fetchPost(cursor) {
    if (!hasmore || loading) return;
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:5000/user/post/", {
        params: { cursor },
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      });
      const { dataf: newPosts, hasmore: more, cursorb } = res.data;
      if (!cursor) {
        setPosts(newPosts);
      } else {
        setPosts((prev) => [...prev, ...newPosts]);
      }
      sethasmore(more);
      setCursor(cursorb);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }

  // Handle post update from ProfilePostcard
  const handlePostUpdate = (updatedPost) => {
    setPosts((prev) =>
      prev.map((post) => (post._id === updatedPost._id ? updatedPost : post))
    );
  };

  // Handle post deletion from ProfilePostcard
  const handlePostDelete = (postId) => {
    setPosts((prev) => prev.filter((post) => post._id !== postId));
    // Update post count in UI
    setdata((prev) => ({ ...prev, postcount: Math.max(0, (prev.postcount || 1) - 1) }));
  };

  const handleShowToast = (type, message) => {
    if (toast) {
      toast[type](message);
    } else {
      setToastConfig({ type, message });
      setShowToast(true);
    }
  };

  // Handle delete confirmation from ProfilePostcard
  const handleDeleteRequest = (postId) => {
    setPostToDelete(postId);
    setShowDeleteConfirm(true);
  };

  // Execute delete post
  const confirmDeletePost = async () => {
    if (!postToDelete) return;
    setIsDeleting(true);
    try {
      const res = await axios.delete("http://localhost:5000/post/delete", {
        data: { postid: postToDelete },
        withCredentials: true,
      });
      if (res.data?.flag) {
        handleShowToast("success", "Post deleted successfully!");
        // Remove post from UI immediately
        setPosts((prev) => {
          const newPosts = prev.filter((post) => {
            const postId = post._id?.toString() || post._id;
            const deleteId = postToDelete?.toString() || postToDelete;
            return postId !== deleteId;
          });
          return newPosts;
        });
        setdata((prev) => ({ ...prev, postcount: Math.max(0, (prev.postcount || 1) - 1) }));
      } else {
        handleShowToast("error", res.data?.message || "Failed to delete post");
      }
    } catch (error) {
      handleShowToast("error", "Failed to delete post. Please try again.");
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      setPostToDelete(null);
    }
  };

  useEffect(() => {
    if (!hasmore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading) {
          fetchPost(cursor);
        }
      },
      { threshold: 0.5 }
    );
    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }
    return () => observer.disconnect();
  }, [hasmore, loading, cursor]);

  const handleUpdate = (newValue) => {
    getdetails();
    setshow(newValue);
  };

  return (
    <>
      <Navbar />
      {show && <Profilesetting showf={handleUpdate} dataf={data} />}

      {showToast && (
        <Alert
          type={toastConfig.type}
          message={toastConfig.message}
          onClose={() => setShowToast(false)}
          duration={3000}
        />
      )}

      {/* Delete Confirmation Modal - Centered from full page */}
      {showDeleteConfirm && (
        <ModalWrapper showf={setShowDeleteConfirm}>
          <div className="p-6 max-w-sm mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Post?</h3>
              <p className="text-gray-500 mb-6">
                This action cannot be undone. Your post will be permanently deleted.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setPostToDelete(null);
                  }}
                  className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeletePost}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    "Delete"
                  )}
                </button>
              </div>
            </div>
          </div>
        </ModalWrapper>
      )}

      <div className="min-h-screen bg-gray-50 py-6 sm:py-8 px-3 sm:px-4 md:ml-[260px]">
        <div className="max-w-2xl mx-auto space-y-5 sm:space-y-6">
          {/* Profile Card */}
          <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-200">
            {/* Desktop & Tablet: horizontal layout | Mobile: vertical stacked */}
            <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-5">
              {/* Profile Image - smaller on mobile */}
              <div className="flex justify-center sm:justify-start">
                <div className="w-20 sm:w-24 h-20 sm:h-24 rounded-2xl overflow-hidden border-2 border-gray-100 shadow-md">
                  <img
                    src="http://localhost:5000/uploads/avatar-profile-icon_188544-4755.jpg"
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Info Section */}
              <div className="flex-1 text-center sm:text-left">
                {/* Username Row */}
                <div className="flex items-center justify-center sm:justify-start gap-3">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-800">
                    {data.username}
                  </h2>
                  <button
                    onClick={handleUpdate}
                    className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    <img
                      src="./public/Setting.gif"
                      alt="Settings"
                      className="w-5 h-5 sm:w-6 sm:h-6"
                    />
                  </button>
                </div>
                {data?.bio && (
                  <div className="mt-2">
                    <p className="text-xs sm:text-sm text-gray-500">
                      {data.bio}
                    </p>
                  </div>
                )}
                {/* Stats Row - wraps on mobile */}
                <div className="flex flex-wrap justify-center sm:justify-start gap-3 sm:gap-6 mt-2 sm:mt-3">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <Grid className="w-4 h-4 text-indigo-500" />
                    <span className="font-semibold text-sm sm:text-base">
                      {data?.postcount || 0}
                    </span>
                    <span className="text-gray-500 text-xs sm:text-sm">
                      posts
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <Users className="w-4 h-4 text-pink-500" />
                    <span className="font-semibold text-sm sm:text-base">
                      {data?.followers || 0}
                    </span>
                    <span className="text-gray-500 text-xs sm:text-sm">
                      followers
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <UserPlus className="w-4 h-4 text-green-500" />
                    <span className="font-semibold text-sm sm:text-base">
                      {data?.following || 0}
                    </span>
                    <span className="text-gray-500 text-xs sm:text-sm">
                      following
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Posts Section */}
          {data?.postcount < 1 && (
            <div className="bg-gradient-to-r from-gray-50 to-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Grid className="w-6 h-6 text-gray-400" />
              </div>
              <h4 className="text-base sm:text-lg font-semibold text-gray-700 mb-1">No Post Yet</h4>
              <p className="text-xs sm:text-sm text-gray-500">You haven't created any posts. Start sharing your thoughts!</p>
            </div>
          )}
          {data?.postcount > 0 && (
            <>
              {/* Modern Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Grid className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-gray-800">
                      Your Posts
                    </h3>
                    <p className="text-xs text-gray-500">
                      {data?.postcount || 0} total posts
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 bg-white px-3 py-1.5 rounded-full shadow-sm border border-gray-100 w-fit mx-auto sm:mx-0">
                  <Clock className="w-4 h-4" />
                  <span>Recent first</span>
                </div>
              </div>

              {/* Posts */}
              <div className="space-y-4">
                {posts.map((post, index) => (
                  <div
                    key={post._id}
                    className="transform transition-all duration-300 hover:scale-[1.01] hover:shadow-xl"
                    style={{ animationDelay: `${index * 100}ms` }}
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

              {/* Loading Spinner */}
              {hasmore && (
                <div
                  ref={loaderRef}
                  className="h-16 flex items-center justify-center"
                >
                  <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}

              {/* No More Posts */}
              {!hasmore && posts.length > 0 && (
                <div className="bg-gradient-to-r from-gray-50 to-white p-5 sm:p-6 rounded-2xl shadow-sm border border-gray-100 text-center">
                  <div className="w-10 sm:w-12 h-10 sm:h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
                    <Grid className="w-5 sm:w-6 h-5 sm:h-6 text-gray-400" />
                  </div>
                  <h4 className="text-sm sm:text-base font-semibold text-gray-700 mb-1">
                    You're all caught up! 🎉
                  </h4>
                  <p className="text-xs sm:text-sm text-gray-500">
                    No more posts to show
                  </p>
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
