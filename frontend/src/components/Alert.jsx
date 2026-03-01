import React, { useEffect, useState } from "react";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";

export default function Alert({ type, message, onClose, duration = 3000 }) {
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

    // Auto close
    if (!onClose) return;

    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => {
        onClose();
      }, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  return (
    <div
      className={`
        fixed top-4 right-4 z-[9999] max-w-sm w-full
        transition-all duration-300 ease-out
        ${style.bg} ${style.border}
        border rounded-2xl
        shadow-2xl shadow-gray-900/10
        overflow-hidden
        ${isVisible && !isExiting ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"}
      `}
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
