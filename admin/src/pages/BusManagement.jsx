import React, { useState, useEffect } from "react";
import {
  Bus,
  Plus,
  Edit2,
  Trash2,
  Upload,
  Fuel,
  BatteryCharging,
  Gauge,
  CheckCircle,
  Route as RouteIcon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DataTable } from "../components/common/DataTable";
import { StatusBadge } from "../components/common/StatusBadge";
import { Modal } from "../components/common/Modal";
import { ConfirmDialog } from "../components/common/ConfirmDialog";
import { busService } from "../services/busService";
import { driverService } from "../services/driverService";
import { routeService } from "../services/routeService";
import { useToast } from "../context/ToastContext";
import { parseCSVFile } from "../utils/csvUtils";

export const BusManagement = () => {
  const navigate = useNavigate();
  const [buses, setBuses] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal & Dialog state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBus, setEditingBus] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    busNumber: "",
    plateNumber: "",
    model: "",
    capacity: 50,
    fuelType: "CNG",
    fuelLevelPercent: 85,
    status: "active",
    assignedDriverId: "",
    routeId: "",
    odometerKm: 25000,
  });

  const toast = useToast();

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [busData, driverData, routeData] = await Promise.all([
        busService.getAll(),
        driverService.getAll(),
        routeService.getAll(),
      ]);
      setBuses(busData);
      setDrivers(driverData);
      setRoutes(routeData);
    } catch {
      toast.error("Data Load Error", "Failed to fetch buses data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAdd = () => {
    setEditingBus(null);
    setFormData({
      busNumber: `Bus ${buses.length + 101}`,
      plateNumber: "KA-05-XX-1234",
      model: "Tata Marcopolo CityRide",
      capacity: 50,
      fuelType: "CNG",
      fuelLevelPercent: 90,
      status: "active",
      assignedDriverId: drivers[0]?.id || "",
      routeId: routes[0]?.id || "",
      odometerKm: 20000,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (bus) => {
    setEditingBus(bus);
    setFormData({
      busNumber: bus.busNumber,
      plateNumber: bus.plateNumber,
      model: bus.model,
      capacity: bus.capacity,
      fuelType: bus.fuelType,
      fuelLevelPercent: bus.fuelLevelPercent,
      status: bus.status,
      assignedDriverId: bus.assignedDriverId || "",
      routeId: bus.routeId || "",
      odometerKm: bus.odometerKm,
    });
    setIsModalOpen(true);
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!formData.busNumber || !formData.plateNumber) {
      toast.warning("Validation Error", "Please fill in all required fields.");
      return;
    }

    const matchedDriver = drivers.find((d) => d.id === formData.assignedDriverId);
    const matchedRoute = routes.find((r) => r.id === formData.routeId);

    const payload = {
      ...formData,
      capacity: Number(formData.capacity),
      fuelLevelPercent: Number(formData.fuelLevelPercent),
      odometerKm: Number(formData.odometerKm),
      assignedDriverName: matchedDriver ? matchedDriver.name : "Unassigned",
      assignedDriverPhone: matchedDriver ? matchedDriver.phone : "N/A",
      routeName: matchedRoute ? matchedRoute.name : "Unassigned",
      currentOccupancy: editingBus ? editingBus.currentOccupancy : 0,
      delayMinutes: editingBus ? editingBus.delayMinutes : 0,
      speedKmh: editingBus ? editingBus.speedKmh : 0,
      currentLat: editingBus ? editingBus.currentLat : 12.9716,
      currentLng: editingBus ? editingBus.currentLng : 77.5946,
    };

    try {
      if (editingBus) {
        await busService.update(editingBus.id, payload);
        toast.success("Bus Updated", `${payload.busNumber} record saved.`);
      } else {
        await busService.create(payload);
        toast.success("Bus Created", `${payload.busNumber} added to active fleet.`);
      }
      setIsModalOpen(false);
      loadData();
    } catch {
      toast.error("Save Error", "Unable to save bus record.");
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await busService.delete(deleteTarget.id);
      toast.success("Bus Removed", `${deleteTarget.busNumber} deleted from system.`);
      setDeleteTarget(null);
      loadData();
    } catch {
      toast.error("Delete Error", "Could not remove bus.");
    } finally {
      setIsDeleting(false);
    }
  };

  // CSV Import handler
  const handleCSVImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const parsedRows = await parseCSVFile(file);
      if (!parsedRows.length) {
        toast.warning("Empty File", "No records found in CSV file.");
        return;
      }

      for (const row of parsedRows) {
        await busService.create({
          busNumber: row.busNumber || row["Bus #"] || "Bus New",
          plateNumber: row.plateNumber || row["Plate"] || "KA-XX-0000",
          model: row.model || "Commercial Transit",
          capacity: Number(row.capacity) || 50,
          fuelType: row.fuelType || "Diesel",
          fuelLevelPercent: 80,
          status: "active",
          odometerKm: Number(row.odometerKm) || 10000,
        });
      }

      toast.success("Import Finished", `Imported ${parsedRows.length} buses.`);
      loadData();
    } catch {
      toast.error("Import Failed", "Invalid CSV file format.");
    }
  };

  const columns = [
    {
      header: "Bus #",
      key: "busNumber",
      sortable: true,
      render: (val, row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">
            <Bus className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-white block">{val}</span>
            <span className="text-[10px] text-slate-400 font-mono">{row.plateNumber}</span>
          </div>
        </div>
      ),
    },
    {
      header: "Vehicle Model",
      key: "model",
      sortable: true,
    },
    {
      header: "Capacity",
      key: "capacity",
      sortable: true,
      render: (val, row) => (
        <div className="text-xs">
          <span className="font-semibold text-white">{row.currentOccupancy || 0}</span> / {val} seats
          <div className="w-20 h-1.5 bg-slate-800 rounded-full mt-1 overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full"
              style={{ width: `${Math.min(100, ((row.currentOccupancy || 0) / val) * 100)}%` }}
            />
          </div>
        </div>
      ),
    },
    {
      header: "Fuel / Charge",
      key: "fuelType",
      sortable: true,
      render: (val, row) => (
        <div className="flex items-center gap-1.5 text-xs">
          {val.includes("EV") ? (
            <BatteryCharging className="w-3.5 h-3.5 text-cyan-400" />
          ) : (
            <Fuel className="w-3.5 h-3.5 text-amber-400" />
          )}
          <span>{val}</span>
          <span className="font-bold text-slate-200">({row.fuelLevelPercent}%)</span>
        </div>
      ),
    },
    {
      header: "Assigned Driver",
      key: "assignedDriverName",
      sortable: true,
      render: (val) => <span className="font-medium text-slate-200">{val || "Unassigned"}</span>,
    },
    {
      header: "Current Route",
      key: "routeName",
      sortable: true,
      render: (val) => <span className="text-slate-300 truncate max-w-[150px] block">{val}</span>,
    },
    {
      header: "Odometer",
      key: "odometerKm",
      sortable: true,
      render: (val) => `${val?.toLocaleString()} km`,
    },
    {
      header: "Fleet Status",
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
            onClick={() => navigate("/routes")}
            className="p-1.5 rounded-lg text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 transition-colors cursor-pointer"
            title="Build / View Bus Route on Map"
          >
            <RouteIcon className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleOpenEdit(row)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Edit Bus"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setDeleteTarget(row)}
            className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors cursor-pointer"
            title="Delete Bus"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  const filters = [
    {
      key: "status",
      label: "Status",
      options: [
        { label: "Active", value: "active" },
        { label: "Maintenance", value: "maintenance" },
        { label: "Out of Service", value: "out_of_service" },
      ],
    },
    {
      key: "fuelType",
      label: "Fuel",
      options: [
        { label: "CNG", value: "CNG" },
        { label: "Electric (EV)", value: "Electric (EV)" },
        { label: "Diesel", value: "Diesel" },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Bus Fleet Management</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Register, configure, inspect telemetry, and manage university campus transport vehicles.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* CSV Import */}
          <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold cursor-pointer transition-colors">
            <Upload className="w-3.5 h-3.5 text-slate-400" />
            <span>Import CSV</span>
            <input
              type="file"
              accept=".csv"
              onChange={handleCSVImport}
              className="hidden"
            />
          </label>

          {/* Add Bus Button */}
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/25 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Register Bus</span>
          </button>
        </div>
      </div>

      {/* Reusable Data Table */}
      <DataTable
        columns={columns}
        data={buses}
        isLoading={isLoading}
        searchKey="busNumber"
        searchPlaceholder="Search bus number, plate or driver..."
        filters={filters}
        csvFilename="university_buses_fleet.csv"
      />

      {/* Add / Edit Bus Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingBus ? `Edit ${editingBus.busNumber}` : "Register New University Bus"}
        subtitle="Specify vehicle hardware, seating capacity, and driver assignment."
      >
        <form onSubmit={handleSubmitForm} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Bus Number *</label>
              <input
                type="text"
                required
                value={formData.busNumber}
                onChange={(e) => setFormData({ ...formData, busNumber: e.target.value })}
                placeholder="e.g. Bus 107"
                className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">License Plate Number *</label>
              <input
                type="text"
                required
                value={formData.plateNumber}
                onChange={(e) => setFormData({ ...formData, plateNumber: e.target.value })}
                placeholder="e.g. KA-05-MN-9921"
                className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Make & Model</label>
              <input
                type="text"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                placeholder="e.g. Tata Marcopolo CityRide"
                className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Seating Capacity</label>
              <input
                type="number"
                min="10"
                max="100"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Fuel Type</label>
              <select
                value={formData.fuelType}
                onChange={(e) => setFormData({ ...formData, fuelType: e.target.value })}
                className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              >
                <option value="CNG">CNG</option>
                <option value="Electric (EV)">Electric (EV)</option>
                <option value="Diesel">Diesel</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Fuel / Battery Level %</label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.fuelLevelPercent}
                onChange={(e) => setFormData({ ...formData, fuelLevelPercent: e.target.value })}
                className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Fleet Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              >
                <option value="active">Active</option>
                <option value="maintenance">Maintenance</option>
                <option value="out_of_service">Out of Service</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Assigned Driver</label>
              <select
                value={formData.assignedDriverId}
                onChange={(e) => setFormData({ ...formData, assignedDriverId: e.target.value })}
                className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              >
                <option value="">Unassigned</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.phone})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Assigned Route</label>
              <select
                value={formData.routeId}
                onChange={(e) => setFormData({ ...formData, routeId: e.target.value })}
                className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              >
                <option value="">Unassigned</option>
                {routes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
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
              {editingBus ? "Save Changes" : "Register Bus"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        loading={isDeleting}
        title={`Delete ${deleteTarget?.busNumber}?`}
        message={`Are you sure you want to decommission and remove ${deleteTarget?.busNumber} (${deleteTarget?.plateNumber})? All associated telemetry and trip assignments will be dissociated.`}
        confirmLabel="Decommission & Delete"
        type="danger"
      />
    </div>
  );
};
