import React, { useState, useEffect } from "react";
import {
  Compass,
  Plus,
  Edit2,
  Trash2,
  Shield,
  Gauge,
  Radio,
  Sliders,
  CheckCircle,
} from "lucide-react";
import { MapContainerView } from "../components/map/MapContainerView";
import { GeofenceLayer } from "../components/map/GeofenceLayer";
import { DataTable } from "../components/common/DataTable";
import { StatusBadge } from "../components/common/StatusBadge";
import { Modal } from "../components/common/Modal";
import { ConfirmDialog } from "../components/common/ConfirmDialog";
import { geofenceService } from "../services/geofenceService";
import { useToast } from "../context/ToastContext";

const CAMPUS_CENTER = { lat: 12.9716, lng: 77.5946 };

export const GeofenceManagement = () => {
  const [geofences, setGeofences] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGeofence, setEditingGeofence] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "circle",
    lat: 12.9716,
    lng: 77.5946,
    radiusMeters: 500,
    speedLimitKmh: 20,
    triggerType: "enter_and_exit",
    color: "#3b82f6",
  });

  const toast = useToast();

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await geofenceService.getAll();
      setGeofences(data);
    } catch {
      toast.error("Error", "Failed to load geofences.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAdd = () => {
    setEditingGeofence(null);
    setFormData({
      name: "",
      description: "University safety zone with telemetry breach detection.",
      type: "circle",
      lat: 12.972,
      lng: 77.595,
      radiusMeters: 450,
      speedLimitKmh: 25,
      triggerType: "enter_and_exit",
      color: "#8b5cf6",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (geo) => {
    setEditingGeofence(geo);
    setFormData({
      name: geo.name,
      description: geo.description,
      type: geo.type,
      lat: geo.lat,
      lng: geo.lng,
      radiusMeters: geo.radiusMeters,
      speedLimitKmh: geo.speedLimitKmh,
      triggerType: geo.triggerType,
      color: geo.color || "#3b82f6",
    });
    setIsModalOpen(true);
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!formData.name) {
      toast.warning("Validation Error", "Please provide a geofence name.");
      return;
    }

    const payload = {
      ...formData,
      lat: Number(formData.lat),
      lng: Number(formData.lng),
      radiusMeters: Number(formData.radiusMeters),
      speedLimitKmh: Number(formData.speedLimitKmh),
    };

    try {
      if (editingGeofence) {
        await geofenceService.update(editingGeofence.id, payload);
        toast.success("Updated", `${payload.name} parameters updated.`);
      } else {
        await geofenceService.create(payload);
        toast.success("Geofence Created", `${payload.name} boundary established.`);
      }
      setIsModalOpen(false);
      loadData();
    } catch {
      toast.error("Save Error", "Unable to save geofence.");
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await geofenceService.delete(deleteTarget.id);
      toast.success("Deleted", `${deleteTarget.name} boundary dismantled.`);
      setDeleteTarget(null);
      loadData();
    } catch {
      toast.error("Delete Error", "Could not remove geofence.");
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = [
    {
      header: "Geofence Zone",
      key: "name",
      sortable: true,
      render: (val, row) => (
        <div className="flex items-center gap-2.5">
          <span
            className="w-3.5 h-3.5 rounded-full shrink-0 border border-white/40"
            style={{ backgroundColor: row.color || "#3b82f6" }}
          />
          <div>
            <span className="font-bold text-white text-xs block">{val}</span>
            <span className="text-[10px] text-slate-400 truncate max-w-xs block">{row.description}</span>
          </div>
        </div>
      ),
    },
    {
      header: "Radial Buffer",
      key: "radiusMeters",
      sortable: true,
      render: (val) => `${val} meters`,
    },
    {
      header: "Speed Constraint",
      key: "speedLimitKmh",
      sortable: true,
      render: (val) => (
        <span className="font-bold text-xs text-amber-400">
          &le; {val} km/h
        </span>
      ),
    },
    {
      header: "Trigger Rule",
      key: "triggerType",
      sortable: true,
      render: (val) => (
        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-indigo-300 border border-slate-700 capitalize">
          {val.replace(/_/g, " ")}
        </span>
      ),
    },
    {
      header: "Status",
      key: "status",
      sortable: true,
      render: (val) => <StatusBadge status={val} />,
    },
    {
      header: "Actions",
      key: "actions",
      render: (_, row) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handleOpenEdit(row)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Edit Geofence"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setDeleteTarget(row)}
            className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors cursor-pointer"
            title="Delete Geofence"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Geofence Boundaries & Speed Zones</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure electronic virtual perimeters for campus gates, depots, pedestrian safe corridors, and restricted parking.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/25 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Define New Geofence</span>
        </button>
      </div>

      {/* Interactive Map Visualizer */}
      <div className="h-[360px] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl relative">
        <MapContainerView center={[CAMPUS_CENTER.lat, CAMPUS_CENTER.lng]} zoom={13}>
          <GeofenceLayer geofences={geofences} showGeofences={true} />
        </MapContainerView>

        <div className="absolute top-3 left-3 z-[1000] bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-xs text-slate-200 shadow-xl flex items-center gap-2">
          <Compass className="w-4 h-4 text-indigo-400" />
          <span>Active Virtual Perimeters ({geofences.length})</span>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={geofences}
        isLoading={isLoading}
        searchKey="name"
        searchPlaceholder="Search geofence name or description..."
        csvFilename="campus_geofence_zones.csv"
      />

      {/* Add / Edit Geofence Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingGeofence ? `Edit ${editingGeofence.name}` : "Define Virtual Geofence"}
        subtitle="Establish automated telemetry triggers upon bus entry, exit, or dwell time."
      >
        <form onSubmit={handleSubmitForm} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Geofence Zone Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. University Main Campus Quad"
              className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Zone Purpose & Rules</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Center Latitude</label>
              <input
                type="number"
                step="0.000001"
                required
                value={formData.lat}
                onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Center Longitude</label>
              <input
                type="number"
                step="0.000001"
                required
                value={formData.lng}
                onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
                className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Radius (Meters)</label>
              <input
                type="number"
                min="50"
                max="5000"
                value={formData.radiusMeters}
                onChange={(e) => setFormData({ ...formData, radiusMeters: e.target.value })}
                className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Max Speed Limit (km/h)</label>
              <input
                type="number"
                min="5"
                max="100"
                value={formData.speedLimitKmh}
                onChange={(e) => setFormData({ ...formData, speedLimitKmh: e.target.value })}
                className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Trigger Event</label>
              <select
                value={formData.triggerType}
                onChange={(e) => setFormData({ ...formData, triggerType: e.target.value })}
                className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              >
                <option value="enter_and_exit">Enter & Exit</option>
                <option value="exit_only">Exit Only</option>
                <option value="dwell_time">Dwell Time Exceeded</option>
                <option value="speed_breach">Speed Limit Breach</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            >
              {editingGeofence ? "Save Parameters" : "Establish Geofence"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        loading={isDeleting}
        title={`Remove ${deleteTarget?.name}?`}
        message={`Are you sure you want to deactivate and remove geofence ${deleteTarget?.name}? Automated speed and perimeter alerts will stop firing.`}
        confirmLabel="Dismantle Geofence"
        type="danger"
      />
    </div>
  );
};
