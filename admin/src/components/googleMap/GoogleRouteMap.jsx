import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Layers,
  Crosshair,
  ZoomIn,
  ZoomOut,
  Key,
  Compass,
  MapPin,
  AlertCircle,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { GOOGLE_MAPS_DARK_THEME } from "../../utils/googleMapsTheme";
import { DEFAULT_MAP_CENTER } from "../../utils/mapUtils";

export const GoogleRouteMap = ({
  sourceStop,
  destinationStop,
  routeStops = [],
  allStops = [],
  roadPolyline = [],
  routeColor = "#3b82f6",
  distanceKm = 14.0,
  estimatedDurationMin = 35,
  streetsTraversed = [],
  isOutAndBack = true,
  onAddStop,
  onRemoveStop,
  isLoaded = false,
  loadError = null,
  apiKey = "",
  onUpdateApiKey,
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const infoWindowRef = useRef(null);

  // Markers references
  const sourceMarkerRef = useRef(null);
  const destMarkerRef = useRef(null);
  const routeMarkersRef = useRef([]);
  const availableMarkersRef = useRef([]);

  // Polyline references
  const glowPolylineRef = useRef(null);
  const mainPolylineRef = useRef(null);

  const [mapType, setMapType] = useState("roadmap"); // 'roadmap' | 'hybrid'
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [tempKeyInput, setTempKeyInput] = useState(apiKey || "");
  // Professional requirement: Display ONLY the currently selected bus route by default
  const [showAllCatalogStops, setShowAllCatalogStops] = useState(false);

  // Create SVG marker icon helper for Google Maps
  const createMarkerIcon = useCallback(({ color, text, size = 32, isSquare = false }) => {
    if (!window.google?.maps) return null;
    const r = size / 2;
    const shape = isSquare
      ? `<rect x="3" y="3" width="${size - 6}" height="${size - 6}" rx="6" fill="${color}" stroke="#ffffff" stroke-width="2"/>`
      : `<circle cx="${r}" cy="${r}" r="${r - 3}" fill="${color}" stroke="#ffffff" stroke-width="2"/>`;

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
        <defs>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1.5" stdDeviation="2" flood-color="#000" flood-opacity="0.6"/>
          </filter>
        </defs>
        <g filter="url(#shadow)">
          ${shape}
          <text x="${r}" y="${r + 4}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="${size * 0.38}" font-weight="bold" fill="#ffffff" text-anchor="middle">
            ${text}
          </text>
        </g>
      </svg>
    `;

    return {
      url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
      scaledSize: new window.google.maps.Size(size, size),
      anchor: new window.google.maps.Point(r, r),
    };
  }, []);

  // 1. Initialize Google Map instance
  useEffect(() => {
    if (!isLoaded || !mapContainerRef.current || !window.google?.maps) return;

    if (!mapInstanceRef.current) {
      const initialCenter = {
        lat: Number(sourceStop?.lat) || Number(destinationStop?.lat) || Number(allStops?.[0]?.lat) || DEFAULT_MAP_CENTER.lat,
        lng: Number(sourceStop?.lng) || Number(destinationStop?.lng) || Number(allStops?.[0]?.lng) || DEFAULT_MAP_CENTER.lng,
      };

      const map = new window.google.maps.Map(mapContainerRef.current, {
        center: initialCenter,
        zoom: 13,
        styles: GOOGLE_MAPS_DARK_THEME,
        mapTypeId: window.google.maps.MapTypeId.ROADMAP,
        disableDefaultUI: true,
        zoomControl: false,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        gestureHandling: "greedy",
      });

      infoWindowRef.current = new window.google.maps.InfoWindow();
      mapInstanceRef.current = map;
    }
  }, [isLoaded, sourceStop?.lat, sourceStop?.lng]);

  // 2. Map type change
  useEffect(() => {
    if (!mapInstanceRef.current || !window.google?.maps) return;
    mapInstanceRef.current.setMapTypeId(
      mapType === "hybrid"
        ? window.google.maps.MapTypeId.HYBRID
        : window.google.maps.MapTypeId.ROADMAP
    );
  }, [mapType]);

  // 3. Clear existing markers and polylines
  const clearMapElements = useCallback(() => {
    if (sourceMarkerRef.current) {
      sourceMarkerRef.current.setMap(null);
      sourceMarkerRef.current = null;
    }
    if (destMarkerRef.current) {
      destMarkerRef.current.setMap(null);
      destMarkerRef.current = null;
    }
    routeMarkersRef.current.forEach((m) => m.setMap(null));
    routeMarkersRef.current = [];

    availableMarkersRef.current.forEach((m) => m.setMap(null));
    availableMarkersRef.current = [];

    if (glowPolylineRef.current) {
      glowPolylineRef.current.setMap(null);
      glowPolylineRef.current = null;
    }
    if (mainPolylineRef.current) {
      mainPolylineRef.current.setMap(null);
      mainPolylineRef.current = null;
    }
  }, []);

  // 4. Render Markers & Polylines on Google Map
  useEffect(() => {
    if (!isLoaded || !mapInstanceRef.current || !window.google?.maps) return;
    const map = mapInstanceRef.current;
    const infoWindow = infoWindowRef.current;

    clearMapElements();

    const bounds = new window.google.maps.LatLngBounds();
    let hasCoords = false;

    // A. Source Marker (Green 'S')
    if (sourceStop?.lat && sourceStop?.lng) {
      const srcPos = new window.google.maps.LatLng(sourceStop.lat, sourceStop.lng);
      bounds.extend(srcPos);
      hasCoords = true;

      const srcMarker = new window.google.maps.Marker({
        position: srcPos,
        map,
        icon: createMarkerIcon({ color: "#10b981", text: "S", size: 36 }),
        title: `Source: ${sourceStop.name}`,
        zIndex: 100,
      });

      srcMarker.addListener("click", () => {
        if (infoWindow) {
          infoWindow.setContent(`
            <div style="font-family:sans-serif;padding:8px;min-width:180px;color:#0f172a;">
              <div style="color:#059669;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Departure Source</div>
              <div style="font-size:13px;font-weight:700;margin-top:2px;">${sourceStop.name}</div>
              <div style="font-size:11px;color:#475569;margin-top:2px;">Code: <strong>${sourceStop.code || "START"}</strong> &bull; ${sourceStop.zone || "Departure Zone"}</div>
              <div style="font-size:11px;color:#059669;font-weight:600;margin-top:4px;">Morning: ${sourceStop.morningTime || "07:30 AM"} &bull; Evening: ${sourceStop.eveningTime || "05:30 PM"}</div>
              <div style="font-size:10px;color:#64748b;margin-top:2px;">Geofence: ${sourceStop.geofenceRadiusMeters || 75}m</div>
            </div>
          `);
          infoWindow.open(map, srcMarker);
        }
      });

      sourceMarkerRef.current = srcMarker;
    }

    // B. Destination Marker (Amber '🏛')
    if (destinationStop?.lat && destinationStop?.lng) {
      const destPos = new window.google.maps.LatLng(destinationStop.lat, destinationStop.lng);
      bounds.extend(destPos);
      hasCoords = true;

      const destMarker = new window.google.maps.Marker({
        position: destPos,
        map,
        icon: createMarkerIcon({ color: "#f59e0b", text: "🏛", size: 36, isSquare: true }),
        title: `University: ${destinationStop.name}`,
        zIndex: 100,
      });

      destMarker.addListener("click", () => {
        if (infoWindow) {
          infoWindow.setContent(`
            <div style="font-family:sans-serif;padding:8px;min-width:180px;color:#0f172a;">
              <div style="color:#d97706;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">University Terminal</div>
              <div style="font-size:13px;font-weight:700;margin-top:2px;">${destinationStop.name}</div>
              <div style="font-size:11px;color:#475569;margin-top:2px;">Code: <strong>${destinationStop.code || "S-001"}</strong> &bull; Campus Central Hub</div>
              <div style="font-size:11px;color:#d97706;font-weight:600;margin-top:4px;">Arrival: ${destinationStop.morningTime || "08:15 AM"} &bull; Evening: ${destinationStop.eveningTime || "06:00 PM"}</div>
              <div style="font-size:10px;color:#64748b;margin-top:2px;">Geofence: ${destinationStop.geofenceRadiusMeters || 100}m</div>
            </div>
          `);
          infoWindow.open(map, destMarker);
        }
      });

      destMarkerRef.current = destMarker;
    }

    // C. Intermediate Route Stops (Numbered Indigo Pins: 1, 2, 3...)
    const newRouteMarkers = [];
    routeStops.forEach((stop, idx) => {
      if (!stop.lat || !stop.lng) return;
      const stopPos = new window.google.maps.LatLng(stop.lat, stop.lng);
      bounds.extend(stopPos);
      hasCoords = true;

      const stopMarker = new window.google.maps.Marker({
        position: stopPos,
        map,
        icon: createMarkerIcon({ color: "#6366f1", text: String(idx + 1), size: 32 }),
        title: `Stop #${idx + 1}: ${stop.name}`,
        zIndex: 80,
      });

      stopMarker.addListener("click", () => {
        if (infoWindow) {
          const contentDiv = document.createElement("div");
          contentDiv.style.fontFamily = "sans-serif";
          contentDiv.style.padding = "8px";
          contentDiv.style.minWidth = "180px";
          contentDiv.style.color = "#0f172a";

          contentDiv.innerHTML = `
            <div style="color:#4f46e5;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Stop #${idx + 1} in Route Itinerary</div>
            <div style="font-size:13px;font-weight:700;margin-top:2px;">${stop.name}</div>
            <div style="font-size:11px;color:#475569;margin-top:2px;">Code: <strong>${stop.code || "S-00"}</strong> &bull; ${stop.zone || "Transit Zone"}</div>
            <div style="font-size:11px;color:#059669;font-weight:600;margin-top:4px;">Morning: ${stop.morningTime || "07:35 AM"} &bull; Evening: ${stop.eveningTime || "05:35 PM"}</div>
            <div style="font-size:10px;color:#64748b;margin-top:2px;">Geofence: ${stop.geofenceRadiusMeters || 75}m</div>
          `;

          const removeBtn = document.createElement("button");
          removeBtn.innerText = "Remove from Sequence ✕";
          removeBtn.style.marginTop = "8px";
          removeBtn.style.padding = "4px 8px";
          removeBtn.style.borderRadius = "6px";
          removeBtn.style.backgroundColor = "#fee2e2";
          removeBtn.style.color = "#dc2626";
          removeBtn.style.border = "none";
          removeBtn.style.fontSize = "10px";
          removeBtn.style.fontWeight = "bold";
          removeBtn.style.cursor = "pointer";
          removeBtn.onclick = () => {
            onRemoveStop?.(stop.id);
            infoWindow.close();
          };

          contentDiv.appendChild(removeBtn);
          infoWindow.setContent(contentDiv);
          infoWindow.open(map, stopMarker);
        }
      });

      newRouteMarkers.push(stopMarker);
    });
    routeMarkersRef.current = newRouteMarkers;

    // D. Available Stops from Stop Management (Rendered ONLY if toggle is turned on)
    const newAvailMarkers = [];
    if (showAllCatalogStops) {
      allStops
        .filter(
          (s) =>
            s.id !== sourceStop?.id &&
            s.id !== destinationStop?.id &&
            !routeStops.some((rs) => rs.id === s.id)
        )
        .forEach((stop) => {
          if (!stop.lat || !stop.lng) return;
          const stopPos = new window.google.maps.LatLng(stop.lat, stop.lng);

          const availMarker = new window.google.maps.Marker({
            position: stopPos,
            map,
            icon: createMarkerIcon({ color: "#475569", text: "•", size: 24 }),
            title: `Available Stop: ${stop.name}`,
            zIndex: 40,
          });

          availMarker.addListener("click", () => {
            if (infoWindow) {
              const contentDiv = document.createElement("div");
              contentDiv.style.fontFamily = "sans-serif";
              contentDiv.style.padding = "8px";
              contentDiv.style.minWidth = "180px";
              contentDiv.style.color = "#0f172a";

              contentDiv.innerHTML = `
                <div style="font-size:12px;font-weight:700;">${stop.name}</div>
                <div style="font-size:11px;color:#475569;margin-top:2px;">${stop.code || "S-00"} &bull; ${stop.zone || "Zone"}</div>
                <div style="font-size:11px;color:#059669;margin-top:3px;">Morning: ${stop.morningTime || "07:30 AM"} &bull; Evening: ${stop.eveningTime || "05:30 PM"}</div>
                <div style="font-size:10px;color:#64748b;margin-top:2px;">Geofence: ${stop.geofenceRadiusMeters || 75}m</div>
              `;

              const addBtn = document.createElement("button");
              addBtn.innerText = "+ Add to Route Sequence";
              addBtn.style.marginTop = "8px";
              addBtn.style.padding = "5px 10px";
              addBtn.style.borderRadius = "6px";
              addBtn.style.backgroundColor = "#4f46e5";
              addBtn.style.color = "#ffffff";
              addBtn.style.border = "none";
              addBtn.style.fontSize = "11px";
              addBtn.style.fontWeight = "bold";
              addBtn.style.cursor = "pointer";
              addBtn.onclick = () => {
                onAddStop?.(stop);
                infoWindow.close();
              };

              contentDiv.appendChild(addBtn);
              infoWindow.setContent(contentDiv);
              infoWindow.open(map, availMarker);
            }
          });

          newAvailMarkers.push(availMarker);
        });
    }
    availableMarkersRef.current = newAvailMarkers;

    // E. Snapped Road Polyline on Google Maps (with seamless fallback to stops path)
    const polylineCoords =
      roadPolyline && roadPolyline.length > 1
        ? roadPolyline
        : sourceStop?.lat && destinationStop?.lat
        ? [
            [Number(sourceStop.lat), Number(sourceStop.lng)],
            ...(routeStops || [])
              .filter((s) => s && s.lat && s.lng)
              .map((s) => [Number(s.lat), Number(s.lng)]),
            [Number(destinationStop.lat), Number(destinationStop.lng)],
            ...(isOutAndBack
              ? [
                  ...(routeStops || [])
                    .filter((s) => s && s.lat && s.lng)
                    .map((s) => [Number(s.lat), Number(s.lng)])
                    .reverse(),
                  [Number(sourceStop.lat), Number(sourceStop.lng)],
                ]
              : []),
          ]
        : [];

    if (polylineCoords && polylineCoords.length > 1) {
      const pathCoords = polylineCoords
        .map((p) => {
          const lat = Array.isArray(p) ? Number(p[0]) : Number(p.lat);
          const lng = Array.isArray(p) ? Number(p[1]) : Number(p.lng);
          if (isNaN(lat) || isNaN(lng)) return null;
          return new window.google.maps.LatLng(lat, lng);
        })
        .filter(Boolean);

      if (pathCoords.length > 1) {
        pathCoords.forEach((pt) => bounds.extend(pt));
        hasCoords = true;

        // 1. Glow outer polyline
        const glowPolyline = new window.google.maps.Polyline({
          path: pathCoords,
          geodesic: true,
          strokeColor: routeColor,
          strokeOpacity: 0.25,
          strokeWeight: 10,
          map,
          zIndex: 10,
        });

        // 2. Main crisp route polyline
        const mainPolyline = new window.google.maps.Polyline({
          path: pathCoords,
          geodesic: true,
          strokeColor: routeColor,
          strokeOpacity: 0.95,
          strokeWeight: 4,
          map,
          zIndex: 20,
        });

        glowPolylineRef.current = glowPolyline;
        mainPolylineRef.current = mainPolyline;
      }
    }

    // Auto-fit bounds if we have coordinates
    if (hasCoords) {
      map.fitBounds(bounds, { top: 60, right: 60, bottom: 60, left: 60 });
    }

    return () => {
      clearMapElements();
    };
  }, [
    sourceStop,
    destinationStop,
    routeStops,
    allStops,
    roadPolyline,
    routeColor,
    isLoaded,
    isOutAndBack,
    showAllCatalogStops,
    clearMapElements,
    createMarkerIcon,
    onAddStop,
    onRemoveStop,
  ]);

  // Handle Zoom In / Out
  const handleZoomIn = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.setZoom(mapInstanceRef.current.getZoom() + 1);
  };

  const handleZoomOut = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.setZoom(mapInstanceRef.current.getZoom() - 1);
  };

  // Fit Route Bounds
  const handleFitRouteBounds = () => {
    if (!mapInstanceRef.current || !window.google?.maps) return;
    const bounds = new window.google.maps.LatLngBounds();
    let hasCoords = false;

    if (sourceStop?.lat && sourceStop?.lng) {
      bounds.extend({ lat: sourceStop.lat, lng: sourceStop.lng });
      hasCoords = true;
    }
    if (destinationStop?.lat && destinationStop?.lng) {
      bounds.extend({ lat: destinationStop.lat, lng: destinationStop.lng });
      hasCoords = true;
    }
    routeStops.forEach((s) => {
      if (s.lat && s.lng) {
        bounds.extend({ lat: s.lat, lng: s.lng });
        hasCoords = true;
      }
    });

    if (hasCoords) {
      mapInstanceRef.current.fitBounds(bounds, { top: 60, right: 60, bottom: 60, left: 60 });
    }
  };

  const handleSaveApiKey = (e) => {
    e.preventDefault();
    onUpdateApiKey?.(tempKeyInput);
    setShowKeyModal(false);
  };

  return (
    <div className="relative w-full h-[620px] rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl flex flex-col">
      {/* Google Map DOM Container */}
      <div ref={mapContainerRef} className="w-full h-full flex-1" />

      {/* Fallback Banner if Google Maps API key is not ready */}
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
            Directions API road paths, and transit corridor building.
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
          </form>

          {loadError && (
            <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2 max-w-md text-left">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{loadError}</span>
            </div>
          )}
        </div>
      )}

      {/* Floating Toolbar Controls */}
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

          {/* Fit Route Bounds */}
          <button
            type="button"
            onClick={handleFitRouteBounds}
            title="Fit Route in View"
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer flex items-center gap-1 text-xs font-medium"
          >
            <Crosshair className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Fit Route</span>
          </button>

          <div className="w-px h-5 bg-slate-800" />

          {/* Isolated Active Route vs Catalog Stops toggle */}
          <button
            type="button"
            onClick={() => setShowAllCatalogStops((prev) => !prev)}
            title={showAllCatalogStops ? "Showing all stops. Click to isolate only this bus route" : "Currently isolating only selected route. Click to show other stops"}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
              !showAllCatalogStops
                ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                : "text-slate-300 hover:text-white hover:bg-slate-800/80"
            }`}
          >
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden md:inline">
              {!showAllCatalogStops ? "Selected Route Only" : "Showing All Stops"}
            </span>
          </button>

          <div className="w-px h-5 bg-slate-800" />

          {/* API Key Modal Button */}
          <button
            type="button"
            onClick={() => setShowKeyModal(true)}
            title="Configure Google Maps API Key"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
          >
            <Key className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Right HUD Pill showing Distance & Time */}
      {isLoaded && (
        <div className="absolute top-4 right-4 z-20 bg-slate-900/90 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-slate-800 shadow-xl text-xs text-slate-200 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>
            Route: <strong className="text-white">{distanceKm} km</strong> &bull; <strong className="text-emerald-400">~{estimatedDurationMin} mins</strong>
          </span>
        </div>
      )}

      {/* Bottom Traversed Roads Strip */}
      {isLoaded && (
        <div className="bg-slate-950/95 border-t border-slate-800 p-2.5 px-4 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2 shrink-0 z-20">
          <div className="flex items-center gap-1.5 min-w-0">
            <Compass className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="truncate">
              Corridor: {streetsTraversed.slice(0, 3).join(" &bull; ")}
              {streetsTraversed.length > 3 ? ` +${streetsTraversed.length - 3} more roads` : ""}
            </span>
          </div>

          <span className="text-[11px] font-mono text-emerald-400 font-semibold shrink-0">
            {isOutAndBack ? "Symmetric Out & Back" : "One-Way Corridor"}
          </span>
        </div>
      )}

      {/* Floating Zoom Controls (Bottom Right) */}
      {isLoaded && (
        <div className="absolute bottom-12 right-5 z-20 flex flex-col gap-1.5 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-800 shadow-xl">
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
              Provide a Google Maps JavaScript API key with <code>Maps JavaScript API</code> and <code>Directions API</code> enabled.
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
