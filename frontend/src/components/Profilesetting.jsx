import React from "react";
import ModalWrapper from "./ModalWrapper";
import ProfileForm from "./ProfileForm";
import PasswordForm from "./PasswordForm";

function Profilesetting({ dataf, showf }) {
  return (
    <>
      {true && (
        <ModalWrapper showf={showf}>
          <div className="p-6 sm:p-8 space-y-6 bg-gradient-to-br from-white to-gray-50">
            <div className="border-b border-gray-100 pb-4">
              <h2 className="text-2xl font-bold text-gray-800">Profile Settings</h2>
              <p className="text-sm text-gray-500 mt-1">Manage your personal information and password</p>
            </div>
            <ProfileForm data={dataf} />
            <PasswordForm />
          </div>
        </ModalWrapper>
      )}
    </>
  );
}

export default Profilesetting;
