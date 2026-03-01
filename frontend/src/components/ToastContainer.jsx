import React, { useState, useEffect, useCallback } from "react";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";

// Toast context for managing toasts globally
const ToastContext = React.createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((type, message, duration = 3000, onUndo = null) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, type, message, duration, onUndo }]);
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const toast = {
    success: (message, duration, onUndo) => addToast("success", message, duration, onUndo),
    error: (message, duration, onUndo) => addToast("error", message, duration, onUndo),
    warning: (message, duration, onUndo) => addToast("warning", message, duration, onUndo),
    info: (message, duration, onUndo) => addToast("info", message, duration, onUndo),
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
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

function ToastContainer({ toasts, onRemove }) {
  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast, index) => (
        <Toast
          key={toast.id}
          {...toast}
          index={index}
          onClose={() => onRemove(toast.id)}
        />
      ))}
    </div>
  );
}

function Toast({ type, message, duration, index, onClose, onUndo }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const styles = {
    success: {
      bg: "bg-white",
      border: "border-green-200",
      accent: "bg-green-500",
      text: "text-gray-800",
      subtext: "text-green-600",
      icon: <CheckCircle className="w-5 h-5" />,
      iconColor: "text-green-500",
    },
    error: {
      bg: "bg-white",
      border: "border-red-200",
      accent: "bg-red-500",
      text: "text-gray-800",
      subtext: "text-red-600",
      icon: <XCircle className="w-5 h-5" />,
      iconColor: "text-red-500",
    },
    warning: {
      bg: "bg-white",
      border: "border-yellow-200",
      accent: "bg-yellow-500",
      text: "text-gray-800",
      subtext: "text-yellow-600",
      icon: <AlertTriangle className="w-5 h-5" />,
      iconColor: "text-yellow-500",
    },
    info: {
      bg: "bg-white",
      border: "border-blue-200",
      accent: "bg-blue-500",
      text: "text-gray-800",
      subtext: "text-blue-600",
      icon: <Info className="w-5 h-5" />,
      iconColor: "text-blue-500",
    },
  };

  const style = styles[type] || styles.info;

  useEffect(() => {
    // Animate in
    setTimeout(() => setIsVisible(true), 10);

    // Auto close only if there's no undo button
    if (!onClose || onUndo) return;

    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => {
        onClose();
      }, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [onClose, duration, onUndo]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleUndo = (e) => {
    e.stopPropagation();
    if (onUndo) {
      onUndo();
      handleClose();
    }
  };

  // Calculate offset for stacking
  const offset = index * 8;

  return (
    <div
      className={`
        relative w-full
        transition-all duration-300 ease-out
        ${style.bg} ${style.border}
        border rounded-2xl
        shadow-2xl shadow-gray-900/10
        overflow-hidden
        pointer-events-auto
        ${isVisible && !isExiting 
          ? "translate-x-0 opacity-100" 
          : "translate-x-full opacity-0"
        }
      `}
      style={{
        transform: isVisible && !isExiting 
          ? `translateY(${offset}px)` 
          : `translateX(100%) translateY(${offset}px)`,
      }}
    >
      {/* Colored accent bar */}
      <div className={`h-1 ${style.accent} w-full`} />
      
      <div className="p-4 flex items-start gap-4">
        {/* Icon */}
        <div className={`flex-shrink-0 ${style.iconColor}`}>
          {style.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className={`${style.text} font-semibold text-sm`}>
            {message}
          </p>
          <p className={`${style.subtext} text-xs mt-0.5`}>
            {type === 'success' && 'Success'}
            {type === 'error' && 'Error'}
            {type === 'warning' && 'Warning'}
            {type === 'info' && 'Info'}
          </p>
        </div>

        {/* Undo button */}
        {onUndo && (
          <button
            onClick={handleUndo}
            className="flex-shrink-0 px-2 py-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 transition-colors rounded"
          >
            Undo
          </button>
        )}

        {/* Close button */}
        {onClose && (
          <button
            onClick={handleClose}
            className="flex-shrink-0 p-1 -m-1 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-gray-100">
        <div 
          className={`h-full ${style.accent} transition-all duration-[3000ms] ease-linear`}
          style={{ 
            width: '100%',
            animation: `shrink ${duration}ms linear forwards`
          }}
        />
      </div>

      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}

export default ToastContainer;
