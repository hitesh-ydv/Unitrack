import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Search,
  MapPin,
  Compass,
  Crosshair,
  ZoomIn,
  ZoomOut,
  AlertCircle,
  Navigation,
} from "lucide-react";
import { GOOGLE_MAPS_DARK_THEME } from "../../utils/googleMapsTheme";

export const GoogleStopPickerMap = ({
  lat = 12.9750,
  lng = 77.6050,
  radius = 80,
  onLocationChange,
  isLoaded = false,
  apiKey = "",
}) => {
  const mapContainerRef = useRef(null);
  const searchInputRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const circleRef = useRef(null);
  const autocompleteRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [addressNotice, setAddressNotice] = useState("");

  const numLat = Number(lat) || 12.9750;
  const numLng = Number(lng) || 77.6050;
  const numRadius = Number(radius) || 80;

  // Custom Stop Marker Icon
  const createMarkerIcon = useCallback(() => {
    if (!window.google?.maps) return null;
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
        <defs>
          <filter id="stopShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="#000" flood-opacity="0.6"/>
          </filter>
        </defs>
        <g filter="url(#stopShadow)">
          <path d="M20 4 C13.4 4 8 9.4 8 16 C8 24 20 36 20 36 C20 36 32 24 32 16 C32 9.4 26.6 4 20 4 Z" fill="#6366f1" stroke="#ffffff" stroke-width="2"/>
          <circle cx="20" cy="15" r="5" fill="#ffffff"/>
        </g>
      </svg>
    `;
    return {
      url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
      scaledSize: new window.google.maps.Size(40, 40),
      anchor: new window.google.maps.Point(20, 36),
    };
  }, []);

  // Reverse geocode to suggest a friendly name and street
  const reverseGeocode = useCallback(
    (newLat, newLng) => {
      if (!window.google?.maps) return;
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: { lat: newLat, lng: newLng } }, (results, status) => {
        if (status === "OK" && results?.[0]) {
          const formatted = results[0].formatted_address;
          // Extract short street or landmark name
          let suggestedName = "";
          const components = results[0].address_components || [];
          const routeComp = components.find((c) => c.types.includes("route"));
          const pointComp = components.find(
            (c) => c.types.includes("point_of_interest") || c.types.includes("establishment")
          );
          const neighborhoodComp = components.find(
            (c) => c.types.includes("sublocality") || c.types.includes("neighborhood")
          );

          if (pointComp) {
            suggestedName = pointComp.long_name;
          } else if (routeComp && neighborhoodComp) {
            suggestedName = `${routeComp.long_name}, ${neighborhoodComp.short_name}`;
          } else if (routeComp) {
            suggestedName = routeComp.long_name;
          } else if (neighborhoodComp) {
            suggestedName = neighborhoodComp.long_name;
          } else {
            suggestedName = formatted.split(",")[0];
          }

          setAddressNotice(formatted);
          onLocationChange?.({
            lat: newLat,
            lng: newLng,
            suggestedName,
            formattedAddress: formatted,
          });
        } else {
          onLocationChange?.({
            lat: newLat,
            lng: newLng,
          });
        }
      });
    },
    [onLocationChange]
  );

  // 1. Initialize Map
  useEffect(() => {
    if (!isLoaded || !mapContainerRef.current || !window.google?.maps) return;

    if (!mapInstanceRef.current) {
      const initialPos = { lat: numLat, lng: numLng };

      const map = new window.google.maps.Map(mapContainerRef.current, {
        center: initialPos,
        zoom: 15,
        styles: GOOGLE_MAPS_DARK_THEME,
        mapTypeId: window.google.maps.MapTypeId.ROADMAP,
        disableDefaultUI: true,
        gestureHandling: "greedy",
      });

      // Draggable Marker
      const marker = new window.google.maps.Marker({
        position: initialPos,
        map,
        draggable: true,
        icon: createMarkerIcon(),
        title: "Drag marker to adjust stop location",
        zIndex: 50,
      });

      // Geofence Circle Preview
      const circle = new window.google.maps.Circle({
        strokeColor: "#818cf8",
        strokeOpacity: 0.85,
        strokeWeight: 2,
        fillColor: "#6366f1",
        fillOpacity: 0.22,
        map,
        center: initialPos,
        radius: numRadius,
      });

      // Marker Drag Listener
      marker.addListener("dragend", () => {
        const pos = marker.getPosition();
        if (pos) {
          const newLat = Number(pos.lat().toFixed(6));
          const newLng = Number(pos.lng().toFixed(6));
          circle.setCenter({ lat: newLat, lng: newLng });
          reverseGeocode(newLat, newLng);
        }
      });

      // Map Click Listener
      map.addListener("click", (e) => {
        if (e.latLng) {
          const newLat = Number(e.latLng.lat().toFixed(6));
          const newLng = Number(e.latLng.lng().toFixed(6));
          marker.setPosition({ lat: newLat, lng: newLng });
          circle.setCenter({ lat: newLat, lng: newLng });
          reverseGeocode(newLat, newLng);
        }
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;
      circleRef.current = circle;
    }
  }, [isLoaded, createMarkerIcon, numLat, numLng, numRadius, reverseGeocode]);

  // 2. Setup Google Places Autocomplete on the Search Input
  useEffect(() => {
    if (!isLoaded || !searchInputRef.current || !window.google?.maps?.places) return;

    if (!autocompleteRef.current) {
      const autocomplete = new window.google.maps.places.Autocomplete(searchInputRef.current, {
        types: ["geocode", "establishment"],
        fields: ["geometry", "name", "formatted_address"],
      });

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (place.geometry && place.geometry.location) {
          const newLat = Number(place.geometry.location.lat().toFixed(6));
          const newLng = Number(place.geometry.location.lng().toFixed(6));

          if (mapInstanceRef.current) {
            mapInstanceRef.current.panTo({ lat: newLat, lng: newLng });
            mapInstanceRef.current.setZoom(16);
          }
          if (markerRef.current) {
            markerRef.current.setPosition({ lat: newLat, lng: newLng });
          }
          if (circleRef.current) {
            circleRef.current.setCenter({ lat: newLat, lng: newLng });
          }

          const suggestedName = place.name || (place.formatted_address ? place.formatted_address.split(",")[0] : "");
          setAddressNotice(place.formatted_address || suggestedName);

          onLocationChange?.({
            lat: newLat,
            lng: newLng,
            suggestedName,
            formattedAddress: place.formatted_address,
          });
        }
      });

      autocompleteRef.current = autocomplete;
    }
  }, [isLoaded, onLocationChange]);

  // 3. Keep Marker and Circle in sync when form values change from outside
  useEffect(() => {
    if (!mapInstanceRef.current || !markerRef.current || !circleRef.current) return;
    const currentMarkerPos = markerRef.current.getPosition();
    if (
      !currentMarkerPos ||
      Math.abs(currentMarkerPos.lat() - numLat) > 0.00001 ||
      Math.abs(currentMarkerPos.lng() - numLng) > 0.00001
    ) {
      const newPos = { lat: numLat, lng: numLng };
      markerRef.current.setPosition(newPos);
      circleRef.current.setCenter(newPos);
      mapInstanceRef.current.panTo(newPos);
    }

    if (circleRef.current.getRadius() !== numRadius) {
      circleRef.current.setRadius(numRadius);
    }
  }, [numLat, numLng, numRadius]);

  // Handle Geocoding Search manually on Form Submit (Enter key or button)
  const handleManualSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim() || !window.google?.maps) return;

    setIsSearching(true);
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address: searchQuery }, (results, status) => {
      setIsSearching(false);
      if (status === "OK" && results?.[0]?.geometry?.location) {
        const loc = results[0].geometry.location;
        const newLat = Number(loc.lat().toFixed(6));
        const newLng = Number(loc.lng().toFixed(6));

        if (mapInstanceRef.current) {
          mapInstanceRef.current.panTo({ lat: newLat, lng: newLng });
          mapInstanceRef.current.setZoom(16);
        }
        if (markerRef.current) {
          markerRef.current.setPosition({ lat: newLat, lng: newLng });
        }
        if (circleRef.current) {
          circleRef.current.setCenter({ lat: newLat, lng: newLng });
        }

        const suggestedName = results[0].formatted_address.split(",")[0];
        setAddressNotice(results[0].formatted_address);

        onLocationChange?.({
          lat: newLat,
          lng: newLng,
          suggestedName,
          formattedAddress: results[0].formatted_address,
        });
      }
    });
  };

  const handleZoomIn = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.setZoom(mapInstanceRef.current.getZoom() + 1);
  };

  const handleZoomOut = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.setZoom(mapInstanceRef.current.getZoom() - 1);
  };

  const handleRecenter = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.panTo({ lat: numLat, lng: numLng });
    mapInstanceRef.current.setZoom(16);
  };

  return (
    <div className="space-y-2">
      {/* Google Maps Places Address Search Box */}
      <form onSubmit={handleManualSearch} className="relative">
        <Search className="w-4 h-4 text-indigo-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search address, landmark, or street on Google Maps..."
          className="w-full pl-9 pr-24 py-2 bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-xl text-xs text-white placeholder-slate-400 outline-none transition-colors"
        />
        <button
          type="submit"
          disabled={isSearching}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-[11px] rounded-lg transition-colors cursor-pointer disabled:opacity-50"
        >
          {isSearching ? "Searching..." : "Locate"}
        </button>
      </form>

      {/* Address Notification Pill if reverse geocoded */}
      {addressNotice && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-indigo-500/30 text-[11px] text-slate-300">
          <Navigation className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span className="truncate">
            Located: <strong className="text-white">{addressNotice}</strong>
          </span>
        </div>
      )}

      {/* Google Map Canvas Container */}
      <div className="relative h-[240px] rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 shadow-inner">
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Floating Instruction Banner */}
        <div className="absolute top-2.5 left-2.5 z-10 bg-slate-950/85 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-700/80 text-[10px] text-slate-300 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Click map or drag pin &bull; Geofence: {numRadius}m</span>
        </div>

        {/* Floating Map Controls */}
        <div className="absolute bottom-2.5 right-2.5 z-10 flex items-center gap-1 bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-slate-800 shadow-lg">
          <button
            type="button"
            onClick={handleRecenter}
            title="Recenter on Stop Marker"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Crosshair className="w-3.5 h-3.5 text-emerald-400" />
          </button>
          <div className="w-px h-4 bg-slate-800" />
          <button
            type="button"
            onClick={handleZoomIn}
            title="Zoom In"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            title="Zoom Out"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
