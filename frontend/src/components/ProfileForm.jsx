import React, { useState } from "react";
import axios from "axios";
import { isEmailValid } from "../utils/validators.js";
import { useRef } from "react";
import Alert from "./Alert.jsx";
import { User, Mail, FileText, Save, CheckCircle, XCircle } from "lucide-react";

function ProfileForm({ data }) {
  const timerRef       = useRef(null);
  const timerRefemail  = useRef(null);
  const [username,     setUsername]      = useState(data?.username);
  const [email,        setEmail]         = useState(data?.email);
  const [bio,          setBio]           = useState(data?.bio || "");
  const [valid,        setValid]         = useState(true);
  const [emailvalids,  setEmailValid]    = useState(true);
  const [showAlert,    setShowAlert]     = useState(false);
  const [alertConfig,  setAlertConfig]   = useState({ type: "", message: "" });
  const [isSaving,     setIsSaving]      = useState(false);
  const BIO_MAX_LENGTH = 50;

  const showToast = (type, message) => { setAlertConfig({ type, message }); setShowAlert(true); };

  const handleKeyDown = (e) => {
    const value = e.target.value;
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => { if (value) usernamevalid(value); else setValid(false); }, 500);
  };

  const handleKeyDownemail = (e) => {
    const value = e.target.value;
    clearTimeout(timerRefemail.current);
    timerRefemail.current = setTimeout(() => {
      if (!emailvalids) return;
      if (value) emailvalid(value); else setEmailValid(false);
    }, 500);
  };

  async function usernamevalid(value) {
    try {
      const d = await axios.post(`${import.meta.env.VITE_API_URL}/profile/username`, { username: value }, { withCredentials: true });
      setValid(d.data.message === "Username is available");
    } catch {}
  }

  async function emailvalid(value) {
    try {
      const d = await axios.post(`${import.meta.env.VITE_API_URL}/profile/email`, { email: value }, { withCredentials: true });
      setEmailValid(d.data.message === "email is available");
    } catch {}
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const d = await axios.patch(`${import.meta.env.VITE_API_URL}/profile/update`, { username, email, bio }, { withCredentials: true });
      if (d.status === 200) {
        setBio(d.data.user.bio); setUsername(d.data.user.username); setEmail(d.data.user.email);
        showToast("success", "Profile updated successfully!");
      } else {
        showToast("error", "Failed to update profile. Please try again.");
      }
    } catch (error) {
      showToast("error", error.response ? `Error: ${error.response.data.message}` : "An unexpected error occurred.");
    } finally { setIsSaving(false); }
  };

  const inputClass = (isErr) => `glass-input w-full px-4 py-3 rounded-xl text-sm text-white transition-all ${isErr ? "border-red-500/60" : ""}`;

  return (
    <>
      {showAlert && (
        <Alert type={alertConfig.type} message={alertConfig.message} onClose={() => setShowAlert(false)} duration={3000} />
      )}
      <section className="space-y-4">
        {/* Section header */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-5 rounded-full" style={{ background: "linear-gradient(180deg, #6366f1, #a855f7)" }} />
          <h4 className="text-sm font-semibold text-indigo-400 uppercase tracking-wider">
            Personal Information
          </h4>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Username */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-slate-300 mb-2">
              <User className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
              Username
              {!valid && username && (
                <span className="ml-auto flex items-center gap-1 text-xs text-red-400">
                  <XCircle className="w-3.5 h-3.5" /> Taken
                </span>
              )}
              {valid && username && username !== data?.username && (
                <span className="ml-auto flex items-center gap-1 text-xs text-emerald-400">
                  <CheckCircle className="w-3.5 h-3.5" /> Available
                </span>
              )}
            </label>
            <input
              type="text"
              defaultValue={data?.username}
              onChange={(e) => { setUsername(e.target.value); handleKeyDown(e); }}
              className={inputClass(!valid && username)}
              placeholder="Your username"
              spellCheck={false}
            />
          </div>

          {/* Email */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-slate-300 mb-2">
              <Mail className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
              Email Address
              {!emailvalids && email && (
                <span className="ml-auto flex items-center gap-1 text-xs text-red-400">
                  <XCircle className="w-3.5 h-3.5" /> Invalid
                </span>
              )}
            </label>
            <input
              type="email"
              defaultValue={data?.email}
              onChange={(e) => { setEmail(e.target.value); handleKeyDownemail(e); setEmailValid(isEmailValid(e.target.value)); }}
              className={inputClass(!emailvalids && email)}
              placeholder="your@email.com"
              spellCheck={false}
            />
          </div>

          {/* Bio */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-slate-300 mb-2">
              <FileText className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
              Bio
              <span className="ml-auto text-xs text-slate-500">{bio.length}/{BIO_MAX_LENGTH}</span>
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => { if (e.target.value.length <= BIO_MAX_LENGTH) setBio(e.target.value); }}
              className="glass-input w-full px-4 py-3 rounded-xl text-sm text-white resize-none"
              placeholder="Tell the world about yourself…"
            />
          </div>

          {/* Submit */}
          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={isSaving}
              className="btn-primary flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              {isSaving ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving…</>
              ) : (
                <><Save className="w-4 h-4" aria-hidden="true" />Save Profile</>
              )}
            </button>
          </div>
        </form>
      </section>
    </>
  );
}

export default ProfileForm;
