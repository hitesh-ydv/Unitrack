import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  Layers,
  Crosshair,
  LocateFixed,
  Key,
  AlertCircle,
  ExternalLink,
  Bus,
  CheckCircle2,
  MapPin,
  X,
} from "lucide-react";
import {
  GOOGLE_MAPS_DARK_THEME,
  createBusMarkerIcon,
  createStopMarkerIcon,
} from "../../utils/googleMapsTheme";
import { computeRouteStopProgress } from "../../utils/routeProgress";
import { DEFAULT_MAP_CENTER } from "../../utils/mapUtils";

export const GoogleFleetMap = ({
  buses = [],
  routes = [],
  allStops = [],
  selectedBus,
  onSelectBus,
  isFollowingBus,
  onToggleFollow,
  isLoaded,
  loadError,
  apiKey,
  onUpdateApiKey,
  isMapExpanded,
  onToggleExpandMap,
  onOpenDetails,
  onDeselectBus,
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef(new Map());
  const polylinesRef = useRef([]); // [glowPolyline, mainPolyline]
  const stopMarkersRef = useRef([]);
  const infoWindowRef = useRef(null);

  const [mapType, setMapType] = useState("roadmap"); // 'roadmap' | 'hybrid'
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [tempKeyInput, setTempKeyInput] = useState(apiKey || "");

  // Initialize Google Map instance once JS API is ready
  useEffect(() => {
    if (!isLoaded || !mapContainerRef.current || !window.google?.maps) return;

    if (!mapInstanceRef.current) {
      const initialCenter = {
        lat: DEFAULT_MAP_CENTER.lat,
        lng: DEFAULT_MAP_CENTER.lng,
      };

      const map = new window.google.maps.Map(mapContainerRef.current, {
        center: initialCenter,
        zoom: 14,
        styles: GOOGLE_MAPS_DARK_THEME,
        mapTypeId: window.google.maps.MapTypeId.ROADMAP,
        disableDefaultUI: true, // We provide modern custom UI controls
        zoomControl: false,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        gestureHandling: "greedy",
      });

      infoWindowRef.current = new window.google.maps.InfoWindow();
      mapInstanceRef.current = map;
    }
  }, [isLoaded]);

  // Handle map type changes (Roadmap vs Satellite)
  useEffect(() => {
    if (!mapInstanceRef.current || !window.google?.maps) return;
    mapInstanceRef.current.setMapTypeId(
      mapType === "hybrid"
        ? window.google.maps.MapTypeId.HYBRID
        : window.google.maps.MapTypeId.ROADMAP
    );
  }, [mapType]);

  // Trigger Google Maps resize when map container width toggles
  useEffect(() => {
    if (!mapInstanceRef.current || !window.google?.maps) return;
    const timer = setTimeout(() => {
      window.google.maps.event.trigger(mapInstanceRef.current, "resize");
      if (selectedBus?.currentLat && selectedBus?.currentLng) {
        mapInstanceRef.current.panTo({
          lat: selectedBus.currentLat,
          lng: selectedBus.currentLng,
        });
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [isMapExpanded, selectedBus?.currentLat, selectedBus?.currentLng]);

  // Update live bus markers smoothly on 60 FPS GPS telemetry ticks
  useEffect(() => {
    if (!isLoaded || !mapInstanceRef.current || !window.google?.maps) return;
    const map = mapInstanceRef.current;
    const currentMarkers = markersRef.current;
    const activeBusIds = new Set();

    buses.forEach((bus) => {
      if (!bus.currentLat || !bus.currentLng) return;
      activeBusIds.add(bus.id);

      const isSelected = selectedBus?.id === bus.id;
      const latLng = new window.google.maps.LatLng(bus.currentLat, bus.currentLng);
      const icon = createBusMarkerIcon(bus, isSelected);

      let marker = currentMarkers.get(bus.id);
      if (!marker) {
        // Create new marker
        marker = new window.google.maps.Marker({
          position: latLng,
          map,
          icon,
          title: `${bus.busNumber} (${bus.speedKmh || 0} km/h)`,
          zIndex: isSelected ? 1000 : 100,
          optimized: false,
        });

        marker.addListener("click", () => {
          onSelectBus(bus);
        });

        currentMarkers.set(bus.id, marker);
      } else {
        // Smoothly update existing marker position & icon
        marker.setPosition(latLng);
        marker.setIcon(icon);
        marker.setZIndex(isSelected ? 1000 : 100);
      }
    });

    // Clean up markers for removed buses
    for (const [busId, marker] of currentMarkers.entries()) {
      if (!activeBusIds.has(busId)) {
        marker.setMap(null);
        currentMarkers.delete(busId);
      }
    }
  }, [buses, selectedBus?.id, isLoaded, onSelectBus]);

  // Smooth camera following when a bus is selected
  useEffect(() => {
    if (!mapInstanceRef.current || !isFollowingBus || !selectedBus) return;
    if (selectedBus.currentLat && selectedBus.currentLng) {
      mapInstanceRef.current.panTo({
        lat: selectedBus.currentLat,
        lng: selectedBus.currentLng,
      });
    }
  }, [selectedBus?.currentLat, selectedBus?.currentLng, isFollowingBus, selectedBus?.id]);

  // Clear previous route polylines & stop markers
  const clearRouteElements = useCallback(() => {
    polylinesRef.current.forEach((p) => p.setMap(null));
    polylinesRef.current = [];

    stopMarkersRef.current.forEach((m) => m.setMap(null));
    stopMarkersRef.current = [];
  }, []);

  // Draw selected bus route and stops (hidden when no bus is selected)
  useEffect(() => {
    if (!isLoaded || !mapInstanceRef.current || !window.google?.maps) return;
    const map = mapInstanceRef.current;

    clearRouteElements();

    if (!selectedBus) return;

    // Find the assigned route
    const route = routes.find((r) => r.id === selectedBus.routeId);
    if (!route || !Array.isArray(route.waypoints) || route.waypoints.length < 2) {
      return;
    }

    const routeColor = route.color || "#3b82f6";
    const pathCoords = route.waypoints.map(
      ([lat, lng]) => new window.google.maps.LatLng(lat, lng)
    );

    // 1. Glowing outer path
    const glowPolyline = new window.google.maps.Polyline({
      path: pathCoords,
      geodesic: true,
      strokeColor: routeColor,
      strokeOpacity: 0.25,
      strokeWeight: 10,
      map,
      zIndex: 5,
    });

    // 2. Main crisp route line
    const mainPolyline = new window.google.maps.Polyline({
      path: pathCoords,
      geodesic: true,
      strokeColor: routeColor,
      strokeOpacity: 0.9,
      strokeWeight: 4,
      map,
      zIndex: 10,
    });

    polylinesRef.current = [glowPolyline, mainPolyline];

    // 3. Render assigned stops with progression status
    const progress = computeRouteStopProgress(selectedBus, route, allStops);
    const newStopMarkers = [];

    progress.orderedStops.forEach((stop, idx) => {
      const stopLatLng = new window.google.maps.LatLng(stop.lat, stop.lng);
      const stopIcon = createStopMarkerIcon(stop.status, idx + 1);

      const stopMarker = new window.google.maps.Marker({
        position: stopLatLng,
        map,
        icon: stopIcon,
        title: `${stop.name} (${stop.status})`,
        zIndex: stop.status === "next" ? 80 : 50,
      });

      stopMarker.addListener("click", () => {
        if (infoWindowRef.current) {
          const statusText =
            stop.status === "covered"
              ? "<span style='color:#10b981;font-weight:600;'>&#10003; Covered</span>"
              : stop.status === "next"
              ? `<span style='color:#f59e0b;font-weight:600;'>&#9679; Next Stop (~${progress.etaMinutes}m ETA)</span>`
              : "<span style='color:#94a3b8;'>Upcoming Stop</span>";

          infoWindowRef.current.setContent(`
            <div style="font-family:sans-serif;padding:6px;min-width:160px;color:#0f172a;">
              <div style="font-size:12px;font-weight:700;">${stop.name}</div>
              <div style="font-size:11px;color:#475569;margin-top:2px;">Code: ${stop.code || "S-00"} &bull; Stop #${idx + 1}</div>
              <div style="font-size:11px;margin-top:4px;">${statusText}</div>
            </div>
          `);
          infoWindowRef.current.open(map, stopMarker);
        }
      });

      newStopMarkers.push(stopMarker);
    });

    stopMarkersRef.current = newStopMarkers;

    return () => {
      clearRouteElements();
    };
  }, [selectedBus, routes, allStops, isLoaded, clearRouteElements]);

  // Fit bounds to all buses ("Locate All Buses")
  const handleLocateAllBuses = () => {
    if (!mapInstanceRef.current || !window.google?.maps || buses.length === 0) return;
    const bounds = new window.google.maps.LatLngBounds();
    let hasCoords = false;

    buses.forEach((b) => {
      if (b.currentLat && b.currentLng) {
        bounds.extend({ lat: b.currentLat, lng: b.currentLng });
        hasCoords = true;
      }
    });

    if (hasCoords) {
      mapInstanceRef.current.fitBounds(bounds, {
        top: 60,
        right: 60,
        bottom: 60,
        left: 60,
      });
    }
  };

  const handleZoomIn = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.setZoom(mapInstanceRef.current.getZoom() + 1);
  };

  const handleZoomOut = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.setZoom(mapInstanceRef.current.getZoom() - 1);
  };

  const handleSaveApiKey = (e) => {
    e.preventDefault();
    onUpdateApiKey(tempKeyInput);
    setShowKeyModal(false);
  };

  return (
    <div className="relative w-full h-[620px] rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl">
      {/* Google Map Container Element */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Fallback / Setup Banner when Google Maps API key is not ready */}
      {(!isLoaded || loadError) && (
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md z-30 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4 shadow-lg shadow-indigo-600/10">
            <Key className="w-7 h-7" />
          </div>

          <h3 className="text-lg font-bold text-white mb-1.5">
            Google Maps JavaScript API Integration
          </h3>
          <p className="text-xs text-slate-400 max-w-md mb-5 leading-relaxed">
            Enter your Google Maps API Key to render live vector maps with satellite views,
            Directions API routes, and real-time transit telemetry.
          </p>

          <form onSubmit={handleSaveApiKey} className="w-full max-w-md space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={tempKeyInput}
                onChange={(e) => setTempKeyInput(e.target.value)}
                placeholder="AIzaSy... (Paste Google Maps API Key)"
                className="flex-1 px-3.5 py-2.5 bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-xl text-xs text-white placeholder-slate-500 outline-none font-mono"
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors shadow-md shadow-indigo-600/30 cursor-pointer"
              >
                Connect
              </button>
            </div>
            <p className="text-[11px] text-slate-500 text-left">
              Key is stored securely in environment / local browser storage and never leaked.
            </p>
          </form>

          {loadError && (
            <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2 max-w-md text-left">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{loadError}</span>
            </div>
          )}
        </div>
      )}

      {/* Floating Map Controls Toolbar */}
      {isLoaded && (
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-800 shadow-xl">
          {/* Roadmap / Satellite Toggle */}
          <button
            type="button"
            onClick={() => setMapType((prev) => (prev === "roadmap" ? "hybrid" : "roadmap"))}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
              mapType === "hybrid"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-300 hover:text-white hover:bg-slate-800/80"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{mapType === "hybrid" ? "Satellite" : "Roadmap"}</span>
          </button>

          <div className="w-px h-5 bg-slate-800" />

          {/* Locate All Buses */}
          <button
            type="button"
            onClick={handleLocateAllBuses}
            title="Fit bounds to view entire fleet"
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-medium"
          >
            <Crosshair className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Fit All Buses</span>
          </button>

          {/* Follow Selected Bus Lock */}
          {selectedBus && (
            <>
              <div className="w-px h-5 bg-slate-800" />
              <button
                type="button"
                onClick={onToggleFollow}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                  isFollowingBus
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <LocateFixed className="w-3.5 h-3.5" />
                <span>{isFollowingBus ? "Camera Locked" : "Free Camera"}</span>
              </button>
            </>
          )}

          {/* API Key Modal Toggle */}
          <div className="w-px h-5 bg-slate-800" />
          <button
            type="button"
            onClick={() => setShowKeyModal(true)}
            title="Configure Google Maps API Key"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
          >
            <Key className="w-3.5 h-3.5" />
          </button>

          {/* Full Map / Split View Toggle */}
          {onToggleExpandMap && (
            <>
              <div className="w-px h-5 bg-slate-800" />
              <button
                type="button"
                onClick={onToggleExpandMap}
                title={isMapExpanded ? "Restore Split View (Show Fleet List)" : "Expand Map to Full Width"}
                className={`px-2.5 py-1.5 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold ${
                  isMapExpanded
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-300 hover:text-white hover:bg-slate-800/80"
                }`}
              >
                {isMapExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{isMapExpanded ? "Split View" : "Full Map"}</span>
              </button>
            </>
          )}
        </div>
      )}

      {/* Mini Status Pill for Tracked Bus (Bottom Left, Non-blocking) */}
      {isLoaded && selectedBus && (
        <div className="absolute bottom-5 left-5 z-20 flex items-center gap-2.5 bg-slate-900/95 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-slate-800 shadow-2xl text-xs max-w-[calc(100%-8rem)]">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="font-bold text-white tracking-tight shrink-0">
              {selectedBus.busNumber}
            </span>
            <span className="text-slate-600">&bull;</span>
            <span className="text-emerald-400 font-semibold shrink-0">
              {selectedBus.speedKmh || 0} km/h
            </span>
            {selectedBus.nextStopName && (
              <>
                <span className="text-slate-600 hidden sm:inline">&bull;</span>
                <span className="text-slate-400 truncate hidden sm:inline">
                  Next: <strong className="text-slate-200">{selectedBus.nextStopName}</strong>
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0 pl-1 border-l border-slate-800">
            {onOpenDetails && (
              <button
                type="button"
                onClick={onOpenDetails}
                className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-[11px] transition-colors cursor-pointer"
              >
                Details
              </button>
            )}
            {onDeselectBus && (
              <button
                type="button"
                onClick={onDeselectBus}
                title="Deselect bus"
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Floating Zoom Controls (Bottom Right) */}
      {isLoaded && (
        <div className="absolute bottom-5 right-5 z-20 flex flex-col gap-1.5 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-800 shadow-xl">
          <button
            type="button"
            onClick={handleZoomIn}
            title="Zoom In"
            className="p-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <div className="w-full h-px bg-slate-800" />
          <button
            type="button"
            onClick={handleZoomOut}
            title="Zoom Out"
            className="p-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* API Key Configuration Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Key className="w-4 h-4 text-indigo-400" />
              <span>Google Maps JavaScript API Key</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Provide a Google Maps JavaScript API key with <code>Maps JavaScript API</code>,{" "}
              <code>Places API</code>, and <code>Directions API</code> enabled.
            </p>

            <form onSubmit={handleSaveApiKey} className="space-y-3">
              <input
                type="text"
                value={tempKeyInput}
                onChange={(e) => setTempKeyInput(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-xl text-xs text-white placeholder-slate-500 outline-none font-mono"
              />
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowKeyModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md transition-colors cursor-pointer"
                >
                  Save & Reload Map
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
