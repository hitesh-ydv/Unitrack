import React, { useState, useEffect } from "react";
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Clock,
  Radio,
  Flame,
  Check,
  Search,
  Filter,
  Plus,
} from "lucide-react";
import { DataTable } from "../components/common/DataTable";
import { StatusBadge } from "../components/common/StatusBadge";
import { StatCard } from "../components/common/StatCard";
import { alertService } from "../services/alertService";
import { useToast } from "../context/ToastContext";
import { Modal } from "../components/common/Modal";

export const AlertsDelayDetection = () => {
  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInjectModalOpen, setIsInjectModalOpen] = useState(false);

  // Form State for Demo Alert Injection
  const [injectData, setInjectData] = useState({
    title: "Excessive Dwell Time",
    type: "route_deviation",
    severity: "warning",
    busNumber: "Bus 102",
    description: "Bus stationary at Botanical Garden Cross for over 18 minutes with engine idling.",
  });

  const toast = useToast();

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await alertService.getAll();
      setAlerts(data);
    } catch {
      toast.error("Error", "Failed to load telemetry alerts.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAcknowledge = async (id) => {
    try {
      await alertService.acknowledge(id);
      toast.info("Acknowledged", `Alert ${id} acknowledged by control room.`);
      loadData();
    } catch {
      toast.error("Error", "Could not acknowledge alert.");
    }
  };

  const handleResolve = async (id) => {
    try {
      await alertService.resolve(id);
      toast.success("Resolved", `Alert ${id} resolved and archived.`);
      loadData();
    } catch {
      toast.error("Error", "Could not resolve alert.");
    }
  };

  const handleInjectAlert = async (e) => {
    e.preventDefault();
    try {
      await alertService.create(injectData);
      toast.warning("Alert Injected", `Created live ${injectData.severity} incident for ${injectData.busNumber}.`);
      setIsInjectModalOpen(false);
      loadData();
    } catch {
      toast.error("Error", "Failed to trigger incident.");
    }
  };

  const columns = [
    {
      header: "Severity & Incident",
      key: "severity",
      sortable: true,
      render: (val, row) => (
        <div className="flex items-start gap-2.5">
          <div
            className={`p-2 rounded-xl border shrink-0 ${
              val === "critical"
                ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
                : val === "warning"
                ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                : "bg-blue-500/10 border-blue-500/30 text-blue-400"
            }`}
          >
            {val === "critical" ? (
              <Flame className="w-4 h-4 animate-pulse" />
            ) : val === "warning" ? (
              <AlertTriangle className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-xs">{row.title}</span>
              <StatusBadge status={val} size="sm" />
            </div>
            <p className="text-[11px] text-slate-400 mt-1 leading-snug">{row.description}</p>
          </div>
        </div>
      ),
    },
    {
      header: "Target Vehicle",
      key: "busNumber",
      sortable: true,
      render: (val, row) => (
        <div className="text-xs">
          <span className="font-bold text-white block">{val}</span>
          <span className="text-[10px] text-slate-400">{row.driverName || "Fleet Unit"}</span>
        </div>
      ),
    },
    {
      header: "Time Logged",
      key: "timestamp",
      sortable: true,
      render: (val) => <span className="text-xs text-slate-400 whitespace-nowrap">{val}</span>,
    },
    {
      header: "Investigation Status",
      key: "resolved",
      sortable: true,
      render: (val, row) => (
        <div className="text-xs">
          {val ? (
            <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
              <Check className="w-3.5 h-3.5" /> Resolved
            </span>
          ) : row.acknowledged ? (
            <span className="inline-flex items-center gap-1 text-amber-400 font-medium">
              <Clock className="w-3.5 h-3.5" /> In Progress
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-rose-400 font-bold animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5" /> Unacknowledged
            </span>
          )}
        </div>
      ),
    },
    {
      header: "Workflow Actions",
      key: "actions",
      render: (_, row) => (
        <div className="flex items-center gap-2">
          {!row.acknowledged && !row.resolved && (
            <button
              onClick={() => handleAcknowledge(row.id)}
              className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
            >
              Acknowledge
            </button>
          )}

          {!row.resolved && (
            <button
              onClick={() => handleResolve(row.id)}
              className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
            >
              Resolve
            </button>
          )}

          {row.resolved && <span className="text-[10px] text-slate-500 font-mono">Archived</span>}
        </div>
      ),
    },
  ];

  const filters = [
    {
      key: "severity",
      label: "Severity",
      options: [
        { label: "Critical", value: "critical" },
        { label: "Warning", value: "warning" },
        { label: "Info", value: "info" },
      ],
    },
  ];

  const criticalCount = alerts.filter((a) => a.severity === "critical" && !a.resolved).length;
  const warningCount = alerts.filter((a) => a.severity === "warning" && !a.resolved).length;
  const resolvedCount = alerts.filter((a) => a.resolved).length;

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Alerts & Delay Detection Center</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time geofence breaches, schedule deviations, over-speed violations, and telemetry disconnects.
          </p>
        </div>

        <button
          onClick={() => setIsInjectModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Simulate Telemetry Alert</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          title="Active Alerts"
          value={alerts.filter((a) => !a.resolved).length}
          subtext="Requires investigation"
          icon={AlertTriangle}
          color="amber"
        />
        <StatCard
          title="Critical Incidents"
          value={criticalCount}
          subtext="Immediate intervention"
          icon={Flame}
          color="rose"
        />
        <StatCard
          title="Warning Level"
          value={warningCount}
          subtext="Delays and telemetry lag"
          icon={Clock}
          color="purple"
        />
        <StatCard
          title="Resolved Today"
          value={resolvedCount}
          subtext="Cleared by dispatchers"
          icon={CheckCircle}
          color="emerald"
        />
      </div>

      <DataTable
        columns={columns}
        data={alerts}
        isLoading={isLoading}
        searchKey="title"
        searchPlaceholder="Search incident title, description or bus..."
        filters={filters}
        csvFilename="telematics_alerts_log.csv"
      />

      {/* Trigger Demo Alert Modal */}
      <Modal
        isOpen={isInjectModalOpen}
        onClose={() => setIsInjectModalOpen(false)}
        title="Simulate Real-time Telematics Event"
        subtitle="Inject a simulated speed, geofence, or GPS failure event into the active monitoring pipeline."
        maxWidth="max-w-md"
      >
        <form onSubmit={handleInjectAlert} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Incident Headline *</label>
            <input
              type="text"
              required
              value={injectData.title}
              onChange={(e) => setInjectData({ ...injectData, title: e.target.value })}
              className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Severity</label>
              <select
                value={injectData.severity}
                onChange={(e) => setInjectData({ ...injectData, severity: e.target.value })}
                className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              >
                <option value="critical">Critical</option>
                <option value="warning">Warning</option>
                <option value="info">Info</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Target Bus</label>
              <input
                type="text"
                value={injectData.busNumber}
                onChange={(e) => setInjectData({ ...injectData, busNumber: e.target.value })}
                className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Event Description</label>
            <textarea
              rows={3}
              value={injectData.description}
              onChange={(e) => setInjectData({ ...injectData, description: e.target.value })}
              className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsInjectModalOpen(false)}
              className="px-4 py-2 text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 rounded-xl shadow-lg transition-all"
            >
              Trigger Incident
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
