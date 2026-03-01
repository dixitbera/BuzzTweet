import React, { useEffect, useState } from "react";
import axios from "axios";
import { validatePassword } from "../utils/validators.js";
import Alert from "./Alert.jsx";
import { Eye, EyeOff, Loader2, CheckCircle, XCircle } from "lucide-react";

function PasswordForm() {
  const [password, setPassword] = useState("");
  const [newpassword, setNewPassword] = useState("");
  const [confirmpass, setConfirmpass] = useState("");
  const [msg, setMsg] = useState([]);
  const [passwordvalid, setPasswordValid] = useState(true);
  const [newpasswordvalid, setNewPasswordValid] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ type: "", message: "" });
  const [isLoading, setIsLoading] = useState(false);

  // show / hide states
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // match check
  useEffect(() => {
    if (!newpassword || !confirmpass) {
      setPasswordValid(true);
      return;
    }
    setPasswordValid(newpassword === confirmpass);
  }, [newpassword, confirmpass]);

  const showToast = (type, message) => {
    setAlertConfig({ type, message });
    setShowAlert(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!confirmpass || !newpassword || !password) {
      showToast("error", "Please fill in all password fields");
      return;
    }
    if (!passwordvalid || !newpasswordvalid) {
      showToast("error", "Passwords don't match or are invalid");
      return;
    }

    setIsLoading(true);
    try {
      const data = await axios.post(
        "http://localhost:5000/profile/changepassword",
        { oldpass: password, newpass: confirmpass },
        { withCredentials: true }
      );
      if (data.data?.success) {
        showToast("success", "Password updated successfully!");
        setPassword("");
        setNewPassword("");
        setConfirmpass("");
        setMsg([]);
      } else {
        showToast("error", data.data.message || "Failed to update password");
      }
    } catch (error) {
      console.log(error.response.data.message);
      showToast("error", error.response?.data?.message || "Failed to update password");
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyle =
    "w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition";

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
      <section className="bg-gray-50 rounded-xl p-6 border border-gray-100">
        <h4 className="text-sm font-semibold text-indigo-600 uppercase tracking-wider mb-5">
          Change Password
        </h4>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Current Password */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Password
            </label>
            <input
              type={showCurrent ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${inputStyle} pr-10`}
              placeholder="Enter current password"
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              className="absolute right-3 top-9 text-gray-500 hover:text-gray-700 transition-colors"
            >
              {showCurrent ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* New + Confirm */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* New Password */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <input
                type={showNew ? "text" : "password"}
                value={newpassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  const result = validatePassword(e.target.value);
                  setMsg(result.errors);
                  setNewPasswordValid(result.isValid);
                }}
                className={`${inputStyle} pr-10`}
                placeholder="New password"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-9 text-gray-500 hover:text-gray-700 transition-colors"
              >
                {showNew ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* Confirm Password */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <input
                type={showConfirm ? "text" : "password"}
                value={confirmpass}
                onChange={(e) => setConfirmpass(e.target.value)}
                className={`${inputStyle} pr-10`}
                placeholder="Confirm password"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-9 text-gray-500 hover:text-gray-700 transition-colors"
              >
                {showConfirm ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Strength errors */}
          {msg.map((m, i) => (
            <p key={i} className="text-red-500 text-sm flex items-center gap-1">
              <XCircle className="w-4 h-4" />
              {m}
            </p>
          ))}

          {/* Match error */}
          {!passwordvalid && (
            <p className="text-red-500 text-sm flex items-center gap-1">
              <XCircle className="w-4 h-4" />
              Passwords do not match
            </p>
          )}

          {/* Submit */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2.5 bg-gray-900 text-white rounded-lg font-medium hover:bg-black transition flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Password"
              )}
            </button>
          </div>
        </form>
      </section>
    </>
  );
}

export default PasswordForm;
