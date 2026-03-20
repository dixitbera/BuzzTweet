import React, { useEffect, useRef, useState } from "react";
import Navbar from "../components/Navbar";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import PostCard from "../components/Postcard.jsx";
import {
  ArrowLeft,
  Clock,
  Grid,
  Loader2,
  UserCheck,
  UserPlus,
  Users,
  UserX,
} from "lucide-react";

function ProfileOfotheruser() {
  const navigate = useNavigate();
  const { username } = useParams();

  const [data, setData] = useState(null);
  const [posts, setPosts] = useState([]);
  const [hasmore, setHasmore] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [cursor, setCursor] = useState(undefined);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileNotFound, setProfileNotFound] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [isFollowing, setIsFollowing] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const loaderRef = useRef(null);

  async function fetchPost(nextCursor = undefined, targetUsername = username, ignore = false) {
    if (loadingPosts) return;
    if (nextCursor && !hasmore) return;
    if (profileNotFound) return;

    setLoadingPosts(true);
    try {
      const res = await axios.post(
        "http://localhost:5000/api/u/post",
        { username: targetUsername },
        {
          params: { cursor: nextCursor },
          withCredentials: true,
          headers: { "Content-Type": "application/json" },
        }
      );

      const { dataf: newPosts = [], hasmore: more = false, cursorb } = res.data;
      if (ignore) return;

      if (!nextCursor) {
        setPosts(newPosts);
      } else {
        setPosts((prev) => [...prev, ...newPosts]);
      }

      setHasmore(Boolean(more));
      setCursor(cursorb);
    } catch (error) {
      if (ignore) return;

      const status = error?.response?.status;
      if (status === 401) {
        navigate("/login");
      } else if (status === 404) {
        setProfileNotFound(true);
      } else {
        setHasmore(false);
      }
    } finally {
      if (!ignore) {
        setLoadingPosts(false);
      }
    }
  }

  async function fetchFollowStatus(targetUsername, ignore = false) {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/u/${targetUsername}/follow-status`,
        { withCredentials: true }
      );

      if (ignore) return;
      setIsFollowing(Boolean(response.data?.isFollowing));
      setIsOwnProfile(Boolean(response.data?.isOwnProfile));
    } catch (error) {
      if (ignore) return;
      if (error?.response?.status === 401) {
        navigate("/login");
      }
    }
  }

  useEffect(() => {
    let ignore = false;

    async function loadPage() {
      setProfileLoading(true);
      setProfileNotFound(false);
      setProfileError("");
      setData(null);
      setPosts([]);
      setHasmore(true);
      setCursor(undefined);
      setIsFollowing(false);
      setIsOwnProfile(false);

      try {
        const profileResponse = await axios.get(
          `http://localhost:5000/api/u/${username}`,
          { withCredentials: true }
        );

        if (ignore) return;
        const profileData = profileResponse.data;
        setData(profileData);

        let ownProfile = false;
        try {
          const authRes = await axios.get("http://localhost:5000/check-auth", {
            withCredentials: true,
          });
          if (!ignore && authRes?.data?.id) {
            ownProfile = authRes.data.id.toString() === profileData?._id?.toString();
            setIsOwnProfile(ownProfile);
          }
        } catch {
          if (!ignore) {
            navigate("/login");
            return;
          }
        }

        if (!ownProfile) {
          await fetchFollowStatus(username, ignore);
        }

        await fetchPost(undefined, username, ignore);
      } catch (error) {
        if (ignore) return;

        const status = error?.response?.status;
        if (status === 401) {
          navigate("/login");
          return;
        }
        if (status === 404) {
          setProfileNotFound(true);
          return;
        }
        setProfileError("Unable to load this profile right now.");
      } finally {
        if (!ignore) {
          setProfileLoading(false);
        }
      }
    }

    loadPage();
    return () => {
      ignore = true;
    };
  }, [navigate, username]);

  useEffect(() => {
    if (profileLoading || profileNotFound || !data || !hasmore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingPosts) {
          fetchPost(cursor);
        }
      },
      { threshold: 0.5 }
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
  }, [cursor, data, hasmore, loadingPosts, profileLoading, profileNotFound]);

  async function handleFollowToggle() {
    if (!data || followLoading || isOwnProfile) return;

    const nextFollowState = !isFollowing;
    setFollowLoading(true);
    setProfileError("");

    try {
      const response = await axios.post(
        `http://localhost:5000/api/u/${username}/follow`,
        { follow: nextFollowState },
        { withCredentials: true }
      );

      const nextStatus = Boolean(response?.data?.isFollowing);
      const nextFollowersCount = Number(response?.data?.followers);

      setIsFollowing(nextStatus);
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          followers: Number.isFinite(nextFollowersCount)
            ? nextFollowersCount
            : prev.followers || 0,
        };
      });
    } catch (error) {
      if (error?.response?.status === 401) {
        navigate("/login");
        return;
      }
      setProfileError("Unable to update follow status. Please try again.");
    } finally {
      setFollowLoading(false);
    }
  }

  if (profileLoading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 py-6 sm:py-8 px-3 sm:px-4 md:ml-[260px]">
          <div className="max-w-2xl mx-auto space-y-5 sm:space-y-6 animate-pulse">
            <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-200">
              <div className="flex gap-4 sm:gap-5">
                <div className="w-20 h-20 rounded-2xl bg-gray-100" />
                <div className="flex-1 space-y-3">
                  <div className="h-5 w-40 bg-gray-100 rounded" />
                  <div className="h-3 w-2/3 bg-gray-100 rounded" />
                  <div className="h-3 w-1/2 bg-gray-100 rounded" />
                </div>
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
              <div className="h-4 w-1/3 bg-gray-100 rounded mb-3" />
              <div className="h-24 bg-gray-100 rounded-xl" />
            </div>
          </div>
        </div>
      </>
    );
  }

  if (profileNotFound) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 py-6 sm:py-8 px-3 sm:px-4 md:ml-[260px] flex items-start sm:items-center justify-center">
          <div className="w-full max-w-xl bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-sm text-center">
            <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-500 mx-auto flex items-center justify-center mb-4">
              <UserX className="w-8 h-8" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">404</h2>
            <p className="text-lg font-semibold text-gray-700 mt-1">User Not Found</p>
            <p className="text-sm text-gray-500 mt-2">
              We could not find @{username}. The account may not exist or was changed.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => navigate("/")}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors"
              >
                Go Home
              </button>
              <button
                onClick={() => navigate(-1)}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors inline-flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Go Back
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!data) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 py-6 sm:py-8 px-3 sm:px-4 md:ml-[260px]">
          <div className="max-w-xl mx-auto bg-white rounded-2xl border border-gray-200 shadow-sm p-6 text-center">
            <p className="text-sm text-red-500">
              {profileError || "Unable to load this profile right now."}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50"
            >
              Retry
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 py-6 sm:py-8 px-3 sm:px-4 md:ml-[260px]">
        <div className="max-w-2xl mx-auto space-y-5 sm:space-y-6">
          <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-5">
              <div className="flex justify-center sm:justify-start">
                <div className="w-20 sm:w-24 h-20 sm:h-24 rounded-2xl overflow-hidden border-2 border-gray-100 shadow-md">
                  <img
                    src="http://localhost:5000/uploads/avatar-profile-icon_188544-4755.jpg"
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              <div className="flex-1 text-center sm:text-left">
                <div className="flex flex-col sm:flex-row sm:items-center justify-center sm:justify-start gap-3">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-800">
                    {data.username}
                  </h2>
                  {!isOwnProfile && (
                    <button
                      onClick={handleFollowToggle}
                      disabled={followLoading}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors inline-flex items-center justify-center gap-2 ${
                        isFollowing
                          ? "bg-green-50 text-green-700 border border-green-200 hover:bg-green-100"
                          : "bg-indigo-600 text-white hover:bg-indigo-700"
                      } ${followLoading ? "opacity-70 cursor-not-allowed" : ""}`}
                    >
                      {followLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : isFollowing ? (
                        <UserCheck className="w-4 h-4" />
                      ) : (
                        <UserPlus className="w-4 h-4" />
                      )}
                      {followLoading
                        ? "Updating"
                        : isFollowing
                        ? "Following"
                        : "Follow"}
                    </button>
                  )}
                </div>

                {data?.bio && (
                  <div className="mt-2">
                    <p className="text-xs sm:text-sm text-gray-500">{data.bio}</p>
                  </div>
                )}

                <div className="flex flex-wrap justify-center sm:justify-start gap-3 sm:gap-6 mt-2 sm:mt-3">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <Grid className="w-4 h-4 text-indigo-500" />
                    <span className="font-semibold text-sm sm:text-base">
                      {data?.postcount || 0}
                    </span>
                    <span className="text-gray-500 text-xs sm:text-sm">posts</span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <Users className="w-4 h-4 text-pink-500" />
                    <span className="font-semibold text-sm sm:text-base">
                      {data?.followers || 0}
                    </span>
                    <span className="text-gray-500 text-xs sm:text-sm">followers</span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <UserPlus className="w-4 h-4 text-green-500" />
                    <span className="font-semibold text-sm sm:text-base">
                      {data?.following || 0}
                    </span>
                    <span className="text-gray-500 text-xs sm:text-sm">following</span>
                  </div>
                </div>

                {profileError && (
                  <p className="mt-3 text-xs sm:text-sm text-red-500">{profileError}</p>
                )}
              </div>
            </div>
          </div>

          {data?.postcount < 1 && (
            <div className="bg-gradient-to-r from-gray-50 to-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Grid className="w-6 h-6 text-gray-400" />
              </div>
              <h4 className="text-base sm:text-lg font-semibold text-gray-700 mb-1">
                No Post Found
              </h4>
              <p className="text-xs sm:text-sm text-gray-500">This user has not posted yet.</p>
            </div>
          )}

          {data?.postcount > 0 && (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Grid className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-gray-800">Posts</h3>
                    <p className="text-xs text-gray-500">{data?.postcount || 0} total posts</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 bg-white px-3 py-1.5 rounded-full shadow-sm border border-gray-100 w-fit mx-auto sm:mx-0">
                  <Clock className="w-4 h-4" />
                  <span>Recent first</span>
                </div>
              </div>

              <div className="space-y-4">
                {posts.map((post, index) => (
                  <div
                    key={post._id}
                    className="transform transition-all duration-300 hover:scale-[1.01] hover:shadow-xl"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <PostCard post={post} />
                  </div>
                ))}
              </div>

              {hasmore && (
                <div ref={loaderRef} className="h-16 flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}

              {!hasmore && posts.length > 0 && (
                <div className="bg-gradient-to-r from-gray-50 to-white p-5 sm:p-6 rounded-2xl shadow-sm border border-gray-100 text-center">
                  <div className="w-10 sm:w-12 h-10 sm:h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
                    <Grid className="w-5 sm:w-6 h-5 sm:h-6 text-gray-400" />
                  </div>
                  <h4 className="text-sm sm:text-base font-semibold text-gray-700 mb-1">
                    You are all caught up
                  </h4>
                  <p className="text-xs sm:text-sm text-gray-500">No more posts to show</p>
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