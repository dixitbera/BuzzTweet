import React, { useEffect, useState } from "react";
import axios from "axios";
import { isEmailValid } from "../utils/validators.js";
import { useRef } from "react";
import Alert from "./Alert.jsx";

function ProfileForm({ data }) {
  const timerRef = useRef(null);
  const timerRefemail = useRef(null);
  const [username, setUsername] = useState(data?.username);
  const [email, setEmail] = useState(data?.email);
  const [bio, setBio] = useState(data?.bio || "");
  const [valid, setValid] = useState(true);
  const [emailvalids, setEmailValid] = useState(true);
  const [showAlert, setShowAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ type: "", message: "" });
  const BIO_MAX_LENGTH = 50;

  const showToast = (type, message) => {
    setAlertConfig({ type, message });
    setShowAlert(true);
  };

  const baseClasses =
    "w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none transition-all";

  const focusClasses = valid
    ? "focus:ring-2 focus:ring-green-500 focus:bg-white focus:border-green-500"
    : "focus:ring-2 focus:ring-red-500 focus:bg-white focus:border-red-500";

  const focusClassesemail = emailvalids
    ? "focus:ring-2 focus:ring-green-500 focus:bg-white focus:border-green-500"
    : "focus:ring-2 focus:ring-red-500 focus:bg-white focus:border-red-500";

  const handleKeyDown = (e) => {
    const value = e.target.value;
    console.log(value);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (value) usernamevalid(value);
      else setValid(false);
    }, 500);
  };

  const handleKeyDownemail = (e) => {
    const value = e.target.value;
    console.log(value);
    clearTimeout(timerRefemail.current);
    timerRefemail.current = setTimeout(() => {
      if (!emailvalids) return;
      if (value) emailvalid(value);
      else setEmailValid(false);
    }, 500);
  };

  async function usernamevalid(value) {
    try {
      const data = await axios.post(
        "http://localhost:5000/profile/username",
        { username: value },
        { withCredentials: true }
      );
      console.log(data.data);
      setValid(data.data.message === "Username is available");
    } catch (error) {
      console.log(error);
    }
  }

  async function emailvalid(value) {
    try {
      const data = await axios.post(
        "http://localhost:5000/profile/email",
        { email: value },
        { withCredentials: true }
      );
      setEmailValid(data.data.message === "email is available");
    } catch (error) {
      console.log(error);
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!usernamevalid || !emailvalid) {
      showToast("error", "Invalid username or email. Cannot submit form.");
      return;
    }
    // Proceed with form submission (e.g., send data to backend)
    try {
      const data = await axios.patch(
        "http://localhost:5000/profile/update",
        { username, email, bio },
        { withCredentials: true }
      );
      if (data.status === 200) {
        setBio(data.data.user.bio);
        setUsername(data.data.user.username);
        setEmail(data.data.user.email);
        showToast("success", "Profile updated successfully!");
      } else {
        showToast("error", "Failed to update profile. Please try again.");
      }
    } catch (error) {
      if (error.response) {
        showToast("error", `Error: ${error.response.data.message}`);
      } else {
        showToast("error", "An unexpected error occurred. Please try again.");
      }
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
      <section className="bg-gray-50 rounded-xl p-5 border border-gray-100">
        <h4 className="text-sm font-semibold text-indigo-600 uppercase tracking-wider mb-4">
          Personal Information
        </h4>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Username
            </label>
            <input
              type="text"
              defaultValue={data?.username}
              onChange={(e) => {
                setUsername(e.target.value);
                handleKeyDown(e);
              }}
              className={`${baseClasses} ${focusClasses}`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              defaultValue={data?.email}
              onChange={(e) => {
                setEmail(e.target.value);
                handleKeyDownemail(e);
                setEmailValid(isEmailValid(e.target.value));
              }}
              className={`${baseClasses} ${focusClassesemail}`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Bio{" "}
              <span className="text-gray-400 text-xs">
                (max {BIO_MAX_LENGTH} characters)
              </span>
            </label>
            <textarea
              name="bio"
              id="bio"
              rows="4"
              value={bio}
              onChange={(e) => {
                if (e.target.value.length <= BIO_MAX_LENGTH) {
                  setBio(e.target.value);
                }
              }}
              className={`${baseClasses} ${focusClasses} resize-none`}
              placeholder="Tell us about yourself..."
            ></textarea>
            <div className="text-xs mt-1 text-gray-500">
              {bio.length}/{BIO_MAX_LENGTH}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md">
              Save Profile
            </button>
          </div>
        </form>
      </section>
    </>
  );
}

export default ProfileForm;
