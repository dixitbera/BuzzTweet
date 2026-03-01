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
  ChevronDown,
  Image,
  Smile,
  Calendar,
  Award,
  Globe,
  MessageSquare,
  ThumbsUp,
  BookMarked,
  MoreHorizontal,
  LogIn,
  UserPlus,
} from "lucide-react";
import PostCard from "../components/Postcard.jsx";
import axios from "axios";

export default function Home({ islogin, toast }) {
  const [isVisible, setIsVisible] = useState(false);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    setIsVisible(true);
  }, []);

  useEffect(() => {
    fetchTrendingPosts();
  }, []);

  async function fetchTrendingPosts() {
    try {
      const res = await axios.get("http://localhost:5000/post", {
        withCredentials: true,
        params: { cursor: undefined },
        headers: { "Content-Type": "application/json" },
      });
      const { dataf: newPosts } = res.data;
      setPosts(newPosts?.slice(0, 3) || []);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 overflow-hidden">
        {/* Animated Background - Light Theme */}
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute top-0 -left-40 w-[500px] h-[500px] bg-gray-200 rounded-full mix-blend-multiply filter blur-[120px] opacity-40 animate-blob"></div>
          <div className="absolute top-0 -right-40 w-[500px] h-[500px] bg-gray-200 rounded-full mix-blend-multiply filter blur-[120px] opacity-40 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-40 left-20 w-[500px] h-[500px] bg-gray-200 rounded-full mix-blend-multiply filter blur-[120px] opacity-40 animate-blob animation-delay-4000"></div>
          <div className="absolute bottom-0 right-20 w-[500px] h-[500px] bg-gray-200 rounded-full mix-blend-multiply filter blur-[120px] opacity-30 animate-blob animation-delay-3000"></div>
        </div>

        {/* Hero Section */}
        <section className="relative overflow-hidden pt-16 pb-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20">
            <div
              className={`text-center transition-all duration-1000 transform ${
                isVisible
                  ? "translate-y-0 opacity-100"
                  : "translate-y-10 opacity-0"
              }`}
            >
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white shadow-sm border border-gray-200 mb-8">
                <Sparkles className="w-4 h-4 text-gray-700" />
                <span className="text-sm text-gray-600 font-medium">The future of social networking</span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 tracking-tight">
                Share Ideas,{" "}
                <span className="bg-gradient-to-r from-gray-700 via-gray-800 to-gray-900 bg-clip-text text-transparent">
                  Spark Conversations
                </span>
              </h1>
              <p className="text-lg md:text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
                Join a thriving community of creative minds. Express yourself, connect with like-minded people, and discover what's trending around the world.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
                {!islogin ? (
                  <>
                    <Link
                      to="/register"
                      className="group px-8 py-4 bg-gray-900 text-white rounded-2xl text-lg font-semibold hover:bg-gray-800 transition-all hover:scale-105 shadow-lg shadow-gray-900/20 flex items-center gap-2"
                    >
                      Get Started
                      <UserPlus className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <Link
                      to="/login"
                      className="px-8 py-4 bg-white text-gray-700 rounded-2xl text-lg font-medium border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all hover:scale-105 flex items-center gap-2"
                    >
                      <LogIn className="w-5 h-5" />
                      Log In
                    </Link>
                  </>
                ) : (
                  <Link
                    to="/post"
                    className="group px-8 py-4 bg-gray-900 text-white rounded-2xl text-lg font-semibold hover:bg-gray-800 transition-all hover:scale-105 shadow-lg shadow-gray-900/20 flex items-center gap-2"
                  >
                    Start Posting
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                )}
              </div>
            </div>

            {/* Floating Cards Animation */}
            <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 max-w-5xl mx-auto">
              <FloatingCard delay={0}>
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-3">
                  <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
                </div>
                <p className="text-sm text-gray-600 font-medium">Share Your Story</p>
              </FloatingCard>

              <FloatingCard delay={200}>
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-3">
                  <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
                </div>
                <p className="text-sm text-gray-600 font-medium">Connect & Engage</p>
              </FloatingCard>

              <FloatingCard delay={400}>
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-3">
                  <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
                </div>
                <p className="text-sm text-gray-600 font-medium">Trending Topics</p>
              </FloatingCard>

              <FloatingCard delay={600}>
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-3">
                  <Share2 className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
                </div>
                <p className="text-sm text-gray-600 font-medium">Spread Ideas</p>
              </FloatingCard>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 sm:py-24 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                Why Choose{" "}
                <span className="bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent">
                  BuzzTweet
                </span>
                ?
              </h2>
              <p className="text-gray-500 max-w-2xl mx-auto">
                Experience a new way of connecting with people who share your interests and passions.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              <FeatureCard
                icon={<Zap className="w-6 h-6" />}
                gradient="from-gray-100 to-gray-200"
                iconColor="text-gray-700"
                title="Lightning Fast"
                description="Share your thoughts instantly and stay updated with real-time feeds powered by cutting-edge technology."
              />

              <FeatureCard
                icon={<Users className="w-6 h-6" />}
                gradient="from-gray-100 to-gray-200"
                iconColor="text-gray-700"
                title="Global Community"
                description="Connect with millions of users worldwide and build your network across borders and cultures."
              />

              <FeatureCard
                icon={<TrendingUp className="w-6 h-6" />}
                gradient="from-gray-100 to-gray-200"
                iconColor="text-gray-700"
                title="Trending Topics"
                description="Discover what's happening and join conversations that matter in your interests."
              />

              <FeatureCard
                icon={<MessageSquare className="w-6 h-6" />}
                gradient="from-gray-100 to-gray-200"
                iconColor="text-gray-700"
                title="Rich Interactions"
                description="Engage with posts through comments, likes, and shares. Express yourself with media and links."
              />

              <FeatureCard
                icon={<Award className="w-6 h-6" />}
                gradient="from-gray-100 to-gray-200"
                iconColor="text-gray-700"
                title="Build Your Brand"
                description="Create a unique profile, share your expertise, and grow your following organically."
              />

              <FeatureCard
                icon={<Globe className="w-6 h-6" />}
                gradient="from-gray-100 to-gray-200"
                iconColor="text-gray-700"
                title="Stay Informed"
                description="Follow topics you care about and never miss what's happening in your world."
              />
            </div>
          </div>
        </section>

        {/* Trending Posts Preview */}
        {!loading && posts.length > 0 && (
          <section className="py-20 sm:py-24 relative">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  What's Trending
                </h2>
                <p className="text-gray-500">
                  See what the community is talking about right now
                </p>
              </div>

              <div className="space-y-4">
                {posts.map((post, index) => (
                  <div
                    key={post._id}
                    className="transform transition-all duration-300 hover:scale-[1.01]"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <PostCard post={post} />
                  </div>
                ))}
              </div>

              <div className="text-center mt-8">
                <Link
                  to={islogin ? "/post" : "/register"}
                  className="inline-flex items-center gap-2 px-8 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-all"
                >
                  {islogin ? "View All Posts" : "Join to See More"}
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Stats Section */}
        <section className="py-20 sm:py-24 relative bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid sm:grid-cols-3 gap-6 sm:gap-8 text-center">
              <StatCard
                number="10M+"
                label="Active Users"
                gradient="from-gray-600 to-gray-800"
              />
              <StatCard
                number="50M+"
                label="Posts Daily"
                gradient="from-gray-600 to-gray-800"
              />
              <StatCard
                number="150+"
                label="Countries"
                gradient="from-gray-600 to-gray-800"
              />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 sm:py-24 relative">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl">
              {/* Clean white background */}
              <div className="absolute inset-0 bg-white"></div>

              {/* Subtle pattern overlay */}
              <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-30"></div>

              {/* Decorative elements */}
              <div className="absolute top-0 -left-20 w-40 h-40 bg-gray-100 rounded-full filter blur-3xl"></div>
              <div className="absolute bottom-0 right-20 w-40 h-40 bg-gray-100 rounded-full filter blur-3xl"></div>

              <div className="relative px-8 py-16 md:py-20 text-center">
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                  Ready to Start Buzzing?
                </h2>
                <p className="text-lg text-gray-500 mb-8 max-w-xl mx-auto">
                  Join thousands of users already sharing their thoughts and connecting with others.
                </p>
                {!islogin ? (
                  <Link
                    to="/register"
                    className="inline-flex items-center gap-2 px-10 py-4 bg-gray-900 text-white rounded-2xl text-lg font-semibold hover:bg-gray-800 transition-all hover:scale-105 shadow-xl"
                  >
                    Sign Up Now
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                ) : (
                  <Link
                    to="/post"
                    className="inline-flex items-center gap-2 px-10 py-4 bg-gray-900 text-white rounded-2xl text-lg font-semibold hover:bg-gray-800 transition-all hover:scale-105 shadow-xl"
                  >
                    Explore Feed
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-10 bg-white border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <span className="text-lg font-bold text-gray-900">BuzzTweet</span>
              </div>
              <div className="text-gray-500 text-sm text-center sm:text-right">
                <p>© 2024 BuzzTweet. All rights reserved.</p>
              </div>
            </div>
          </div>
        </footer>
      </div>

      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 10s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .animation-delay-3000 {
          animation-delay: 3s;
        }
      `}</style>
    </>
  );
}

function FloatingCard({ children, delay }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={`transition-all duration-1000 transform ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
      }`}
      style={{ animation: "float 4s ease-in-out infinite" }}
    >
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300 transition-all hover:scale-105 text-center group">
        {children}
      </div>
    </div>
  );
}

function FeatureCard({ icon, gradient, iconColor, title, description }) {
  return (
    <div className="group relative p-6 sm:p-8 rounded-3xl bg-white border border-gray-200 shadow-sm hover:shadow-lg hover:border-gray-300 transition-all duration-300 hover:-translate-y-1 overflow-hidden">
      {/* Subtle gradient on hover */}
      <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500 from-gray-50 to-white"></div>

      <div className="relative">
        <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-5`}>
          <div className={iconColor}>{icon}</div>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
        <p className="text-gray-500 leading-relaxed text-sm sm:text-base">{description}</p>
      </div>
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
    <div className="relative p-6 sm:p-8 rounded-3xl bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
      <div className={`text-4xl sm:text-5xl md:text-6xl font-bold bg-gradient-to-r ${gradient} bg-clip-text text-transparent mb-2`}>
        {count > 0 ? `${count}${number.replace(/\d/g, "")}` : number}
      </div>
      <div className="text-lg sm:text-xl text-gray-500 font-medium">{label}</div>
    </div>
  );
}
