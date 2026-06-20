import Navbar from "../components/Navbar.jsx";
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  MessageCircle,
  Heart,
  Share2,
  TrendingUp,
  Users,
  Zap,
  ArrowRight,
  Sparkles,
  Globe,
  MessageSquare,
  Award,
  LogIn,
  UserPlus,
  Star,
  Cpu,
} from "lucide-react";
import PostCard from "../components/Postcard.jsx";
import axios from "axios";

export default function Home({ islogin, toast }) {
  const [isVisible, setIsVisible] = useState(false);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    fetchTrendingPosts();
  }, []);

  async function fetchTrendingPosts() {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/post`, {
        withCredentials: true,
        params: { cursor: undefined },
        headers: { "Content-Type": "application/json" },
      });
      const { dataf: newPosts } = res.data;
      setPosts(newPosts?.slice(0, 3) || []);
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Navbar />
      <div
        className="page-content"
        style={{ background: "var(--bg-base)" }}
      >
        {/* ── Animated background ─────────────────────────────────────── */}
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          <div
            className="absolute -top-60 -left-60 w-[600px] h-[600px] rounded-full animate-blob"
            style={{ background: "rgba(99,102,241,0.07)", filter: "blur(100px)" }}
          />
          <div
            className="absolute top-1/3 -right-60 w-[500px] h-[500px] rounded-full animate-blob animation-delay-2000"
            style={{ background: "rgba(168,85,247,0.06)", filter: "blur(100px)" }}
          />
          <div
            className="absolute -bottom-60 left-1/3 w-[500px] h-[500px] rounded-full animate-blob animation-delay-4000"
            style={{ background: "rgba(6,182,212,0.05)", filter: "blur(100px)" }}
          />
          <div className="absolute inset-0 stars-bg opacity-60" />
        </div>

        {/* ── Hero ────────────────────────────────────────────────────── */}
        <section className="relative pt-12 pb-16 px-4 sm:px-6 lg:px-12">
          <div className="max-w-6xl mx-auto">
            <div
              className={`text-center transition-all duration-1000 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
              }`}
            >
              {/* Badge */}
              <div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 text-sm font-medium text-indigo-300"
                style={{
                  background: "rgba(99,102,241,0.1)",
                  border: "1px solid rgba(99,102,241,0.25)",
                }}
              >
                <Sparkles className="w-4 h-4" aria-hidden="true" />
                The next generation social platform
              </div>

              {/* Headline */}
              <h1
                className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black mb-6 leading-[1.05]"
                style={{ letterSpacing: "-0.04em", textWrap: "balance" }}
              >
                <span className="text-white">Share Ideas,</span>
                <br />
                <span
                  className="animate-gradient"
                  style={{
                    background: "linear-gradient(135deg, #6366f1, #a855f7, #06b6d4, #6366f1)",
                    backgroundClip: "text",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundSize: "300% 300%",
                  }}
                >
                  Spark Conversations
                </span>
              </h1>

              <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
                Join a thriving community of creative minds. Express yourself, connect with
                like-minded people, and discover what's trending around the world.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
                {!islogin ? (
                  <>
                    <Link
                      to="/register"
                      className="btn-primary flex items-center gap-2.5 px-8 py-4 rounded-2xl text-base font-semibold group"
                    >
                      Get Started Free
                      <UserPlus className="w-5 h-5 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                    </Link>
                    <Link
                      to="/login"
                      className="flex items-center gap-2 px-8 py-4 rounded-2xl text-base font-medium text-slate-300 hover:text-white transition-all"
                      style={{
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.1)",
                      }}
                    >
                      <LogIn className="w-5 h-5" aria-hidden="true" />
                      Sign In
                    </Link>
                  </>
                ) : (
                  <Link
                    to="/post"
                    className="btn-primary flex items-center gap-2.5 px-8 py-4 rounded-2xl text-base font-semibold group"
                  >
                    Explore Feed
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                  </Link>
                )}
              </div>

              {/* Feature Pills */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
                {[
                  { icon: MessageCircle, label: "Share Your Story",   delay: "animation-delay-100" },
                  { icon: Heart,         label: "Connect & Engage",   delay: "animation-delay-200" },
                  { icon: TrendingUp,    label: "Trending Topics",    delay: "animation-delay-300" },
                  { icon: Share2,        label: "Spread Ideas",       delay: "animation-delay-400" },
                ].map(({ icon: Icon, label, delay }) => (
                  <div
                    key={label}
                    className={`animate-float glass-card text-center p-5 group cursor-default ${delay}`}
                  >
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center mx-auto mb-3"
                      style={{ background: "rgba(99,102,241,0.15)" }}
                    >
                      <Icon className="w-5 h-5 text-indigo-400" aria-hidden="true" />
                    </div>
                    <p className="text-sm font-medium text-slate-300">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Why BuzzTweet ────────────────────────────────────────────── */}
        <section className="py-20 px-4 sm:px-6 lg:px-12 relative">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-14">
              <h2
                className="text-4xl md:text-5xl font-bold text-white mb-4"
                style={{ letterSpacing: "-0.03em", textWrap: "balance" }}
              >
                Why choose{" "}
                <span className="gradient-text">BuzzTweet</span>?
              </h2>
              <p className="text-slate-400 max-w-xl mx-auto">
                Experience a new way of connecting with people who share your interests.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[
                {
                  icon: Zap,
                  title: "Lightning Fast",
                  desc: "Share thoughts instantly with real-time feeds powered by cutting-edge technology.",
                  color: "#f59e0b",
                  bg: "rgba(245,158,11,0.1)",
                },
                {
                  icon: Users,
                  title: "Global Community",
                  desc: "Connect with users worldwide and build your network across borders and cultures.",
                  color: "#06b6d4",
                  bg: "rgba(6,182,212,0.1)",
                },
                {
                  icon: TrendingUp,
                  title: "Trending Topics",
                  desc: "Discover what's happening and join conversations that matter to you.",
                  color: "#a855f7",
                  bg: "rgba(168,85,247,0.1)",
                },
                {
                  icon: MessageSquare,
                  title: "Rich Interactions",
                  desc: "Engage through comments, likes, and shares. Express yourself with media and links.",
                  color: "#6366f1",
                  bg: "rgba(99,102,241,0.1)",
                },
                {
                  icon: Award,
                  title: "Build Your Brand",
                  desc: "Create a unique profile, share expertise, and grow your following organically.",
                  color: "#ec4899",
                  bg: "rgba(236,72,153,0.1)",
                },
                {
                  icon: Cpu,
                  title: "AI-Powered",
                  desc: "Generate engaging posts with our built-in AI assistant — never stare at a blank editor.",
                  color: "#10b981",
                  bg: "rgba(16,185,129,0.1)",
                },
              ].map(({ icon: Icon, title, desc, color, bg }) => (
                <FeatureCard
                  key={title}
                  icon={<Icon className="w-5 h-5" style={{ color }} aria-hidden="true" />}
                  iconBg={bg}
                  title={title}
                  description={desc}
                />
              ))}
            </div>
          </div>
        </section>

        {/* ── Trending Posts Preview ───────────────────────────────────── */}
        {!loading && posts.length > 0 && (
          <section className="py-20 px-4 sm:px-6 lg:px-12">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-12">
                <h2
                  className="text-3xl md:text-4xl font-bold text-white mb-3"
                  style={{ letterSpacing: "-0.03em" }}
                >
                  What's Trending
                </h2>
                <p className="text-slate-400">See what the community is talking about</p>
              </div>

              <div className="space-y-4">
                {posts.map((post, idx) => (
                  <div
                    key={post._id}
                    className="animate-fade-in"
                    style={{ animationDelay: `${idx * 120}ms` }}
                  >
                    <PostCard post={post} />
                  </div>
                ))}
              </div>

              <div className="text-center mt-8">
                <Link
                  to={islogin ? "/post" : "/register"}
                  className="btn-primary inline-flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-semibold"
                >
                  {islogin ? "View All Posts" : "Join to See More"}
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* ── Stats ───────────────────────────────────────────────────── */}
        <section className="py-20 px-4 sm:px-6 lg:px-12">
          <div className="max-w-5xl mx-auto">
            <div className="grid sm:grid-cols-3 gap-6">
              <StatCard number="10M+" label="Active Users"   gradient="from-indigo-500 to-violet-500" />
              <StatCard number="50M+" label="Posts Daily"   gradient="from-violet-500 to-cyan-500"   />
              <StatCard number="150+" label="Countries"      gradient="from-cyan-500 to-indigo-500"   />
            </div>
          </div>
        </section>

        {/* ── CTA ─────────────────────────────────────────────────────── */}
        {!islogin && (
          <section className="py-20 px-4 sm:px-6 lg:px-12">
            <div className="max-w-3xl mx-auto">
              <div
                className="relative rounded-3xl overflow-hidden p-12 text-center"
                style={{
                  background: "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(168,85,247,0.15), rgba(6,182,212,0.1))",
                  border: "1px solid rgba(99,102,241,0.25)",
                }}
              >
                {/* Glow blobs */}
                <div
                  className="absolute -top-10 -left-10 w-40 h-40 rounded-full"
                  style={{ background: "rgba(99,102,241,0.15)", filter: "blur(40px)" }}
                />
                <div
                  className="absolute -bottom-10 -right-10 w-40 h-40 rounded-full"
                  style={{ background: "rgba(168,85,247,0.15)", filter: "blur(40px)" }}
                />
                <div className="relative">
                  <div
                    className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-6"
                    style={{ background: "linear-gradient(135deg, #6366f1, #a855f7)" }}
                  >
                    <Star className="w-7 h-7 text-white" aria-hidden="true" />
                  </div>
                  <h2
                    className="text-3xl md:text-4xl font-bold text-white mb-4"
                    style={{ letterSpacing: "-0.03em" }}
                  >
                    Ready to Start Buzzing?
                  </h2>
                  <p className="text-slate-400 mb-8 max-w-md mx-auto">
                    Join thousands of users already sharing their thoughts and connecting with others.
                  </p>
                  <Link
                    to="/register"
                    className="btn-primary inline-flex items-center gap-2 px-10 py-4 rounded-2xl text-base font-semibold"
                  >
                    Sign Up for Free
                    <ArrowRight className="w-5 h-5" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── Footer ──────────────────────────────────────────────────── */}
        <footer
          className="py-8 px-4 sm:px-6"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #6366f1, #a855f7)" }}
              >
                <Sparkles className="w-4 h-4 text-white" aria-hidden="true" />
              </div>
              <span className="font-bold text-white">BuzzTweet</span>
            </div>
            <p className="text-slate-600 text-sm">© 2024 BuzzTweet. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </>
  );
}

function FeatureCard({ icon, iconBg, title, description }) {
  return (
    <div className="glass-card p-6 group">
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
        style={{ background: iconBg }}
      >
        {icon}
      </div>
      <h3 className="text-base font-bold text-white mb-2">{title}</h3>
      <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
    </div>
  );
}

function StatCard({ number, label, gradient }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const target = parseInt(number.replace(/\D/g, ""));
    const duration = 2000;
    const steps = 50;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [number]);

  return (
    <div
      className="glass-card p-8 text-center"
    >
      <div
        className={`text-5xl md:text-6xl font-black bg-gradient-to-r ${gradient} bg-clip-text text-transparent mb-2`}
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {count > 0 ? `${count}${number.replace(/\d/g, "")}` : number}
      </div>
      <div className="text-slate-400 font-medium">{label}</div>
    </div>
  );
}
