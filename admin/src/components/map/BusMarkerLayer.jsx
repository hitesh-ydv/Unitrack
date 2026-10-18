import React from "react";
import { Marker, Popup } from "react-leaflet";
import { createBusIcon } from "../../utils/mapUtils";
import { StatusBadge } from "../common/StatusBadge";
import { formatDelay, getRelativeTimeString } from "../../utils/formatters";
import { Navigation, User, AlertCircle, Fuel, BatteryCharging } from "lucide-react";

export const BusMarkerLayer = ({
  buses = [],
  selectedBusId = null,
  onSelectBus,
}) => {
  return (
    <>
      {buses.map((bus) => {
        if (!bus.currentLat || !bus.currentLng) return null;

        const isSelected = bus.id === selectedBusId;
        const icon = createBusIcon(bus, isSelected);

        return (
          <Marker
            key={bus.id}
            position={[bus.currentLat, bus.currentLng]}
            icon={icon}
            eventHandlers={{
              click: () => onSelectBus && onSelectBus(bus),
            }}
          >
            <Popup className="bus-popup">
              <div className="p-1 min-w-[210px] text-slate-900">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
                  <span className="font-bold text-sm text-slate-900">{bus.busNumber}</span>
                  <StatusBadge status={bus.gpsStatus} size="sm" />
                </div>

                <p className="text-xs font-medium text-slate-600 mt-1">{bus.routeName}</p>

                <div className="mt-2.5 space-y-1.5 text-xs text-slate-700">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-slate-500">
                      <User className="w-3.5 h-3.5" /> Driver:
                    </span>
                    <span className="font-semibold">{bus.assignedDriverName}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-slate-500">
                      <Navigation className="w-3.5 h-3.5" /> Speed:
                    </span>
                    <span className="font-semibold">{bus.speedKmh} km/h</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-slate-500">
                      {bus.fuelType.includes("EV") ? (
                        <BatteryCharging className="w-3.5 h-3.5" />
                      ) : (
                        <Fuel className="w-3.5 h-3.5" />
                      )}
                      Charge / Fuel:
                    </span>
                    <span className="font-semibold">{bus.fuelLevelPercent}%</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-slate-500">
                      <AlertCircle className="w-3.5 h-3.5" /> Delay:
                    </span>
                    <span
                      className={`font-semibold ${
                        bus.delayMinutes > 5 ? "text-rose-600 font-bold" : "text-emerald-700"
                      }`}
                    >
                      {formatDelay(bus.delayMinutes)}
                    </span>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500">
                  <span>Ping: {getRelativeTimeString(bus.lastPing)}</span>
                  <button
                    onClick={() => onSelectBus && onSelectBus(bus)}
                    className="text-indigo-600 font-semibold hover:underline"
                  >
                    View Details &rarr;
                  </button>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
};
