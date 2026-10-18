import React from "react";
import { Circle, Popup } from "react-leaflet";

export const GeofenceLayer = ({ geofences = [], showGeofences = true }) => {
  if (!showGeofences) return null;

  return (
    <>
      {geofences.map((geo) => {
        if (!geo.lat || !geo.lng) return null;

        const color = geo.color || "#3b82f6";

        return (
          <Circle
            key={geo.id}
            center={[geo.lat, geo.lng]}
            radius={geo.radiusMeters || 300}
            pathOptions={{
              color: color,
              fillColor: color,
              fillOpacity: 0.15,
              weight: 2,
              dashArray: "4, 6",
            }}
          >
            <Popup>
              <div className="p-1 min-w-[190px]">
                <div className="font-bold text-xs text-slate-900">{geo.name}</div>
                <p className="text-[11px] text-slate-600 mt-0.5">{geo.description}</p>
                <div className="mt-2 pt-1 border-t border-slate-200 text-[10px] space-y-0.5 text-slate-700">
                  <div>
                    Radius: <span className="font-semibold">{geo.radiusMeters}m</span>
                  </div>
                  <div>
                    Speed Limit: <span className="font-semibold text-rose-600">{geo.speedLimitKmh} km/h</span>
                  </div>
                  <div>
                    Trigger: <span className="font-semibold">{geo.triggerType}</span>
                  </div>
                </div>
              </div>
            </Popup>
          </Circle>
        );
      })}
    </>
  );
};
