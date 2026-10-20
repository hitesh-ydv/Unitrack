import React from "react";
import { Polyline, Marker, Popup } from "react-leaflet";
import { createStopIcon, createUniversityIcon } from "../../utils/mapUtils";

export const RoutePolylineLayer = ({
  routes = [],
  activeRouteId = null,
  showAllRoutes = true,
  stopsList = [],
}) => {
  const availableStops = stopsList || [];

  return (
    <>
      {routes.map((route) => {
        const isSelected = activeRouteId === route.id;
        if (!showAllRoutes && !isSelected) return null;

        const color = route.color || "#3b82f6";
        const waypoints = route.waypoints || [];

        // Find stops for this route
        const routeStops = (route.stops || [])
          .map((stopId) => {
            if (typeof stopId === "object" && stopId.lat) return stopId;
            return availableStops.find((s) => s.id === stopId);
          })
          .filter(Boolean);

        return (
          <React.Fragment key={route.id}>
            {/* Road Polyline Path */}
            {waypoints.length > 1 && (
              <Polyline
                positions={waypoints}
                pathOptions={{
                  color: color,
                  weight: isSelected ? 6 : 4,
                  opacity: isSelected ? 0.95 : 0.65,
                  dashArray: route.status === "inactive" ? "6, 8" : undefined,
                }}
              >
                <Popup>
                  <div className="p-1">
                    <h4 className="font-bold text-xs text-slate-900">{route.name}</h4>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      {route.distanceKm} km &bull; Est. {route.estimatedDurationMin} mins
                    </p>
                    <p className="text-[10px] text-indigo-600 font-semibold mt-1">
                      Start & End: University Terminal
                    </p>
                  </div>
                </Popup>
              </Polyline>
            )}

            {/* Stop Markers along the route */}
            {routeStops.map((stop, index) => {
              const isUniv =
                stop.code === "S-001" ||
                stop.name?.toLowerCase().includes("university") ||
                index === 0 ||
                index === routeStops.length - 1;

              return (
                <Marker
                  key={`${route.id}-${stop.id || index}-${index}`}
                  position={[stop.lat, stop.lng]}
                  icon={isUniv ? createUniversityIcon(index === 0) : createStopIcon(stop, index + 1)}
                >
                  <Popup>
                    <div className="p-1 min-w-[170px]">
                      <div className="font-bold text-xs text-slate-900">{stop.name}</div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        Stop #{index + 1} &bull; {stop.code || "Pinned Stop"}
                      </div>
                      {stop.morningTime && (
                        <div className="mt-1 text-[11px] text-slate-600">
                          Morning Arrival: <span className="font-semibold">{stop.morningTime}</span>
                        </div>
                      )}
                      {stop.eveningTime && (
                        <div className="text-[11px] text-slate-600">
                          Evening Pickup: <span className="font-semibold">{stop.eveningTime}</span>
                        </div>
                      )}
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </React.Fragment>
        );
      })}
    </>
  );
};
