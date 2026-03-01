import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Menu,
  X,
  Home,
  LogIn,
  LogOut,
  UserPlus,
  Info,
  FileText,
  User,
  Plus,
  Hash,
  Bell,
  Mail,
  MoreHorizontal,
} from "lucide-react";
import axios from "axios";
export default function Sidebar({ islogin }) {
  const [log, setlog] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();
  const  [data, setData] = useState({});
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const data=axios.get("http://localhost:5000/check-auth", {
      withCredentials: true,
    }).then((res) => {
      setLoading(false);
      if (res.data.isLoggedIn) {
        setData(res.data);
        setlog(true);
      } else {
        setlog(false);
      }
    });
  }, []);

  const navLinks = [
    { name: "Home", href: "/", icon: Home, public: true },
    { name: "Explore", href: "/post", icon: Hash, public: true },
    { name: "Notifications", href: "#", icon: Bell, public: true, coming: true },
    { name: "Messages", href: "/messages", icon: Mail, authOnly: true },
    { name: "Profile", href: "/profile", icon: User, authOnly: true },
    { name: "Create Post", href: "/add", icon: Plus, authOnly: true },
  ];

  const authLinks = [
    {
      name: "Login",
      href: "/login",
      icon: LogIn,
      guestOnly: true,
    },
    {
      name: "Sign Up",
      href: "/register",
      icon: UserPlus,
      guestOnly: true,
      primary: true,
    },
  ];

  const visibleLinks = navLinks.filter((link) => {
    if (link.public) return true;
    if (link.authOnly && log) return true;
    return false;
  });

  const visibleAuthLinks = authLinks.filter((link) => {
    if (link.guestOnly && !log) return true;
    return false;
  });

  const isActive = (href) => {
    if (href === "/" || href === "/post") {
      if (href === "/") return location.pathname === "/";
      return location.pathname.startsWith(href);
    }
    return location.pathname.startsWith(href);
  };

  const handleLogout = async () => {
    await fetch("http://localhost:5000/logout", {
      method: "POST",
      credentials: "include",
    });
    window.location.href = "/login";
  };

  useEffect(() => {
    if (isMobile) {
      setIsOpen(false);
    }
  }, [location.pathname, isMobile]);

  return (
    <>
      {/* Mobile Toggle */}
      {isMobile && !isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed top-3 left-3 z-50 p-2.5 bg-white rounded-xl shadow-lg hover:bg-gray-50 transition-all border border-gray-100"
        >
          <Menu className="w-6 h-6 text-gray-700" />
        </button>
      )}

      {/* Mobile Overlay */}
      {isMobile && isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar - White theme matching app */}
      <aside
        className={`fixed top-0 left-0 h-full z-50 transition-all duration-300 ease-out
          ${
            isMobile
              ? isOpen
                ? "translate-x-0"
                : "-translate-x-full"
              : "translate-x-0"
          }
          w-[80px] md:w-[260px] bg-white border-r border-gray-200 shadow-sm`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center h-16 px-4">
            <Link
              to="/"
              className="flex items-center gap-3 group"
              onClick={() => setIsOpen(false)}
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-transform">
                <span className="text-white font-bold text-xl">B</span>
              </div>
              <span className="hidden md:block text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                BuzzTweet
              </span>
            </Link>
            {isMobile && (
              <button
                onClick={() => setIsOpen(false)}
                className="ml-auto p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            )}
          </div>

          <nav className="flex-1 px-2 md:px-3 py-2">
            <div className="space-y-1">
              {/* Navigation */}
              {visibleLinks.map((link) => {
                const Icon = link.icon;
                const active = isActive(link.href);
                const isComingSoon = link.coming;

                return (
                  <Link
                    key={link.name}
                    to={link.href}
                    onClick={(e) => {
                      if (isComingSoon) {
                        e.preventDefault();
                        alert("Coming soon!");
                        return;
                      }
                      if (isMobile) setIsOpen(false);
                    }}
                    className={`flex items-center gap-4 px-3 py-3 rounded-xl transition-all cursor-pointer
                      ${
                        active
                          ? "bg-indigo-50 text-indigo-600"
                          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                      }`}
                  >
                    <Icon
                      className={`w-6 h-6 ${active ? "text-indigo-600" : "text-gray-500"}`}
                    />
                    <span
                      className={`hidden md:block text-base ${active ? "font-semibold" : "font-medium"}`}
                    >
                      {link.name}
                    </span>
                    {isComingSoon && (
                      <span className="hidden md:block text-[10px] font-medium text-indigo-500 bg-indigo-100 px-2 py-0.5 rounded-full">
                        Soon
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Post Button */}
          {/* <div className="px-3 py-2">
            <button
              className="w-full md:w-11/12 py-3 md:py-3.5 rounded-full font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-purple-500/25 transition-all transform hover:-translate-y-0.5"
              onClick={() => {
                if (log) {
                  window.location.href = "/add";
                  if (isMobile) setIsOpen(false);
                } else {
                  window.location.href = "/register";
                }
              }}
            >
              <span className="hidden md:block">
                {log ? "Post" : "Get Started"}
              </span>
              <Plus className="md:hidden w-6 h-6" />
            </button>
          </div> */}

          {/* Auth / Logout Section */}
          <div className="px-3 py-3 mb-2">
            {!loading && (
              <div className="space-y-2">
                {visibleAuthLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.name}
                      to={link.href}
                      onClick={() => isMobile && setIsOpen(false)}
                      className={`flex items-center gap-4 px-3 py-3 rounded-xl transition-all
                        ${
                          link.primary
                            ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold hover:from-indigo-700 hover:to-purple-700 shadow-md"
                            : "text-gray-700 font-medium hover:bg-gray-100"
                        }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="hidden md:block">{link.name}</span>
                    </Link>
                  );
                })}

                {log && (
                  <div className="hidden md:block p-3 border-t border-gray-100">
                    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-sm">
                        U
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-900 font-semibold text-sm truncate">
                          {data?.username || "User"}
                        </p>
                        <p className="text-gray-500 text-xs truncate">
                          @{data?.username || "user"}
                        </p>
                      </div>
                      <MoreHorizontal className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User Profile - Bottom */}
          <div className="px-3 py-3 mt-auto">
            {log && (
              <button
                onClick={handleLogout}
                className="flex items-center gap-4 px-3 py-3 w-full rounded-xl text-red-600 hover:bg-red-50 font-medium transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="hidden md:block">Logout</span>
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Desktop Spacer */}
      <div className="hidden md:block w-[260px] flex-shrink-0" />
    </>
  );
}
