import React from "react";
import {
  X,
  Phone,
  Gauge,
  MapPin,
  Clock,
  Compass,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  LocateFixed,
  Fuel,
  Users,
  ArrowLeft,
} from "lucide-react";
import { computeRouteStopProgress } from "../../utils/routeProgress";

export const BusInfoPanel = ({
  bus,
  route,
  allStops = [],
  onClose,
  isFollowingBus,
  onToggleFollow,
  onBackToList,
}) => {
  if (!bus) return null;

  const isDelayed = (bus.delayMinutes || 0) > 5;
  const isStopped = (bus.speedKmh || 0) === 0;
  const isOffline = bus.gpsStatus === "offline";

  let statusLabel = "Running";
  let statusBadgeClass = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
  if (isOffline) {
    statusLabel = "Offline";
    statusBadgeClass = "bg-slate-500/10 text-slate-400 border-slate-500/20";
  } else if (isDelayed) {
    statusLabel = `Delayed (+${bus.delayMinutes}m)`;
    statusBadgeClass = "bg-amber-500/10 text-amber-400 border-amber-500/20";
  } else if (isStopped) {
    statusLabel = "Stopped";
    statusBadgeClass = "bg-rose-500/10 text-rose-400 border-rose-500/20";
  }

  // Compute ordered stop progress along route
  const progress = computeRouteStopProgress(bus, route, allStops);

  // Driver details
  const driverName = bus.assignedDriverName || "Unassigned Driver";
  const driverPhone = bus.assignedDriverPhone || "+91 98451 00000";
  const driverInitials = driverName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // Location and ping time
  const locationText = bus.nextStopName ? `Near ${bus.nextStopName}` : "Campus Route Corridor";
  const lastPingText = bus.lastPing ? "Updated just now" : "Heartbeat live";

  return (
    <div className="bg-slate-900/95 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-md overflow-hidden flex flex-col h-full transition-all">
      {/* Panel Header */}
      <div className="p-4 sm:p-5 border-b border-slate-800/80 flex items-start justify-between gap-3 bg-slate-950/40 shrink-0">
        <div className="flex items-start gap-2.5 min-w-0">
          {onBackToList && (
            <button
              type="button"
              onClick={onBackToList}
              title="Back to fleet list"
              className="p-1.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer border border-slate-700/60 shrink-0 mt-0.5"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="font-extrabold text-lg text-white tracking-tight">
                {bus.busNumber}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${statusBadgeClass}`}>
                {statusLabel}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono truncate">
              {bus.plateNumber || "KA-01-EXP-2026"} &bull; {bus.model || "Transit Coach"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={onToggleFollow}
            title={isFollowingBus ? "Camera locked to bus" : "Lock camera to bus"}
            className={`p-2 rounded-xl border text-xs font-medium transition-colors cursor-pointer ${
              isFollowingBus
                ? "bg-indigo-600/30 text-indigo-300 border-indigo-500/40"
                : "bg-slate-800/60 text-slate-400 hover:text-white border-slate-700/60"
            }`}
          >
            <LocateFixed className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            title="Deselect bus and hide route"
            className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer border border-slate-700/60"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
        {/* Speed & Live Telemetry Gauge */}
        <div className="grid grid-cols-3 gap-2.5 bg-slate-950/60 p-3 rounded-xl border border-slate-800/70">
          <div className="text-center">
            <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider block">
              Speed
            </span>
            <div className="text-lg font-bold text-emerald-400 mt-0.5 flex items-center justify-center gap-1">
              <Gauge className="w-4 h-4" />
              <span>{bus.speedKmh || 0}</span>
              <span className="text-[10px] font-normal text-slate-400">km/h</span>
            </div>
          </div>

          <div className="text-center border-x border-slate-800">
            <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider block">
              Heading
            </span>
            <div className="text-sm font-semibold text-slate-200 mt-0.5 flex items-center justify-center gap-1">
              <Compass className="w-3.5 h-3.5 text-indigo-400" />
              <span>{bus.headingDeg || 0}&deg;</span>
            </div>
          </div>

          <div className="text-center">
            <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider block">
              Occupancy
            </span>
            <div className="text-sm font-semibold text-slate-200 mt-0.5 flex items-center justify-center gap-1">
              <Users className="w-3.5 h-3.5 text-cyan-400" />
              <span>
                {bus.currentOccupancy || 0}/{bus.capacity || 50}
              </span>
            </div>
          </div>
        </div>

        {/* Current Location & Ping Time */}
        <div className="flex items-start gap-2.5 text-xs bg-slate-800/30 p-2.5 rounded-xl border border-slate-800/60">
          <MapPin className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <span className="text-slate-200 font-medium block truncate">
              {locationText}
            </span>
            <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
              <Clock className="w-3 h-3 text-slate-500" />
              {lastPingText}
            </span>
          </div>
        </div>

        {/* Route Source & University Destination */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold text-white">Assigned Route</span>
            <span className="text-[11px] text-indigo-400 font-medium truncate max-w-[150px]">
              {route?.name || bus.routeName || "University Express"}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs space-y-2">
            <div className="flex items-center justify-between text-slate-300">
              <span className="font-medium truncate max-w-[120px]">
                {progress.sourceName}
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="font-medium text-right text-indigo-300 truncate max-w-[130px]">
                {progress.destinationName}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1 pt-1">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>
                  {progress.coveredCount} of {progress.totalCount} stops covered
                </span>
                <span className="font-medium text-slate-200">
                  {progress.progressPercent}%
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${progress.progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Previous Stop, Next Stop, and ETA */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800/70">
            <span className="text-[10px] text-slate-500 uppercase font-semibold block">
              Previous Stop
            </span>
            <p className="text-xs font-medium text-slate-300 mt-0.5 truncate">
              {progress.previousStop?.name || "Terminal Yard"}
            </p>
            <span className="text-[10px] text-emerald-400 font-medium">Covered</span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950/50 border border-indigo-500/30">
            <span className="text-[10px] text-indigo-400 uppercase font-semibold block">
              Next Stop (ETA)
            </span>
            <p className="text-xs font-semibold text-white mt-0.5 truncate">
              {progress.nextStop?.name || "Approaching Campus"}
            </p>
            <span className="text-[10px] text-amber-400 font-semibold">
              ETA ~{progress.etaMinutes} min{progress.etaMinutes > 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* Driver Profile & Direct Call Button */}
        <div className="pt-2 border-t border-slate-800/80">
          <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-10 h-10 rounded-full bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 font-bold flex items-center justify-center shrink-0 text-xs">
                {driverInitials}
              </div>
              <div className="min-w-0">
                <span className="font-semibold text-xs text-white block truncate">
                  {driverName}
                </span>
                <span className="text-[11px] text-slate-400 block truncate">
                  {driverPhone}
                </span>
              </div>
            </div>

            <a
              href={`tel:${driverPhone.replace(/\s+/g, "")}`}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md transition-colors shrink-0"
              title={`Call ${driverName}`}
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Call</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
