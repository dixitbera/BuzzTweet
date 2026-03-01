import React, { useState, useEffect } from "react";
import { Eye, EyeOff, LogIn, Loader2 } from "lucide-react";
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

  useEffect(() => {
    if (islogin) {
      navigate("/");
    }
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
      const res = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          username,
          password,
        }),
      });
      const data = await res.json();
      
      if (data?.flag) {
        showToast("success", "Welcome back! Login successful.");
        setTimeout(() => {
          navigate("/post");
        }, 800);
      } else {
        showToast("error", data.message || "Invalid credentials. Please try again.");
      }
    } catch (error) {
      showToast("error", "Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const inputClasses = (hasError) => `
    w-full px-4 py-3.5 
    bg-gray-50 border-2 rounded-xl 
    focus:ring-2 focus:ring-offset-1 
    transition-all duration-200 ease-out
    outline-none
    ${hasError 
      ? "border-red-300 focus:border-red-500 focus:ring-red-100" 
      : "border-gray-200 focus:border-gray-900 focus:ring-gray-100"
    }
    placeholder-gray-400
  `;

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
      
      <div className="min-h-screen flex items-center justify-center px-4 py-6 sm:px-6 lg:px-8">
        {/* Background Pattern */}
        <div className="fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-100" />
          <div className="absolute top-0 -left-40 w-80 h-80 bg-gray-200/30 rounded-full blur-3xl" />
          <div className="absolute bottom-0 -right-40 w-80 h-80 bg-gray-200/30 rounded-full blur-3xl" />
        </div>

        <div className="w-full max-w-md">
          {/* Logo/Brand Area */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-900 rounded-2xl mb-4 shadow-lg">
              <LogIn className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
              Welcome Back
            </h2>
            <p className="mt-2 text-gray-500 text-sm sm:text-base">
              Log in to continue to your account
            </p>
          </div>

          {/* Login Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-100 p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Username Field */}
              <div>
                <label
                  htmlFor="username"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (errors.username) setErrors({ ...errors, username: "" });
                  }}
                  className={inputClasses(errors.username)}
                  placeholder="Enter your username"
                  autoComplete="username"
                />
                {errors.username && (
                  <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1">
                    {errors.username}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors({ ...errors, password: "" });
                    }}
                    className={`${inputClasses(errors.password)} pr-12`}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1">
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Forgot Password Link */}
              <div className="flex justify-end">
                <button
                  type="button"
                  className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
                >
                  Forgot password?
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white py-3.5 px-6 rounded-xl font-semibold text-base hover:bg-gray-800 focus:ring-4 focus:ring-gray-200 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-gray-900/20 hover:shadow-xl hover:shadow-gray-900/30 active:scale-[0.98]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Logging in...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    <span>Log In</span>
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-400">or</span>
              </div>
            </div>

            {/* Sign Up Link */}
            <p className="text-center text-sm sm:text-base text-gray-500">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="font-semibold text-gray-900 hover:text-gray-700 transition-colors inline-flex items-center gap-1"
              >
                Sign up
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </p>
          </div>

          {/* Footer Text */}
          <p className="text-center mt-6 text-xs text-gray-400">
            By logging in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </>
  );
}
