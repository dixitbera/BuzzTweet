import React, { useEffect } from "react";
import { X } from "lucide-react";

function ModalWrapper({ children, showf }) {
  const handleModalClick = (e) => e.stopPropagation();

  useEffect(() => {
    const handleKeyDown = (e) => { if (e.key === "Escape") showf(false); };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showf]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}
      onClick={() => showf(false)}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl animate-bounce-in scrollbar-dark"
        style={{
          background: "rgba(13,14,28,0.98)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,102,241,0.15)",
        }}
        onClick={handleModalClick}
      >
        {/* Close button */}
        <button
          onClick={() => showf(false)}
          aria-label="Close modal"
          className="absolute top-4 right-4 z-10 p-2 rounded-xl text-slate-400 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          style={{ background: "rgba(255,255,255,0.06)" }}
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
        {children}
      </div>
    </div>
  );
}

export default ModalWrapper;
