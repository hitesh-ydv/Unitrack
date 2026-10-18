import React, { useEffect, useRef } from "react";
import { MapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { useSettings } from "../../context/SettingsContext";
import { MOCK_CAMPUS_CENTER } from "../../data/mockData";

// Helper component to smoothly re-center or follow a moving bus (Zomato/Swiggy rider style)
export const MapController = ({
  center,
  zoom,
  flyToTarget = null,
  followTarget = null,
  isFollowing = false,
}) => {
  const map = useMap();
  const lastFlyRef = useRef(null);

  // When flyToTarget changes, smoothly glide the camera to the target
  useEffect(() => {
    if (flyToTarget && flyToTarget[0] && flyToTarget[1]) {
      const key = `${flyToTarget[0].toFixed(5)},${flyToTarget[1].toFixed(5)}`;
      if (lastFlyRef.current !== key) {
        lastFlyRef.current = key;
        map.flyTo(flyToTarget, zoom || 15, {
          duration: 1.2,
          easeLinearity: 0.25,
        });
      }
    }
  }, [flyToTarget, zoom, map]);

  // When following a moving bus, smoothly pan the map along with the rider
  useEffect(() => {
    if (isFollowing && followTarget && followTarget[0] && followTarget[1]) {
      map.panTo(followTarget, {
        animate: true,
        duration: 0.25,
        noMoveStart: true,
      });
    }
  }, [followTarget, isFollowing, map]);

  // Standard static center update
  useEffect(() => {
    if (!flyToTarget && !isFollowing && center) {
      map.setView(center, zoom || map.getZoom(), { animate: true });
    }
  }, [center, zoom, flyToTarget, isFollowing, map]);

  return null;
};

// Map click listener component for pinning on map
const MapClickHandler = ({ onMapClick }) => {
  useMapEvents({
    click(e) {
      if (onMapClick) {
        onMapClick({
          lat: Number(e.latlng.lat.toFixed(6)),
          lng: Number(e.latlng.lng.toFixed(6)),
        });
      }
    },
  });
  return null;
};

export const MapContainerView = ({
  center = [MOCK_CAMPUS_CENTER.lat, MOCK_CAMPUS_CENTER.lng],
  zoom = 13,
  flyToTarget = null,
  followTarget = null,
  isFollowing = false,
  onMapClick = null,
  children,
  className = "w-full h-full min-h-[480px] rounded-2xl overflow-hidden shadow-2xl border border-slate-800",
}) => {
  const { activeTileProvider } = useSettings();

  return (
    <div className={`relative ${className}`}>
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <TileLayer
          attribution={activeTileProvider.attribution}
          url={activeTileProvider.url}
          maxZoom={19}
        />
        <MapController
          center={center}
          zoom={zoom}
          flyToTarget={flyToTarget}
          followTarget={followTarget}
          isFollowing={isFollowing}
        />
        {onMapClick && <MapClickHandler onMapClick={onMapClick} />}
        {children}
      </MapContainer>
    </div>
  );
};
