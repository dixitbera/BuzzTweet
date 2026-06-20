import React, { useState, useEffect, useCallback } from "react";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";

const ToastContext = React.createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((type, message, duration = 3000, onUndo = null) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, type, message, duration, onUndo }]);
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (message, duration, onUndo) => addToast("success", message, duration, onUndo),
    error:   (message, duration, onUndo) => addToast("error",   message, duration, onUndo),
    warning: (message, duration, onUndo) => addToast("warning", message, duration, onUndo),
    info:    (message, duration, onUndo) => addToast("info",    message, duration, onUndo),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within a ToastProvider");
  return context;
}

function ToastContainer({ toasts, onRemove }) {
  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none" aria-live="polite">
      {toasts.map((t, index) => (
        <Toast key={t.id} {...t} index={index} onClose={() => onRemove(t.id)} />
      ))}
    </div>
  );
}

const STYLES = {
  success: {
    accentColor: "#10b981",
    iconColor:   "#10b981",
    border:      "rgba(16,185,129,0.25)",
    icon: <CheckCircle className="w-5 h-5" aria-hidden="true" />,
    label: "Success",
  },
  error: {
    accentColor: "#ef4444",
    iconColor:   "#ef4444",
    border:      "rgba(239,68,68,0.25)",
    icon: <XCircle className="w-5 h-5" aria-hidden="true" />,
    label: "Error",
  },
  warning: {
    accentColor: "#f59e0b",
    iconColor:   "#f59e0b",
    border:      "rgba(245,158,11,0.25)",
    icon: <AlertTriangle className="w-5 h-5" aria-hidden="true" />,
    label: "Warning",
  },
  info: {
    accentColor: "#6366f1",
    iconColor:   "#6366f1",
    border:      "rgba(99,102,241,0.25)",
    icon: <Info className="w-5 h-5" aria-hidden="true" />,
    label: "Info",
  },
};

function Toast({ type, message, duration, index, onClose, onUndo }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const s = STYLES[type] || STYLES.info;
  const offset = index * 8;

  useEffect(() => {
    const t1 = setTimeout(() => setIsVisible(true), 10);
    if (!onClose || onUndo) return () => clearTimeout(t1);
    const t2 = setTimeout(() => {
      setIsExiting(true);
      setTimeout(onClose, 300);
    }, duration);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onClose, duration, onUndo]);

  const handleClose = () => { setIsExiting(true); setTimeout(onClose, 300); };
  const handleUndo  = (e) => { e.stopPropagation(); onUndo?.(); handleClose(); };

  return (
    <div
      role="alert"
      className="relative w-full overflow-hidden rounded-2xl transition-all duration-300 ease-out pointer-events-auto"
      style={{
        background: "rgba(13,14,28,0.97)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: `1px solid ${s.border}`,
        boxShadow: `0 20px 60px rgba(0,0,0,0.5)`,
        transform: isVisible && !isExiting
          ? `translateX(0) translateY(${offset}px)`
          : `translateX(110%) translateY(${offset}px)`,
        opacity: isVisible && !isExiting ? 1 : 0,
      }}
    >
      {/* Top accent */}
      <div style={{ height: "2px", background: s.accentColor }} />

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

        {/* Undo */}
        {onUndo && (
          <button
            onClick={handleUndo}
            className="flex-shrink-0 px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            style={{
              color: "#818cf8",
              background: "rgba(99,102,241,0.15)",
              border: "1px solid rgba(99,102,241,0.3)",
            }}
          >
            Undo
          </button>
        )}

        {/* Close */}
        {onClose && (
          <button
            onClick={handleClose}
            aria-label="Dismiss"
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
            animation: `progress-shrink ${duration}ms linear forwards`,
          }}
        />
      </div>

      <style>{`
        @keyframes progress-shrink { from { width: 100%; } to { width: 0%; } }
      `}</style>
    </div>
  );
}

export default ToastContainer;
