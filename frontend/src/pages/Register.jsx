import React, { useState, useEffect } from "react";
import { Eye, EyeOff, Loader2, Sparkles, ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Alert from "../components/Alert.jsx";

function Register({ islogin }) {
  const navigate = useNavigate();
  const [showAlert, setShowAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ type: "", message: "" });
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({ username: "", email: "", password: "" });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (islogin) navigate("/");
  }, [islogin, navigate]);

  const validateForm = () => {
    const newErrors = { username: "", email: "", password: "" };
    let isValid = true;
    if (!username.trim()) {
      newErrors.username = "Username is required";
      isValid = false;
    } else if (username.trim().length < 3) {
      newErrors.username = "Username must be at least 3 characters";
      isValid = false;
    }
    if (!email.trim()) {
      newErrors.email = "Email is required";
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address";
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
      const res = await fetch(`${import.meta.env.VITE_API_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });
      const data = await res.json();
      if (data?.flag) {
        showToast("success", "Account created! Redirecting to login…");
        setTimeout(() => navigate("/login"), 1500);
      } else {
        showToast("error", data?.message || "Registration failed. Please try again.");
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
        {/* Animated blobs */}
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          <div
            className="absolute -top-40 -right-40 w-96 h-96 rounded-full animate-blob"
            style={{ background: "rgba(168,85,247,0.12)", filter: "blur(80px)" }}
          />
          <div
            className="absolute bottom-0 -left-40 w-80 h-80 rounded-full animate-blob animation-delay-2000"
            style={{ background: "rgba(99,102,241,0.10)", filter: "blur(80px)" }}
          />
          <div
            className="absolute top-1/2 right-1/3 w-64 h-64 rounded-full animate-blob animation-delay-4000"
            style={{ background: "rgba(6,182,212,0.08)", filter: "blur(60px)" }}
          />
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
                style={{ background: "linear-gradient(135deg, #a855f7, #6366f1)" }}
              >
                <Sparkles className="w-6 h-6 text-white" aria-hidden="true" />
              </div>
              <span className="text-2xl font-bold gradient-text">BuzzTweet</span>
            </Link>
            <h1 className="text-3xl font-bold text-white mb-2" style={{ letterSpacing: "-0.02em" }}>
              Join BuzzTweet
            </h1>
            <p className="text-slate-400">Create your account and start buzzing</p>
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
                <label htmlFor="reg-username" className="block text-sm font-semibold text-slate-300 mb-2">
                  Username
                </label>
                <input
                  id="reg-username"
                  type="text"
                  name="username"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (errors.username) setErrors({ ...errors, username: "" });
                  }}
                  autoComplete="username"
                  spellCheck={false}
                  placeholder="Choose a username…"
                  className={`glass-input w-full px-4 py-3.5 rounded-xl text-sm text-white ${
                    errors.username ? "border-red-500/60" : ""
                  }`}
                  aria-invalid={!!errors.username}
                  aria-describedby={errors.username ? "reg-username-error" : undefined}
                />
                {errors.username && (
                  <p id="reg-username-error" className="mt-1.5 text-xs text-red-400" role="alert">
                    {errors.username}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="reg-email" className="block text-sm font-semibold text-slate-300 mb-2">
                  Email
                </label>
                <input
                  id="reg-email"
                  type="email"
                  name="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors({ ...errors, email: "" });
                  }}
                  autoComplete="email"
                  spellCheck={false}
                  placeholder="your@email.com"
                  className={`glass-input w-full px-4 py-3.5 rounded-xl text-sm text-white ${
                    errors.email ? "border-red-500/60" : ""
                  }`}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "reg-email-error" : undefined}
                />
                {errors.email && (
                  <p id="reg-email-error" className="mt-1.5 text-xs text-red-400" role="alert">
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="reg-password" className="block text-sm font-semibold text-slate-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="reg-password"
                    type={showPassword ? "text" : "password"}
                    name="new-password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors({ ...errors, password: "" });
                    }}
                    autoComplete="new-password"
                    placeholder="Create a strong password…"
                    className={`glass-input w-full px-4 py-3.5 pr-12 rounded-xl text-sm text-white ${
                      errors.password ? "border-red-500/60" : ""
                    }`}
                    aria-invalid={!!errors.password}
                    aria-describedby={errors.password ? "reg-password-error" : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors p-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p id="reg-password-error" className="mt-1.5 text-xs text-red-400" role="alert">
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Submit */}
              <button
                id="register-submit"
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed mt-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                    Creating account…
                  </>
                ) : (
                  <>
                    Create Account
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
                <span className="px-3 text-slate-500" style={{ background: "rgba(13,14,28,0.97)" }}>
                  or
                </span>
              </div>
            </div>

            <p className="text-center text-sm text-slate-400">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors focus-visible:outline-none focus-visible:underline"
              >
                Sign in
              </Link>
            </p>
          </div>

          <p className="text-center mt-5 text-xs text-slate-600">
            By signing up, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </>
  );
}

export default Register;
