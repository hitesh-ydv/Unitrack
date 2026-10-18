import React, { useState, useEffect, useMemo } from "react";
import {
  Play,
  Pause,
  RefreshCw,
  Navigation,
  Compass,
  AlertTriangle,
  Radio,
  LocateFixed,
  FastForward,
  RotateCcw,
  Bus,
} from "lucide-react";
import { GoogleFleetMap } from "../components/googleMap/GoogleFleetMap";
import { FleetSummaryCards } from "../components/googleMap/FleetSummaryCards";
import { BusSearchList } from "../components/googleMap/BusSearchList";
import { BusInfoPanel } from "../components/googleMap/BusInfoPanel";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { busService } from "../services/busService";
import { routeService } from "../services/routeService";
import { stopService } from "../services/stopService";
import { useFleetSimulation } from "../hooks/useFleetSimulation";
import { useGoogleMapsLoader } from "../hooks/useGoogleMapsLoader";
import { useToast } from "../context/ToastContext";

export const LiveFleetTracking = () => {
  const [initialBuses, setInitialBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [allStops, setAllStops] = useState([]);
  const [selectedBus, setSelectedBus] = useState(null);
  const [isFollowingBus, setIsFollowingBus] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [leftPanelTab, setLeftPanelTab] = useState("list"); // "list" | "details"
  const [isMapExpanded, setIsMapExpanded] = useState(false);

  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [routeFilter, setRouteFilter] = useState("all");

  const toast = useToast();

  // Google Maps JS API dynamic loader
  const { isLoaded, loadError, apiKey, updateApiKey } = useGoogleMapsLoader();

  // Load initial fleet data
  const loadFleetData = async () => {
    try {
      const [busData, routeData, stopData] = await Promise.all([
        busService.getAll(),
        routeService.getAll(),
        stopService.getAll(),
      ]);
      setInitialBuses(busData || []);
      setRoutes(routeData || []);
      setAllStops(stopData || []);
    } catch (err) {
      console.error("Failed to fetch live fleet telemetry:", err);
      toast.error("Telemetry Error", "Failed to fetch live fleet data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFleetData();
  }, []);

  // 60 FPS smooth GPS rider animation (Zomato/Uber tracking style)
  const {
    buses,
    isSimulating,
    toggleSimulation,
    speedMultiplier,
    setSpeedMultiplier,
    triggerSimulatedDelay,
  } = useFleetSimulation(initialBuses, routes, true);

  // Keep selected bus synchronized with continuous 60 FPS position & speed ticks
  useEffect(() => {
    if (selectedBus) {
      const liveBusInstance = buses.find((b) => b.id === selectedBus.id);
      if (liveBusInstance) {
        setSelectedBus(liveBusInstance);
      }
    }
  }, [buses, selectedBus?.id]);

  // Selected route object
  const selectedRoute = useMemo(() => {
    if (!selectedBus) return null;
    return routes.find((r) => r.id === selectedBus.routeId) || null;
  }, [selectedBus, routes]);

  // Select a bus and lock camera
  const handleSelectBus = (bus) => {
    setSelectedBus(bus);
    setIsFollowingBus(true);
    setLeftPanelTab("details");
  };

  // Deselect bus (clears route from map)
  const handleClosePanel = () => {
    setSelectedBus(null);
    setIsFollowingBus(false);
    setLeftPanelTab("list");
  };

  const handleSimulateDelay = () => {
    if (selectedBus) {
      triggerSimulatedDelay(selectedBus.id);
      toast.warning(
        "Traffic Delay Injected",
        `Added +10m traffic delay to ${selectedBus.busNumber}.`
      );
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Connecting to Google Maps & live vehicle telemetry..." />;
  }

  return (
    <div className="space-y-5">
      {/* Page Title & Real-time Simulation Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold text-emerald-400">Google Maps JavaScript API</span>
            <span className="text-xs text-slate-600">&bull;</span>
            <span className="text-xs text-slate-400">Live GPS Heartbeat</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Live Fleet Tracking
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time GPS coordinates, smooth marker interpolation, and route progression monitoring.
          </p>
        </div>

        {/* Live Simulation Engine Bar */}
        <div className="flex items-center gap-2 self-start sm:self-auto bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800 shadow-md">
          {/* Play / Pause Toggle */}
          <button
            type="button"
            onClick={toggleSimulation}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
              isSimulating
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
            }`}
          >
            {isSimulating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isSimulating ? "Live Feed (60 FPS)" : "Paused"}</span>
          </button>

          {/* Speed Multiplier (1x / 2x / 4x) */}
          <div className="flex items-center bg-slate-950 rounded-xl p-0.5 border border-slate-800">
            {[1, 2, 4].map((mult) => (
              <button
                key={mult}
                type="button"
                onClick={() => setSpeedMultiplier(mult)}
                className={`px-2 py-1 text-[11px] font-bold rounded-lg transition-colors cursor-pointer ${
                  speedMultiplier === mult
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {mult}x
              </button>
            ))}
          </div>

          {/* Simulate Traffic Delay Button */}
          {selectedBus && (
            <button
              type="button"
              onClick={handleSimulateDelay}
              title="Simulate a 10m traffic delay on selected bus"
              className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-amber-400 border border-slate-800 transition-colors cursor-pointer"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Refresh Telemetry */}
          <button
            type="button"
            onClick={loadFleetData}
            title="Reload backend telemetry"
            className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Fleet Summary KPI Cards (Total, Active, Stopped, Offline) */}
      <FleetSummaryCards
        buses={buses}
        activeFilter={statusFilter}
        onFilterChange={(filterId) => setStatusFilter(filterId)}
      />

      {/* Main Tracking Arena: Left Panel (Fleet List / Bus Details) + Google Maps (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Searchable Bus List & Route Filters / Selected Bus Details (4 cols) */}
        <div
          className={`${
            isMapExpanded ? "hidden" : "lg:col-span-4"
          } h-[620px] flex flex-col transition-all duration-300`}
        >
          {/* Navigation Tabs when a bus is selected */}
          {selectedBus && (
            <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 mb-3 shrink-0">
              <button
                type="button"
                onClick={() => setLeftPanelTab("list")}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  leftPanelTab === "list"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Bus className="w-3.5 h-3.5" />
                <span>Fleet List ({buses.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setLeftPanelTab("details")}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  leftPanelTab === "details"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span className="truncate">{selectedBus.busNumber} Details</span>
              </button>
            </div>
          )}

          <div className="flex-1 min-h-0">
            {selectedBus && leftPanelTab === "details" ? (
              <BusInfoPanel
                bus={selectedBus}
                route={selectedRoute}
                allStops={allStops}
                onClose={handleClosePanel}
                onBackToList={() => setLeftPanelTab("list")}
                isFollowingBus={isFollowingBus}
                onToggleFollow={() => setIsFollowingBus((prev) => !prev)}
              />
            ) : (
              <BusSearchList
                buses={buses}
                routes={routes}
                selectedBusId={selectedBus?.id}
                selectedBus={selectedBus}
                onViewDetails={() => setLeftPanelTab("details")}
                onDeselectBus={handleClosePanel}
                onSelectBus={handleSelectBus}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                statusFilter={statusFilter}
                onStatusChange={setStatusFilter}
                routeFilter={routeFilter}
                onRouteChange={setRouteFilter}
              />
            )}
          </div>
        </div>

        {/* Right Column: Google Maps Interactive Canvas (8 or 12 cols, 100% unobstructed view) */}
        <div
          className={`${
            isMapExpanded ? "lg:col-span-12" : "lg:col-span-8"
          } relative transition-all duration-300`}
        >
          <GoogleFleetMap
            buses={buses}
            routes={routes}
            allStops={allStops}
            selectedBus={selectedBus}
            onSelectBus={handleSelectBus}
            isFollowingBus={isFollowingBus}
            onToggleFollow={() => setIsFollowingBus((prev) => !prev)}
            isLoaded={isLoaded}
            loadError={loadError}
            apiKey={apiKey}
            onUpdateApiKey={updateApiKey}
            isMapExpanded={isMapExpanded}
            onToggleExpandMap={() => setIsMapExpanded((prev) => !prev)}
            onOpenDetails={() => {
              setIsMapExpanded(false);
              setLeftPanelTab("details");
            }}
            onDeselectBus={handleClosePanel}
          />
        </div>
      </div>
    </div>
  );
};
