import React from "react";
import ModalWrapper from "./ModalWrapper";
import ProfileForm from "./ProfileForm";
import PasswordForm from "./PasswordForm";
import { Settings } from "lucide-react";

function Profilesetting({ dataf, showf }) {
  return (
    <ModalWrapper showf={showf}>
      <div className="p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="pb-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex items-center gap-3 mb-1 pr-8">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #6366f1, #a855f7)" }}
            >
              <Settings className="w-4.5 h-4.5 text-white" aria-hidden="true" />
            </div>
            <h2 className="text-xl font-bold text-white" style={{ letterSpacing: "-0.02em" }}>
              Profile Settings
            </h2>
          </div>
          <p className="text-sm text-slate-500 ml-12">Manage your personal information and security</p>
        </div>

        <ProfileForm data={dataf} />
        <PasswordForm />
      </div>
    </ModalWrapper>
  );
}

export default Profilesetting;
