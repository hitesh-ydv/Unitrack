import React from "react";
import { Bus, PlayCircle, PauseCircle, WifiOff } from "lucide-react";

export const FleetSummaryCards = ({ buses = [], activeFilter = "all", onFilterChange }) => {
  const totalBuses = buses.length;
  const activeBuses = buses.filter(
    (b) => b.status === "active" && b.gpsStatus !== "offline" && (b.speedKmh || 0) > 0
  ).length;
  const stoppedBuses = buses.filter(
    (b) => b.status === "active" && b.gpsStatus !== "offline" && (b.speedKmh || 0) === 0
  ).length;
  const offlineBuses = buses.filter(
    (b) => b.gpsStatus === "offline" || b.status === "inactive"
  ).length;

  const cards = [
    {
      id: "all",
      title: "Total Buses",
      value: totalBuses,
      subtext: "Entire campus fleet",
      icon: Bus,
      color: "blue",
      iconColor: "text-blue-400",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/20",
    },
    {
      id: "active",
      title: "Active Buses",
      value: activeBuses,
      subtext: "Cruising on live routes",
      icon: PlayCircle,
      color: "emerald",
      iconColor: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/20",
    },
    {
      id: "stopped",
      title: "Stopped Buses",
      value: stoppedBuses,
      subtext: "At stops or depot idle",
      icon: PauseCircle,
      color: "amber",
      iconColor: "text-amber-400",
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-500/20",
    },
    {
      id: "offline",
      title: "Offline Buses",
      value: offlineBuses,
      subtext: "No recent GPS heartbeat",
      icon: WifiOff,
      color: "rose",
      iconColor: "text-rose-400",
      bgColor: "bg-rose-500/10",
      borderColor: "border-rose-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
      {cards.map((card) => {
        const Icon = card.icon;
        const isSelected = activeFilter === card.id;

        return (
          <button
            key={card.id}
            type="button"
            onClick={() => onFilterChange && onFilterChange(card.id)}
            className={`p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex items-center justify-between group ${
              isSelected
                ? "bg-slate-900 border-indigo-500/60 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500/40"
                : "bg-slate-900/50 hover:bg-slate-900/80 border-slate-800/70 hover:border-slate-700/80"
            }`}
          >
            <div className="space-y-1 min-w-0">
              <span className="text-xs font-medium text-slate-400 group-hover:text-slate-300 transition-colors block">
                {card.title}
              </span>
              <div className="text-2xl font-bold tracking-tight text-white">
                {card.value}
              </div>
              <span className="text-[11px] text-slate-500 truncate block">
                {card.subtext}
              </span>
            </div>

            <div
              className={`w-10 h-10 rounded-xl ${card.bgColor} border ${card.borderColor} flex items-center justify-center shrink-0 ml-3`}
            >
              <Icon className={`w-5 h-5 ${card.iconColor}`} />
            </div>
          </button>
        );
      })}
    </div>
  );
};
