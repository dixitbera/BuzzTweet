import React, { useEffect } from "react";

function ModalWrapper({ children, showf }) {
  const handleModalClick = (e) => e.stopPropagation();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") showf(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showf]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 transition-opacity"
      onClick={() => showf(false)}
    >
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto"
        onClick={handleModalClick}
      >
        {children}
      </div>
    </div>
  );
}

export default ModalWrapper;
