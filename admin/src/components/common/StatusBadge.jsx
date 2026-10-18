import React from "react";

export const StatusBadge = ({ status, text, size = "md" }) => {
  const normalized = (status || "").toLowerCase().replace(/[\s-]/g, "_");

  const badgeStyles = {
    // General states
    active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    in_progress: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    completed: "bg-teal-500/10 text-teal-400 border-teal-500/30",
    scheduled: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30",
    delayed: "bg-rose-500/10 text-rose-400 border-rose-500/30",
    cancelled: "bg-slate-700/30 text-slate-400 border-slate-600/30",
    inactive: "bg-slate-700/30 text-slate-400 border-slate-600/30",

    // Fleet GPS states
    live: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    stale: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    offline: "bg-slate-700/30 text-slate-400 border-slate-600/30",
    maintenance: "bg-orange-500/10 text-orange-400 border-orange-500/30",
    out_of_service: "bg-rose-500/10 text-rose-400 border-rose-500/30",

    // Driver states
    on_duty: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    off_duty: "bg-slate-700/30 text-slate-400 border-slate-600/30",
    on_leave: "bg-amber-500/10 text-amber-400 border-amber-500/30",

    // Student boarding
    boarded: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    pending: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    missed: "bg-rose-500/10 text-rose-400 border-rose-500/30",

    // Alerts & Severity
    critical: "bg-rose-500/10 text-rose-400 border-rose-500/30",
    warning: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    info: "bg-blue-500/10 text-blue-400 border-blue-500/30",

    // Attendance Verification
    valid: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    wrong_route: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    expired: "bg-rose-500/10 text-rose-400 border-rose-500/30",

    // Maintenance
    overdue: "bg-rose-500/10 text-rose-400 border-rose-500/30",
    success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    failure: "bg-rose-500/10 text-rose-400 border-rose-500/30",
  };

  const style = badgeStyles[normalized] || "bg-slate-800 text-slate-300 border-slate-700";
  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs";

  const displayText =
    text ||
    (status
      ? status
          .replace(/_/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase())
      : "Unknown");

  const hasDot = ["live", "active", "in_progress", "critical", "warning", "delayed"].includes(normalized);

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${style} ${sizeClasses}`}
    >
      {hasDot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            normalized === "critical" || normalized === "delayed"
              ? "bg-rose-400 animate-ping"
              : normalized === "warning" || normalized === "stale"
              ? "bg-amber-400"
              : "bg-emerald-400"
          }`}
        />
      )}
      {displayText}
    </span>
  );
};
