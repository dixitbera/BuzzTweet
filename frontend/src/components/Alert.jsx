import React, { useEffect, useState } from "react";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";

export default function Alert({ type, message, onClose, duration = 3000 }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const styles = {
    success: {
      accentColor: "#10b981",
      iconColor: "#10b981",
      bg: "rgba(16,185,129,0.1)",
      border: "rgba(16,185,129,0.25)",
      icon: <CheckCircle className="w-5 h-5" aria-hidden="true" />,
      label: "Success",
    },
    error: {
      accentColor: "#ef4444",
      iconColor: "#ef4444",
      bg: "rgba(239,68,68,0.1)",
      border: "rgba(239,68,68,0.25)",
      icon: <XCircle className="w-5 h-5" aria-hidden="true" />,
      label: "Error",
    },
    warning: {
      accentColor: "#f59e0b",
      iconColor: "#f59e0b",
      bg: "rgba(245,158,11,0.1)",
      border: "rgba(245,158,11,0.25)",
      icon: <AlertTriangle className="w-5 h-5" aria-hidden="true" />,
      label: "Warning",
    },
    info: {
      accentColor: "#6366f1",
      iconColor: "#6366f1",
      bg: "rgba(99,102,241,0.1)",
      border: "rgba(99,102,241,0.25)",
      icon: <Info className="w-5 h-5" aria-hidden="true" />,
      label: "Info",
    },
  };

  const s = styles[type] || styles.info;

  useEffect(() => {
    const t1 = setTimeout(() => setIsVisible(true), 10);
    if (!onClose) return () => clearTimeout(t1);
    const t2 = setTimeout(() => {
      setIsExiting(true);
      setTimeout(onClose, 300);
    }, duration);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onClose, duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(onClose, 300);
  };

  return (
    <div
      role="alert"
      aria-live="polite"
      className="fixed top-4 right-4 z-[9999] max-w-sm w-full overflow-hidden rounded-2xl transition-all duration-300"
      style={{
        background: "rgba(13,14,28,0.95)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: `1px solid ${s.border}`,
        boxShadow: `0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px ${s.border}`,
        transform: isVisible && !isExiting ? "translateX(0)" : "translateX(110%)",
        opacity: isVisible && !isExiting ? 1 : 0,
      }}
    >
      {/* Top accent line */}
      <div style={{ height: "2px", background: s.accentColor, width: "100%" }} />

      <div className="p-4 flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5" style={{ color: s.iconColor }}>
          {s.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm">{message}</p>
          <p className="text-xs mt-0.5" style={{ color: s.iconColor }}>{s.label}</p>
        </div>

        {/* Close */}
        {onClose && (
          <button
            onClick={handleClose}
            aria-label="Dismiss notification"
            className="flex-shrink-0 p-1 rounded-lg text-slate-500 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            style={{ background: "rgba(255,255,255,0.05)" }}
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Progress bar */}
      <div style={{ height: "2px", background: "rgba(255,255,255,0.06)" }}>
        <div
          style={{
            height: "100%",
            background: s.accentColor,
            width: "100%",
            animation: `progress-shrink ${duration}ms linear forwards`,
          }}
        />
      </div>

      <style>{`
        @keyframes progress-shrink {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
    </div>
  );
}
