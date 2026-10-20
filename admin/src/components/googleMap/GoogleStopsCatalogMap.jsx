import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Layers,
  Crosshair,
  ZoomIn,
  ZoomOut,
  MapPin,
  Clock,
  Compass,
} from "lucide-react";
import { GOOGLE_MAPS_DARK_THEME } from "../../utils/googleMapsTheme";
import { UNIVERSITY_LOCATION } from "../../services/routeService";
import { DEFAULT_MAP_CENTER } from "../../utils/mapUtils";

export const GoogleStopsCatalogMap = ({
  stops = [],
  onEditStop,
  isLoaded = false,
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const infoWindowRef = useRef(null);
  const markersRef = useRef([]);
  const circlesRef = useRef([]);

  const [mapType, setMapType] = useState("roadmap");

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

  // Initialize Map
  useEffect(() => {
    if (!isLoaded || !mapContainerRef.current || !window.google?.maps) return;

    if (!mapInstanceRef.current) {
      const initialCenter = {
        lat: UNIVERSITY_LOCATION.lat || DEFAULT_MAP_CENTER.lat,
        lng: UNIVERSITY_LOCATION.lng || DEFAULT_MAP_CENTER.lng,
      };

      const map = new window.google.maps.Map(mapContainerRef.current, {
        center: initialCenter,
        zoom: 13,
        styles: GOOGLE_MAPS_DARK_THEME,
        mapTypeId: window.google.maps.MapTypeId.ROADMAP,
        disableDefaultUI: true,
        gestureHandling: "greedy",
      });

      infoWindowRef.current = new window.google.maps.InfoWindow();
      mapInstanceRef.current = map;
    }
  }, [isLoaded]);

  // Handle map type changes
  useEffect(() => {
    if (!mapInstanceRef.current || !window.google?.maps) return;
    mapInstanceRef.current.setMapTypeId(
      mapType === "hybrid"
        ? window.google.maps.MapTypeId.HYBRID
        : window.google.maps.MapTypeId.ROADMAP
    );
  }, [mapType]);

  // Render stops markers & geofence preview circles
  useEffect(() => {
    if (!isLoaded || !mapInstanceRef.current || !window.google?.maps) return;
    const map = mapInstanceRef.current;
    const infoWindow = infoWindowRef.current;

    // Clear old elements
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
    circlesRef.current.forEach((c) => c.setMap(null));
    circlesRef.current = [];

    const bounds = new window.google.maps.LatLngBounds();
    let hasCoords = false;

    // 1. University Terminal
    const univPos = new window.google.maps.LatLng(UNIVERSITY_LOCATION.lat, UNIVERSITY_LOCATION.lng);
    bounds.extend(univPos);
    hasCoords = true;

    const univMarker = new window.google.maps.Marker({
      position: univPos,
      map,
      icon: createMarkerIcon({ color: "#f59e0b", text: "🏛", size: 38, isSquare: true }),
      title: "Apex University Central Terminal (Base Hub)",
      zIndex: 100,
    });

    univMarker.addListener("click", () => {
      if (infoWindow) {
        infoWindow.setContent(`
          <div style="font-family:sans-serif;padding:6px;min-width:180px;color:#0f172a;">
            <div style="color:#d97706;font-size:10px;font-weight:700;text-transform:uppercase;">University Main Hub</div>
            <div style="font-size:12px;font-weight:700;margin-top:2px;">${UNIVERSITY_LOCATION.name}</div>
            <div style="font-size:11px;color:#475569;margin-top:2px;">Code: S-001 &bull; Central Campus Terminal</div>
          </div>
        `);
        infoWindow.open(map, univMarker);
      }
    });
    markersRef.current.push(univMarker);

    // 2. Plot all stops
    stops.forEach((stop, idx) => {
      if (!stop.lat || !stop.lng) return;
      const stopPos = new window.google.maps.LatLng(stop.lat, stop.lng);
      bounds.extend(stopPos);
      hasCoords = true;

      const isUniv = stop.code === "S-001" || stop.name?.toLowerCase().includes("university");
      if (isUniv) return; // already rendered as main hub

      const radiusMeters = Number(stop.geofenceRadiusMeters) || 75;

      // Geofence Circle (subtle preview)
      const circle = new window.google.maps.Circle({
        strokeColor: "#818cf8",
        strokeOpacity: 0.6,
        strokeWeight: 1.5,
        fillColor: "#6366f1",
        fillOpacity: 0.12,
        map,
        center: stopPos,
        radius: radiusMeters,
      });
      circlesRef.current.push(circle);

      // Stop Marker
      const stopMarker = new window.google.maps.Marker({
        position: stopPos,
        map,
        icon: createMarkerIcon({ color: "#6366f1", text: String(idx + 1), size: 30 }),
        title: `${stop.name} (${stop.code})`,
        zIndex: 50,
      });

      stopMarker.addListener("click", () => {
        if (infoWindow) {
          const contentDiv = document.createElement("div");
          contentDiv.style.fontFamily = "sans-serif";
          contentDiv.style.padding = "6px";
          contentDiv.style.minWidth = "180px";
          contentDiv.style.color = "#0f172a";

          contentDiv.innerHTML = `
            <div style="font-size:12px;font-weight:700;">${stop.name}</div>
            <div style="font-size:11px;color:#475569;margin-top:2px;">Code: ${stop.code} &bull; ${stop.zone || "Transit Zone"}</div>
            <div style="font-size:11px;color:#4338ca;margin-top:2px;font-weight:600;">Geofence: ${radiusMeters}m radius</div>
            <div style="font-size:11px;color:#059669;font-weight:600;margin-top:4px;">Morning: ${stop.morningTime || "07:30 AM"}</div>
            <div style="font-size:11px;color:#4f46e5;font-weight:600;">Evening: ${stop.eveningTime || "05:30 PM"}</div>
          `;

          const editBtn = document.createElement("button");
          editBtn.innerText = "Edit Stop Details →";
          editBtn.style.marginTop = "8px";
          editBtn.style.padding = "4px 10px";
          editBtn.style.borderRadius = "6px";
          editBtn.style.backgroundColor = "#4f46e5";
          editBtn.style.color = "#ffffff";
          editBtn.style.border = "none";
          editBtn.style.fontSize = "11px";
          editBtn.style.fontWeight = "bold";
          editBtn.style.cursor = "pointer";
          editBtn.onclick = () => {
            onEditStop?.(stop);
            infoWindow.close();
          };

          contentDiv.appendChild(editBtn);
          infoWindow.setContent(contentDiv);
          infoWindow.open(map, stopMarker);
        }
      });

      markersRef.current.push(stopMarker);
    });

    if (hasCoords) {
      map.fitBounds(bounds, { top: 60, right: 60, bottom: 60, left: 60 });
    }

    return () => {
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];
      circlesRef.current.forEach((c) => c.setMap(null));
      circlesRef.current = [];
    };
  }, [stops, isLoaded, createMarkerIcon, onEditStop]);

  const handleZoomIn = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.setZoom(mapInstanceRef.current.getZoom() + 1);
  };

  const handleZoomOut = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.setZoom(mapInstanceRef.current.getZoom() - 1);
  };

  const handleFitBounds = () => {
    if (!mapInstanceRef.current || !window.google?.maps || stops.length === 0) return;
    const bounds = new window.google.maps.LatLngBounds();
    bounds.extend({ lat: UNIVERSITY_LOCATION.lat, lng: UNIVERSITY_LOCATION.lng });
    stops.forEach((s) => {
      if (s.lat && s.lng) bounds.extend({ lat: s.lat, lng: s.lng });
    });
    mapInstanceRef.current.fitBounds(bounds, { top: 60, right: 60, bottom: 60, left: 60 });
  };

  return (
    <div className="relative w-full h-[620px] rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl">
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Floating Toolbar Controls */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-800 shadow-xl">
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

        <button
          type="button"
          onClick={handleFitBounds}
          title="Fit All Stops in View"
          className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-medium"
        >
          <Crosshair className="w-4 h-4 text-emerald-400" />
          <span className="hidden sm:inline">Fit All Stops</span>
        </button>
      </div>

      {/* Floating Status Banner */}
      <div className="absolute top-4 right-4 z-20 bg-slate-900/90 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-slate-800 shadow-xl text-xs text-slate-300 flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
        <span>{stops.length} Geofenced Transit Stops</span>
      </div>

      {/* Floating Zoom Controls */}
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
    </div>
  );
};
