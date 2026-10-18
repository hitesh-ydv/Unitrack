import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from "lucide-react";

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback(({ title, message, type = "info", duration = 4000 }) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (title, message) => addToast({ title, message, type: "success" }),
    error: (title, message) => addToast({ title, message, type: "error" }),
    warning: (title, message) => addToast({ title, message, type: "warning" }),
    info: (title, message) => addToast({ title, message, type: "info" }),
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      {/* Floating Toast Container */}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 max-w-md w-full pointer-events-none px-4">
        {toasts.map((t) => {
          let borderClass = "border-blue-500/40 bg-slate-900/95 text-blue-100";
          let Icon = Info;
          let iconColor = "text-blue-400";

          if (t.type === "success") {
            borderClass = "border-emerald-500/40 bg-slate-900/95 text-emerald-100";
            Icon = CheckCircle2;
            iconColor = "text-emerald-400";
          } else if (t.type === "warning") {
            borderClass = "border-amber-500/40 bg-slate-900/95 text-amber-100";
            Icon = AlertTriangle;
            iconColor = "text-amber-400";
          } else if (t.type === "error") {
            borderClass = "border-rose-500/40 bg-slate-900/95 text-rose-100";
            Icon = AlertCircle;
            iconColor = "text-rose-400";
          }

          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-2xl backdrop-blur-md transition-all duration-300 animate-in slide-in-from-bottom-3 ${borderClass}`}
            >
              <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${iconColor}`} />
              <div className="flex-1 min-w-0">
                {t.title && <h4 className="text-sm font-semibold tracking-wide text-white">{t.title}</h4>}
                {t.message && <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{t.message}</p>}
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context.toast;
};
