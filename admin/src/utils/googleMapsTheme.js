// Google Maps Dark Theme Styling for UniTrack Enterprise Fleet
export const GOOGLE_MAPS_DARK_THEME = [
  { elementType: "geometry", stylers: [{ color: "#0b0f19" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0b0f19" }, { weight: 3 }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#94a3b8" }] },
  {
    featureType: "administrative",
    elementType: "geometry",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "administrative.country",
    elementType: "geometry.stroke",
    stylers: [{ color: "#334155" }],
  },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#e2e8f0" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#64748b" }],
  },
  {
    featureType: "poi",
    elementType: "geometry",
    stylers: [{ color: "#111827" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#132128" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#1e293b" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#0f172a" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#334155" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1e293b" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#cbd5e1" }],
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#1e293b" }],
  },
  {
    featureType: "transit.station",
    elementType: "labels.text.fill",
    stylers: [{ color: "#38bdf8" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#030712" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#475569" }],
  },
];

/**
 * Creates custom SVG data URL for a live bus marker with heading rotation,
 * status coloring, bus number badge, and optional selection halo.
 */
export function createBusMarkerIcon(bus, isSelected = false) {
  const isDelayed = (bus.delayMinutes || 0) > 5;
  const isStopped = bus.speedKmh === 0 || bus.status === "stopped";
  const isOffline = bus.gpsStatus === "offline";

  let primaryColor = "#3b82f6"; // Blue default
  let glowColor = "rgba(59, 130, 246, 0.4)";
  if (isOffline) {
    primaryColor = "#64748b";
    glowColor = "rgba(100, 116, 139, 0.3)";
  } else if (isDelayed) {
    primaryColor = "#f59e0b"; // Amber
    glowColor = "rgba(245, 158, 11, 0.45)";
  } else if (isStopped) {
    primaryColor = "#ef4444"; // Red
    glowColor = "rgba(239, 68, 68, 0.4)";
  } else {
    primaryColor = "#10b981"; // Emerald
    glowColor = "rgba(16, 185, 129, 0.45)";
  }

  const busNumberText = bus.busNumber || "Bus";
  const rotation = bus.headingDeg || 0;

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000" flood-opacity="0.6"/>
        </filter>
        ${
          isSelected
            ? `<filter id="halo" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="4" result="blur"/>
                <feComposite in="SourceGraphic" in2="blur" operator="over"/>
              </filter>`
            : ""
        }
      </defs>

      ${
        isSelected
          ? `<circle cx="32" cy="28" r="22" fill="none" stroke="${primaryColor}" stroke-width="3" stroke-dasharray="4 2" opacity="0.8">
               <animateTransform attributeName="transform" type="rotate" from="0 32 28" to="360 32 28" dur="4s" repeatCount="indefinite"/>
             </circle>
             <circle cx="32" cy="28" r="18" fill="${glowColor}"/>`
          : ""
      }

      <!-- Marker base circle -->
      <g filter="url(#shadow)">
        <circle cx="32" cy="28" r="16" fill="#0f172a" stroke="${primaryColor}" stroke-width="${isSelected ? "3" : "2"}"/>
        
        <!-- Rotatable direction arrow / bus symbol -->
        <g transform="rotate(${rotation} 32 28)">
          <!-- Heading pointer triangle -->
          <polygon points="32,14 36,20 28,20" fill="${primaryColor}"/>
          <!-- Bus body -->
          <rect x="25" y="21" width="14" height="13" rx="2.5" fill="${primaryColor}"/>
          <rect x="26.5" y="22.5" width="11" height="4" rx="1" fill="#0f172a"/>
          <!-- Headlights -->
          <circle cx="27" cy="32" r="1" fill="#fef08a"/>
          <circle cx="37" cy="32" r="1" fill="#fef08a"/>
        </g>
      </g>

      <!-- Bus Number Badge Pill Below Marker -->
      <g filter="url(#shadow)">
        <rect x="10" y="47" width="44" height="15" rx="7.5" fill="#020617" stroke="${primaryColor}" stroke-width="1.5"/>
        <text x="32" y="58" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="9" font-weight="700" fill="#ffffff" text-anchor="middle">
          ${busNumberText}
        </text>
      </g>
    </svg>
  `;

  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: { width: 64, height: 64 },
    anchor: { x: 32, y: 28 },
  };
}

/**
 * Creates custom SVG stop icon along the route:
 * - 'covered': Green checkmark
 * - 'next': Glowing amber/emerald with pulse ring
 * - 'upcoming': Slate/indigo route pin
 */
export function createStopMarkerIcon(status = "upcoming", stopIndex = 1) {
  let fillColor = "#6366f1";
  let strokeColor = "#a5b4fc";
  let content = `<text x="16" y="20" font-family="sans-serif" font-size="10" font-weight="bold" fill="#ffffff" text-anchor="middle">${stopIndex}</text>`;

  if (status === "covered") {
    fillColor = "#10b981";
    strokeColor = "#34d399";
    content = `<path d="M11 16 L14 19 L21 12" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`;
  } else if (status === "next") {
    fillColor = "#f59e0b";
    strokeColor = "#fbbf24";
    content = `<circle cx="16" cy="16" r="4.5" fill="#ffffff"/>`;
  }

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
      <defs>
        <filter id="stopShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1.5" stdDeviation="2" flood-color="#000" flood-opacity="0.6"/>
        </filter>
      </defs>
      ${
        status === "next"
          ? `<circle cx="16" cy="16" r="14" fill="none" stroke="${strokeColor}" stroke-width="2" opacity="0.6">
               <animate attributeName="r" values="10;15;10" dur="2s" repeatCount="indefinite"/>
               <animate attributeName="opacity" values="0.8;0.2;0.8" dur="2s" repeatCount="indefinite"/>
             </circle>`
          : ""
      }
      <g filter="url(#stopShadow)">
        <circle cx="16" cy="16" r="10" fill="${fillColor}" stroke="#ffffff" stroke-width="2"/>
        ${content}
      </g>
    </svg>
  `;

  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: { width: 32, height: 32 },
    anchor: { x: 16, y: 16 },
  };
}
