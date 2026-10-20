import React from "react";
import { Search, Filter, Bus, Navigation, MapPin, X } from "lucide-react";

export const BusSearchList = ({
  buses = [],
  routes = [],
  selectedBusId,
  selectedBus,
  onViewDetails,
  onDeselectBus,
  onSelectBus,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  routeFilter,
  onRouteChange,
}) => {
  // Filter buses based on search, status, and route
  const filteredBuses = buses.filter((bus) => {
    const query = (searchQuery || "").toLowerCase();
    const matchesSearch =
      !query ||
      bus.busNumber.toLowerCase().includes(query) ||
      (bus.assignedDriverName || "").toLowerCase().includes(query) ||
      (bus.plateNumber || "").toLowerCase().includes(query);

    let matchesStatus = true;
    if (statusFilter === "running" || statusFilter === "active") {
      matchesStatus = bus.status === "active" && (bus.speedKmh || 0) > 0;
    } else if (statusFilter === "stopped") {
      matchesStatus = (bus.speedKmh || 0) === 0 && bus.gpsStatus !== "offline";
    } else if (statusFilter === "delayed") {
      matchesStatus = (bus.delayMinutes || 0) > 5;
    } else if (statusFilter === "offline") {
      matchesStatus = bus.gpsStatus === "offline" || bus.status === "inactive";
    }

    const matchesRoute = routeFilter === "all" || bus.routeId === routeFilter;

    return matchesSearch && matchesStatus && matchesRoute;
  });

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col h-full shadow-lg">
      {/* Active Tracked Bus Indicator Strip */}
      {selectedBus && (
        <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-xl p-2.5 flex items-center justify-between gap-2 text-xs mb-3 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="text-slate-300 font-medium truncate">
              Tracking <strong className="text-white">{selectedBus.busNumber}</strong>
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {onViewDetails && (
              <button
                type="button"
                onClick={onViewDetails}
                className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-[11px] transition-colors cursor-pointer"
              >
                View Details
              </button>
            )}
            {onDeselectBus && (
              <button
                type="button"
                onClick={onDeselectBus}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Deselect bus"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Search Input & Filter Controls */}
      <div className="space-y-3 pb-3 border-b border-slate-800">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search bus #, driver, plate..."
            className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 focus:border-indigo-500/60 rounded-xl text-xs text-white placeholder-slate-500 outline-none transition-colors"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
            className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 focus:border-indigo-500/60 rounded-xl text-xs text-slate-300 outline-none cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="running">Running (&gt;0 km/h)</option>
            <option value="stopped">Stopped</option>
            <option value="delayed">Delayed (&gt;5m)</option>
            <option value="offline">Offline</option>
          </select>

          {/* Route Filter */}
          <select
            value={routeFilter}
            onChange={(e) => onRouteChange(e.target.value)}
            className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 focus:border-indigo-500/60 rounded-xl text-xs text-slate-300 outline-none cursor-pointer"
          >
            <option value="all">All Routes</option>
            {routes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.code} - {r.name.split("-")[1]?.trim() || r.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Bus List */}
      <div className="flex-1 overflow-y-auto space-y-2 pt-3 pr-1">
        {filteredBuses.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs">
            No buses match the filters.
          </div>
        ) : (
          filteredBuses.map((bus) => {
            const isSelected = bus.id === selectedBusId;
            const isDelayed = (bus.delayMinutes || 0) > 5;
            const isOffline = bus.gpsStatus === "offline";
            const isStopped = (bus.speedKmh || 0) === 0;

            let badgeColor = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
            let statusText = `${bus.speedKmh || 0} km/h`;
            if (isOffline) {
              badgeColor = "bg-slate-500/10 text-slate-400 border-slate-500/20";
              statusText = "Offline";
            } else if (isDelayed) {
              badgeColor = "bg-amber-500/10 text-amber-400 border-amber-500/20";
              statusText = `+${bus.delayMinutes}m delay`;
            } else if (isStopped) {
              badgeColor = "bg-rose-500/10 text-rose-400 border-rose-500/20";
              statusText = "Stopped";
            }

            return (
              <div
                key={bus.id}
                onClick={() => onSelectBus(bus)}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 group ${
                  isSelected
                    ? "bg-indigo-600/20 border-indigo-500/60 shadow-md ring-1 ring-indigo-500/30"
                    : "bg-slate-950/60 hover:bg-slate-950/90 border-slate-800/80 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isSelected
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                        : "bg-slate-800 text-slate-300 group-hover:text-indigo-400"
                    }`}
                  >
                    <Bus className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-xs text-white">
                        {bus.busNumber}
                      </span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 font-bold">
                        {bus.id}
                      </span>
                      <span className="text-[10px] text-slate-500 truncate">
                        {bus.plateNumber}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate">
                      {bus.assignedDriverName || "Unassigned"}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border ${badgeColor}`}
                  >
                    {statusText}
                  </span>
                  <span className="block text-[10px] text-slate-400 mt-0.5">
                    {bus.speedKmh > 0 ? `${bus.speedKmh} km/h` : "Idle"}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
        <span>Showing {filteredBuses.length} of {buses.length} buses</span>
        <span className="text-indigo-400 font-medium">Click to track</span>
      </div>
    </div>
  );
};
