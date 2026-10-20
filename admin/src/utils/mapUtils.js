import L from "leaflet";

export const DEFAULT_MAP_CENTER = {
  lat: 12.9716,
  lng: 77.5946,
};

/**
 * Creates custom interactive DivIcon for buses with heading direction,
 * bus number label, and status-colored radar pulse (Zomato/Swiggy style smooth rider).
 */
export const createBusIcon = (bus, isSelected = false) => {
  const isStale = bus.gpsStatus === "stale";
  const isOffline = bus.gpsStatus === "offline" || bus.status === "out_of_service";
  const isEmergency = bus.delayMinutes > 10;

  let bgClass = "bg-blue-600 border-blue-400";
  let pulseClass = "animate-ping bg-blue-500 opacity-60";
  let glowColor = "rgba(59, 130, 246, 0.5)";

  if (isOffline) {
    bgClass = "bg-slate-600 border-slate-500";
    pulseClass = "hidden";
    glowColor = "transparent";
  } else if (isStale) {
    bgClass = "bg-amber-600 border-amber-400";
    pulseClass = "animate-pulse bg-amber-500 opacity-50";
    glowColor = "rgba(245, 158, 11, 0.4)";
  } else if (isEmergency) {
    bgClass = "bg-rose-600 border-rose-400";
    pulseClass = "animate-ping bg-rose-500 opacity-75";
    glowColor = "rgba(244, 63, 94, 0.6)";
  } else {
    bgClass = "bg-emerald-600 border-emerald-400";
    pulseClass = "animate-ping bg-emerald-500 opacity-60";
    glowColor = "rgba(16, 185, 129, 0.5)";
  }

  const heading = Math.round(bus.headingDeg || 0);
  const selectionRing = isSelected
    ? "ring-4 ring-cyan-400 ring-offset-2 ring-offset-slate-900 scale-125 z-50"
    : "";

  const html = `
    <div class="relative flex items-center justify-center transition-all duration-200 ${selectionRing}">
      <!-- Radar Pulse Ring (Swiggy / Zomato style rider halo) -->
      <span class="absolute -inset-2 rounded-full ${pulseClass}"></span>
      <span class="absolute -inset-4 rounded-full bg-indigo-500/10 pointer-events-none"></span>

      <!-- Vehicle Body with Street Direction Arrow -->
      <div 
        style="box-shadow: 0 0 16px ${glowColor};"
        class="relative flex items-center justify-center w-11 h-11 rounded-full border-2 text-white shadow-2xl transition-transform duration-200 ${bgClass}"
      >
        <!-- Directional Pointer Chevron rotating with road heading -->
        <div style="transform: rotate(${heading}deg);" class="absolute inset-0 flex items-start justify-center pt-1 transition-transform duration-150 ease-out">
          <div class="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[7px] border-b-white drop-shadow"></div>
        </div>

        <!-- Bus Graphic -->
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h8m-8 4h8m-6 4h4M4 6a2 2 0 012-2h12a2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM6 19v2m12-2v2" />
        </svg>
      </div>

      <!-- Bus Badge Label with Speed -->
      <div class="absolute -bottom-6 whitespace-nowrap px-1.5 py-0.5 rounded-md text-[9px] font-extrabold bg-slate-950/95 text-white border border-slate-700 shadow-xl flex items-center gap-1">
        <span>${bus.busNumber}</span>
        ${bus.speedKmh ? `<span class="text-emerald-400 font-mono">${bus.speedKmh}k</span>` : ""}
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: "bus-custom-marker transition-all duration-150",
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -24],
  });
};

/**
 * Creates custom interactive DivIcon for University Campus Terminal (Start & End Anchor).
 */
export const createUniversityIcon = (isStart = true) => {
  const html = `
    <div class="relative flex flex-col items-center group cursor-pointer z-40">
      <div class="absolute -inset-1 rounded-full bg-amber-400/40 animate-ping"></div>
      <div class="relative w-9 h-9 rounded-2xl bg-amber-500 border-2 border-white text-slate-950 flex items-center justify-center font-black text-xs shadow-2xl shadow-amber-500/50">
        🏛️
      </div>
      <div class="absolute -bottom-5 whitespace-nowrap px-2 py-0.5 bg-amber-950/95 text-amber-200 border border-amber-500/60 rounded-md text-[9px] font-bold shadow-lg">
        University Campus (Terminal)
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: "university-marker",
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
  });
};

/**
 * Creates custom interactive DivIcon for route stops with sequential badge.
 */
export const createStopIcon = (stop, sequenceNumber = null) => {
  const isUniv = stop.code === "S-001" || stop.name?.toLowerCase().includes("university");
  if (isUniv) return createUniversityIcon();

  const badge = sequenceNumber !== null ? sequenceNumber : "●";
  const html = `
    <div class="relative flex flex-col items-center group cursor-pointer">
      <div class="w-7 h-7 rounded-full bg-slate-900 text-indigo-300 border-2 border-indigo-400 flex items-center justify-center font-bold text-xs shadow-lg transform transition-transform group-hover:scale-125">
        ${badge}
      </div>
      <div class="hidden group-hover:block absolute -top-7 whitespace-nowrap px-2 py-0.5 bg-slate-950 text-slate-100 text-[10px] font-medium rounded border border-slate-800 shadow-xl z-50">
        ${stop.name}
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: "stop-custom-marker",
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
  });
};

/**
 * Creates custom interactive DivIcon for pinned street waypoints in Route Builder.
 */
export const createPinWaypointIcon = (index, total) => {
  const html = `
    <div class="relative flex flex-col items-center group cursor-pointer">
      <div class="w-6 h-6 rounded-full bg-indigo-600 text-white border-2 border-white flex items-center justify-center font-bold text-[10px] shadow-lg group-hover:scale-125 transition-transform">
        ${index + 1}
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: "waypoint-pin-marker",
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -14],
  });
};
