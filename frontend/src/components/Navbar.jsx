import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home,
  LogIn,
  LogOut,
  UserPlus,
  User,
  Plus,
  Hash,
  Bell,
  Mail,
  X,
  Sparkles,
  Menu,
  MessageSquare,
} from "lucide-react";
import axios from "axios";

export default function Sidebar({ islogin }) {
  const [log, setlog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const [data, setData] = useState({});

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_API_URL}/check-auth`, { withCredentials: true })
      .then((res) => {
        setLoading(false);
        if (res.data.isLoggedIn) {
          setData(res.data);
          setlog(true);
        } else {
          setlog(false);
        }
      })
      .catch(() => setLoading(false));
  }, []);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { name: "Home",      href: "/",        icon: Home,         public: true },
    { name: "Explore",   href: "/post",     icon: Hash,         public: true },
    { name: "Notifications", href: "#",    icon: Bell,         public: true, coming: true },
    { name: "Messages",  href: "/messages", icon: Mail,         authOnly: true },
    { name: "Profile",   href: "/profile",  icon: User,         authOnly: true },
  ];

  const authLinks = [
    { name: "Log In",  href: "/login",    icon: LogIn,    guestOnly: true },
    { name: "Sign Up", href: "/register", icon: UserPlus, guestOnly: true, primary: true },
  ];

  const visibleLinks = navLinks.filter((l) => {
    if (l.public) return true;
    if (l.authOnly && log) return true;
    return false;
  });

  const visibleAuthLinks = authLinks.filter((l) => l.guestOnly && !log);

  const isActive = (href) => {
    if (href === "/") return location.pathname === "/";
    return location.pathname.startsWith(href);
  };

  const handleLogout = async () => {
    await fetch(`${import.meta.env.VITE_API_URL}/logout`, {
      method: "POST",
      credentials: "include",
    });
    window.location.href = "/login";
  };

  /* ── Mobile bottom nav items ─────────────────────────────────────────── */
  const mobileNavLinks = [
    { name: "Home",    href: "/",        icon: Home },
    { name: "Explore", href: "/post",    icon: Hash },
    ...(log
      ? [
          { name: "Messages", href: "/messages", icon: Mail },
          { name: "Profile",  href: "/profile",  icon: User },
        ]
      : [
          { name: "Log In",  href: "/login",    icon: LogIn },
          { name: "Sign Up", href: "/register", icon: UserPlus },
        ]),
  ];

  /* ── Desktop Sidebar ─────────────────────────────────────────────────── */
  const DesktopSidebar = () => (
    <aside
      className="hidden md:flex fixed top-0 left-0 h-full flex-col z-50"
      style={{
        width: "var(--sidebar-w)",
        background: "rgba(13,14,28,0.97)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderRight: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Logo */}
      <Link
        to="/"
        className="flex items-center gap-3 px-5 py-5 group"
        aria-label="BuzzTweet home"
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 animate-glow-pulse"
          style={{
            background: "linear-gradient(135deg, #6366f1, #a855f7, #06b6d4)",
          }}
        >
          <Sparkles className="w-5 h-5 text-white" aria-hidden="true" />
        </div>
        <span
          className="text-lg font-bold gradient-text"
          style={{ letterSpacing: "-0.02em" }}
        >
          BuzzTweet
        </span>
      </Link>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-2 space-y-1" aria-label="Main navigation">
        {visibleLinks.map((link) => {
          const Icon = link.icon;
          const active = isActive(link.href);
          return (
            <Link
              key={link.name}
              to={link.href}
              onClick={(e) => {
                if (link.coming) {
                  e.preventDefault();
                  alert("Coming soon!");
                }
              }}
              aria-current={active ? "page" : undefined}
              className={`
                flex items-center gap-3.5 px-3.5 py-3 rounded-xl
                font-medium text-[15px] transition-all duration-200
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500
                ${active
                  ? "text-white"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
                }
              `}
              style={
                active
                  ? {
                      background:
                        "linear-gradient(135deg, rgba(99,102,241,0.25), rgba(168,85,247,0.15))",
                      border: "1px solid rgba(99,102,241,0.3)",
                    }
                  : {}
              }
            >
              <Icon
                className={`w-5 h-5 flex-shrink-0 ${active ? "text-indigo-400" : ""}`}
                aria-hidden="true"
              />
              <span>{link.name}</span>
              {link.coming && (
                <span
                  className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{
                    background: "rgba(99,102,241,0.2)",
                    color: "#818cf8",
                    border: "1px solid rgba(99,102,241,0.3)",
                  }}
                >
                  Soon
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Create Post CTA */}
      {log && (
        <div className="px-3 py-2">
          <Link
            to="/post"
            className="btn-primary flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm"
            style={{ borderRadius: "12px" }}
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            Create Post
          </Link>
        </div>
      )}

      {/* Auth / Logout section */}
      <div className="px-3 pb-4 space-y-2">
        {!loading && (
          <>
            {visibleAuthLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.name}
                  to={link.href}
                  className={`
                    flex items-center gap-3 px-3.5 py-2.5 rounded-xl
                    text-sm font-medium transition-all duration-200
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500
                    ${link.primary
                      ? "btn-primary"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                    }
                  `}
                >
                  <Icon className="w-4 h-4" aria-hidden="true" />
                  {link.name}
                </Link>
              );
            })}

            {log && (
              <div
                className="p-3 rounded-xl"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                    style={{
                      background: "linear-gradient(135deg, #6366f1, #a855f7)",
                    }}
                  >
                    {data?.username?.[0]?.toUpperCase() || "U"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm truncate">
                      {data?.username || "User"}
                    </p>
                    <p className="text-slate-500 text-xs truncate">
                      @{data?.username || "user"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                >
                  <LogOut className="w-4 h-4" aria-hidden="true" />
                  Sign out
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </aside>
  );

  /* ── Mobile Bottom Nav ───────────────────────────────────────────────── */
  const MobileBottomNav = () => (
    <nav
      aria-label="Mobile navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around px-2"
      style={{
        height: "var(--mobile-nav-h)",
        background: "rgba(13,14,28,0.97)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderTop: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {mobileNavLinks.map((link) => {
        const Icon = link.icon;
        const active = isActive(link.href);
        return (
          <Link
            key={link.name}
            to={link.href}
            aria-label={link.name}
            aria-current={active ? "page" : undefined}
            className={`
              flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-xl
              transition-all duration-200 min-w-[44px] min-h-[44px]
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500
              ${active ? "text-white" : "text-slate-500"}
            `}
          >
            <div
              className="w-8 h-8 flex items-center justify-center rounded-xl transition-all"
              style={
                active
                  ? {
                      background:
                        "linear-gradient(135deg, rgba(99,102,241,0.3), rgba(168,85,247,0.2))",
                    }
                  : {}
              }
            >
              <Icon
                className={`w-5 h-5 ${active ? "text-indigo-400" : "text-slate-500"}`}
                aria-hidden="true"
              />
            </div>
            <span className={`text-[10px] font-medium ${active ? "text-indigo-400" : "text-slate-600"}`}>
              {link.name}
            </span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      <DesktopSidebar />
      <MobileBottomNav />
      {/* Desktop spacer */}
      <div className="hidden md:block flex-shrink-0" style={{ width: "var(--sidebar-w)" }} />
    </>
  );
}
