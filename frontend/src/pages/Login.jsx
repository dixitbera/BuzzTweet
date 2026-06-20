import React, { useState, useEffect } from "react";
import { Eye, EyeOff, Loader2, Sparkles, ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Alert from "../components/Alert.jsx";

export default function Login({ islogin }) {
  const navigate = useNavigate();
  const [showAlert, setShowAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ type: "", message: "" });
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({ username: "", password: "" });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (islogin) navigate("/");
  }, [islogin, navigate]);

  const validateForm = () => {
    const newErrors = { username: "", password: "" };
    let isValid = true;
    if (!username.trim()) {
      newErrors.username = "Username is required";
      isValid = false;
    } else if (username.trim().length < 3) {
      newErrors.username = "Username must be at least 3 characters";
      isValid = false;
    }
    if (!password) {
      newErrors.password = "Password is required";
      isValid = false;
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
      isValid = false;
    }
    setErrors(newErrors);
    return isValid;
  };

  const showToast = (type, message) => {
    setAlertConfig({ type, message });
    setShowAlert(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (data?.flag) {
        showToast("success", "Welcome back! Logging you in…");
        setTimeout(() => navigate("/post"), 800);
      } else {
        showToast("error", data.message || "Invalid credentials. Please try again.");
      }
    } catch {
      showToast("error", "Network error. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {showAlert && (
        <Alert
          type={alertConfig.type}
          message={alertConfig.message}
          onClose={() => setShowAlert(false)}
          duration={3000}
        />
      )}

      <div
        className="min-h-screen flex items-center justify-center px-4 py-8 relative overflow-hidden"
        style={{ background: "var(--bg-base)" }}
      >
        {/* Animated background blobs */}
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          <div
            className="absolute -top-40 -left-40 w-96 h-96 rounded-full animate-blob"
            style={{ background: "rgba(99,102,241,0.12)", filter: "blur(80px)" }}
          />
          <div
            className="absolute top-1/2 -right-40 w-80 h-80 rounded-full animate-blob animation-delay-2000"
            style={{ background: "rgba(168,85,247,0.10)", filter: "blur(80px)" }}
          />
          <div
            className="absolute -bottom-40 left-1/3 w-72 h-72 rounded-full animate-blob animation-delay-4000"
            style={{ background: "rgba(6,182,212,0.08)", filter: "blur(80px)" }}
          />
          {/* Stars */}
          <div className="absolute inset-0 stars-bg opacity-40" />
        </div>

        <div
          className={`w-full max-w-md transition-all duration-700 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
        >
          {/* Brand */}
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2 mb-5 group">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center animate-glow-pulse"
                style={{ background: "linear-gradient(135deg, #6366f1, #a855f7)" }}
              >
                <Sparkles className="w-6 h-6 text-white" aria-hidden="true" />
              </div>
              <span className="text-2xl font-bold gradient-text">BuzzTweet</span>
            </Link>
            <h1 className="text-3xl font-bold text-white mb-2" style={{ letterSpacing: "-0.02em" }}>
              Welcome back
            </h1>
            <p className="text-slate-400">Sign in to continue your journey</p>
          </div>

          {/* Card */}
          <div
            className="rounded-2xl p-7 gradient-border"
            style={{
              background: "rgba(255,255,255,0.04)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
            }}
          >
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              {/* Username */}
              <div>
                <label
                  htmlFor="login-username"
                  className="block text-sm font-semibold text-slate-300 mb-2"
                >
                  Username
                </label>
                <input
                  id="login-username"
                  type="text"
                  name="username"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (errors.username) setErrors({ ...errors, username: "" });
                  }}
                  autoComplete="username"
                  spellCheck={false}
                  placeholder="Your username…"
                  className={`glass-input w-full px-4 py-3.5 rounded-xl text-sm text-white ${
                    errors.username ? "border-red-500/60 !shadow-red-500/10" : ""
                  }`}
                  aria-invalid={!!errors.username}
                  aria-describedby={errors.username ? "username-error" : undefined}
                />
                {errors.username && (
                  <p id="username-error" className="mt-1.5 text-xs text-red-400 flex items-center gap-1" role="alert">
                    {errors.username}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="login-password"
                  className="block text-sm font-semibold text-slate-300 mb-2"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors({ ...errors, password: "" });
                    }}
                    autoComplete="current-password"
                    placeholder="Your password…"
                    className={`glass-input w-full px-4 py-3.5 pr-12 rounded-xl text-sm text-white ${
                      errors.password ? "border-red-500/60" : ""
                    }`}
                    aria-invalid={!!errors.password}
                    aria-describedby={errors.password ? "password-error" : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors p-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                  >
                    {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                  </button>
                </div>
                {errors.password && (
                  <p id="password-error" className="mt-1.5 text-xs text-red-400" role="alert">
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Submit */}
              <button
                id="login-submit"
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent mt-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                    Signing in…
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }} />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 text-slate-500" style={{ background: "rgba(13,14,28,0.97)" }}>or</span>
              </div>
            </div>

            <p className="text-center text-sm text-slate-400">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors focus-visible:outline-none focus-visible:underline"
              >
                Sign up free
              </Link>
            </p>
          </div>

          <p className="text-center mt-5 text-xs text-slate-600">
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </>
  );
}
