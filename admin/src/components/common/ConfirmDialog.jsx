import React from "react";
import { AlertTriangle, AlertCircle, HelpCircle } from "lucide-react";
import { Modal } from "./Modal";

export const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure you want to proceed with this action? This operation cannot be undone.",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  type = "danger", // danger, warning, info
  loading = false,
}) => {
  const typeConfigs = {
    danger: {
      icon: AlertCircle,
      iconColor: "text-rose-400",
      iconBg: "bg-rose-500/10",
      btnClass: "bg-rose-600 hover:bg-rose-500 focus:ring-rose-500",
    },
    warning: {
      icon: AlertTriangle,
      iconColor: "text-amber-400",
      iconBg: "bg-amber-500/10",
      btnClass: "bg-amber-600 hover:bg-amber-500 focus:ring-amber-500",
    },
    info: {
      icon: HelpCircle,
      iconColor: "text-blue-400",
      iconBg: "bg-blue-500/10",
      btnClass: "bg-indigo-600 hover:bg-indigo-500 focus:ring-indigo-500",
    },
  };

  const config = typeConfigs[type] || typeConfigs.danger;
  const Icon = config.icon;

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-md">
      <div className="flex flex-col items-center text-center">
        <div className={`w-12 h-12 rounded-2xl ${config.iconBg} flex items-center justify-center ${config.iconColor} mb-4`}>
          <Icon className="w-6 h-6" />
        </div>

        <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
        <p className="text-xs text-slate-300 mb-6 leading-relaxed">{message}</p>

        <div className="flex items-center justify-end gap-3 w-full border-t border-slate-800 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 px-4 py-2 text-xs font-semibold text-white rounded-xl shadow-lg transition-all ${config.btnClass}`}
          >
            {loading ? "Processing..." : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
};
