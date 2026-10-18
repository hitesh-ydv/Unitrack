import React, { useState, useEffect } from "react";
import {
  Clock,
  Bus,
  User,
  Route,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Play,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { DataTable } from "../components/common/DataTable";
import { StatusBadge } from "../components/common/StatusBadge";
import { tripService } from "../services/tripService";
import { busService } from "../services/busService";
import { useToast } from "../context/ToastContext";
import { formatDelay } from "../utils/formatters";
import { Modal } from "../components/common/Modal";

export const TripMonitoring = () => {
  const [trips, setTrips] = useState([]);
  const [buses, setBuses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reliefModalTrip, setReliefModalTrip] = useState(null);
  const [selectedReliefBusId, setSelectedReliefBusId] = useState("");

  const toast = useToast();

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [tripData, busData] = await Promise.all([
        tripService.getAll(),
        busService.getAll(),
      ]);
      setTrips(tripData);
      setBuses(busData);
    } catch {
      toast.error("Error", "Failed to load active trips.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateStatus = async (tripId, newStatus, delayMinutes = 0) => {
    try {
      await tripService.updateStatus(tripId, newStatus, delayMinutes);
      toast.success("Trip Status Updated", `Trip ${tripId} marked as ${newStatus}.`);
      loadData();
    } catch {
      toast.error("Error", "Could not update trip status.");
    }
  };

  const handleDispatchRelief = () => {
    if (!selectedReliefBusId || !reliefModalTrip) return;
    const reliefBus = buses.find((b) => b.id === selectedReliefBusId);
    toast.success(
      "Relief Bus Dispatched",
      `${reliefBus?.busNumber} deployed as auxiliary runner for ${reliefModalTrip.id}.`
    );
    setReliefModalTrip(null);
  };

  const columns = [
    {
      header: "Trip ID & Run",
      key: "id",
      sortable: true,
      render: (val, row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center font-bold text-xs shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-white block">{val}</span>
            <span className="text-[10px] text-slate-400 font-medium">{row.direction}</span>
          </div>
        </div>
      ),
    },
    {
      header: "Vehicle & Driver",
      key: "busNumber",
      sortable: true,
      render: (val, row) => (
        <div className="text-xs">
          <span className="font-semibold text-white block">{val}</span>
          <span className="text-[10px] text-slate-400">{row.driverName}</span>
        </div>
      ),
    },
    {
      header: "Assigned Route",
      key: "routeName",
      sortable: true,
      render: (val) => <span className="text-slate-300 font-medium truncate max-w-[170px] block">{val}</span>,
    },
    {
      header: "Schedule (Start - End)",
      key: "scheduledStart",
      render: (val, row) => (
        <div className="text-xs">
          <span className="text-slate-200">{val} &rarr; {row.scheduledEnd}</span>
          <span className="text-[10px] text-slate-500 block">Actual: {row.actualStart}</span>
        </div>
      ),
    },
    {
      header: "Route Progress",
      key: "progressPercent",
      sortable: true,
      render: (val, row) => (
        <div className="w-32">
          <div className="flex justify-between text-[10px] mb-1">
            <span className="text-slate-300">Stop {row.currentStopIndex} of {row.totalStops}</span>
            <span className="font-bold text-white">{val}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                row.status === "delayed" ? "bg-amber-400" : "bg-emerald-500"
              }`}
              style={{ width: `${val}%` }}
            />
          </div>
        </div>
      ),
    },
    {
      header: "Punctuality",
      key: "delayMinutes",
      sortable: true,
      render: (val) => (
        <span
          className={`font-semibold text-xs ${
            val > 5 ? "text-rose-400 font-bold" : "text-emerald-400"
          }`}
        >
          {formatDelay(val)}
        </span>
      ),
    },
    {
      header: "Trip Status",
      key: "status",
      sortable: true,
      render: (val) => <StatusBadge status={val} />,
    },
    {
      header: "Dispatcher Actions",
      key: "actions",
      render: (_, row) => (
        <div className="flex items-center gap-1.5">
          {row.status === "in_progress" && (
            <>
              <button
                onClick={() => handleUpdateStatus(row.id, "completed")}
                className="px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg text-[10px] font-semibold cursor-pointer"
                title="Mark Completed"
              >
                Complete
              </button>
              <button
                onClick={() => setReliefModalTrip(row)}
                className="px-2 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 rounded-lg text-[10px] font-semibold cursor-pointer"
                title="Dispatch Relief Bus"
              >
                Relief
              </button>
            </>
          )}

          {row.status === "delayed" && (
            <button
              onClick={() => handleUpdateStatus(row.id, "in_progress", 0)}
              className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 rounded-lg text-[10px] font-semibold cursor-pointer"
            >
              Clear Delay
            </button>
          )}
        </div>
      ),
    },
  ];

  const filters = [
    {
      key: "status",
      label: "Status",
      options: [
        { label: "In Progress", value: "in_progress" },
        { label: "Delayed", value: "delayed" },
        { label: "Completed", value: "completed" },
        { label: "Cancelled", value: "cancelled" },
      ],
    },
    {
      key: "direction",
      label: "Direction",
      options: [
        { label: "Morning Pickup", value: "Morning Pickup" },
        { label: "Evening Drop", value: "Evening Drop" },
        { label: "Early Faculty Run", value: "Early Faculty Run" },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Live Trip Execution & Dispatch</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Supervise scheduled vs actual runs, detect waypoint progress, and manage on-the-fly relief dispatches.
          </p>
        </div>

        <button
          onClick={() => {
            toast.info("Refreshed", "Synchronized live trip milestones with bus telematics.");
            loadData();
          }}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
          <span>Sync Schedules</span>
        </button>
      </div>

      <DataTable
        columns={columns}
        data={trips}
        isLoading={isLoading}
        searchKey="id"
        searchPlaceholder="Search trip ID, bus, driver or route..."
        filters={filters}
        csvFilename="university_daily_trips.csv"
      />

      {/* Relief Bus Dispatch Modal */}
      <Modal
        isOpen={!!reliefModalTrip}
        onClose={() => setReliefModalTrip(null)}
        title="Dispatch Relief Bus"
        subtitle={`Select a standby vehicle to take over passengers from ${reliefModalTrip?.busNumber}.`}
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300">
            <span className="text-slate-400 block mb-1">Affected Run:</span>
            <div className="font-bold text-white">{reliefModalTrip?.id} &bull; {reliefModalTrip?.routeName}</div>
            <div className="text-rose-400 font-semibold mt-1">Current Delay: +{reliefModalTrip?.delayMinutes} minutes</div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Select Auxiliary Relief Bus
            </label>
            <select
              value={selectedReliefBusId}
              onChange={(e) => setSelectedReliefBusId(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
            >
              <option value="">Choose an available standby bus...</option>
              {buses
                .filter((b) => b.id !== reliefModalTrip?.busId)
                .map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.busNumber} ({b.plateNumber}) - Driver: {b.assignedDriverName}
                  </option>
                ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              onClick={() => setReliefModalTrip(null)}
              className="px-4 py-2 text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleDispatchRelief}
              disabled={!selectedReliefBusId}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg transition-all disabled:opacity-50"
            >
              Dispatch Auxiliary Unit
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
