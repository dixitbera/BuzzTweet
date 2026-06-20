import React, { useEffect, useState } from "react";
import axios from "axios";
import { validatePassword } from "../utils/validators.js";
import Alert from "./Alert.jsx";
import { Eye, EyeOff, Loader2, XCircle, Lock, ShieldCheck } from "lucide-react";

function PasswordForm() {
  const [password,         setPassword]         = useState("");
  const [newpassword,      setNewPassword]       = useState("");
  const [confirmpass,      setConfirmpass]       = useState("");
  const [msg,              setMsg]               = useState([]);
  const [passwordvalid,    setPasswordValid]     = useState(true);
  const [newpasswordvalid, setNewPasswordValid]  = useState(false);
  const [showAlert,        setShowAlert]         = useState(false);
  const [alertConfig,      setAlertConfig]       = useState({ type: "", message: "" });
  const [isLoading,        setIsLoading]         = useState(false);
  const [showCurrent,      setShowCurrent]       = useState(false);
  const [showNew,          setShowNew]           = useState(false);
  const [showConfirm,      setShowConfirm]       = useState(false);

  useEffect(() => {
    if (!newpassword || !confirmpass) { setPasswordValid(true); return; }
    setPasswordValid(newpassword === confirmpass);
  }, [newpassword, confirmpass]);

  const showToast = (type, message) => { setAlertConfig({ type, message }); setShowAlert(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!confirmpass || !newpassword || !password) { showToast("error", "Please fill in all password fields"); return; }
    if (!passwordvalid || !newpasswordvalid) { showToast("error", "Passwords don't match or are invalid"); return; }
    setIsLoading(true);
    try {
      const data = await axios.post(
        `${import.meta.env.VITE_API_URL}/profile/changepassword`,
        { oldpass: password, newpass: confirmpass },
        { withCredentials: true }
      );
      if (data.data?.success) {
        showToast("success", "Password updated successfully!");
        setPassword(""); setNewPassword(""); setConfirmpass(""); setMsg([]);
      } else {
        showToast("error", data.data.message || "Failed to update password");
      }
    } catch (error) {
      showToast("error", error.response?.data?.message || "Failed to update password");
    } finally { setIsLoading(false); }
  };

  const PasswordInput = ({ id, label, value, onChange, show, onToggle, placeholder }) => (
    <div>
      <label htmlFor={id} className="flex items-center gap-1.5 text-sm font-medium text-slate-300 mb-2">
        <Lock className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={onChange}
          className="glass-input w-full px-4 py-3 pr-11 rounded-xl text-sm text-white"
          placeholder={placeholder}
          autoComplete="off"
        />
        <button
          type="button"
          onClick={onToggle}
          aria-label={show ? "Hide password" : "Show password"}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors p-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {showAlert && (
        <Alert type={alertConfig.type} message={alertConfig.message} onClose={() => setShowAlert(false)} duration={3000} />
      )}

      <section className="space-y-4 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
        {/* Section header */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-5 rounded-full" style={{ background: "linear-gradient(180deg, #a855f7, #06b6d4)" }} />
          <h4 className="text-sm font-semibold text-violet-400 uppercase tracking-wider">
            Change Password
          </h4>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <PasswordInput
            id="current-password"
            label="Current Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            show={showCurrent}
            onToggle={() => setShowCurrent(!showCurrent)}
            placeholder="Enter current password"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <PasswordInput
              id="new-password"
              label="New Password"
              value={newpassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                const result = validatePassword(e.target.value);
                setMsg(result.errors);
                setNewPasswordValid(result.isValid);
              }}
              show={showNew}
              onToggle={() => setShowNew(!showNew)}
              placeholder="New password"
            />
            <PasswordInput
              id="confirm-password"
              label="Confirm Password"
              value={confirmpass}
              onChange={(e) => setConfirmpass(e.target.value)}
              show={showConfirm}
              onToggle={() => setShowConfirm(!showConfirm)}
              placeholder="Confirm password"
            />
          </div>

          {/* Validation errors */}
          {(msg.length > 0 || !passwordvalid) && (
            <div
              className="rounded-xl p-3 space-y-1.5"
              style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}
            >
              {msg.map((m, i) => (
                <p key={i} className="text-red-400 text-xs flex items-center gap-1.5">
                  <XCircle className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
                  {m}
                </p>
              ))}
              {!passwordvalid && (
                <p className="text-red-400 text-xs flex items-center gap-1.5">
                  <XCircle className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
                  Passwords do not match
                </p>
              )}
            </div>
          )}

          {/* Submit */}
          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60 disabled:cursor-not-allowed transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
              style={{ background: "linear-gradient(135deg, #a855f7, #6366f1)" }}
            >
              {isLoading ? (
                <><Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />Updating…</>
              ) : (
                <><ShieldCheck className="w-4 h-4" aria-hidden="true" />Update Password</>
              )}
            </button>
          </div>
        </form>
      </section>
    </>
  );
}

export default PasswordForm;
