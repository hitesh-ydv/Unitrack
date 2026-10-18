import React, { useState, useEffect } from "react";
import {
  Users2,
  Plus,
  Edit2,
  Trash2,
  Star,
  Phone,
  Mail,
  Shield,
  Clock,
  Award,
  AlertTriangle,
} from "lucide-react";
import { DataTable } from "../components/common/DataTable";
import { StatusBadge } from "../components/common/StatusBadge";
import { Modal } from "../components/common/Modal";
import { ConfirmDialog } from "../components/common/ConfirmDialog";
import { driverService } from "../services/driverService";
import { busService } from "../services/busService";
import { useToast } from "../context/ToastContext";
import { StatCard } from "../components/common/StatCard";

export const DriverManagement = () => {
  const [drivers, setDrivers] = useState([]);
  const [buses, setBuses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal & Dialog state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    licenseNumber: "",
    phone: "",
    email: "",
    assignedBusId: "",
    status: "on_duty",
    shift: "Morning & Evening",
    rating: 4.8,
    experienceYears: 5,
    bloodGroup: "O+",
  });

  const toast = useToast();

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [driverData, busData] = await Promise.all([
        driverService.getAll(),
        busService.getAll(),
      ]);
      setDrivers(driverData);
      setBuses(busData);
    } catch {
      toast.error("Error", "Failed to load drivers.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAdd = () => {
    setEditingDriver(null);
    setFormData({
      name: "",
      licenseNumber: "DL-04202400" + Math.floor(1000 + Math.random() * 9000),
      phone: "+91 98450 00000",
      email: "",
      assignedBusId: buses[0]?.id || "",
      status: "on_duty",
      shift: "Morning & Evening",
      rating: 4.8,
      experienceYears: 6,
      bloodGroup: "B+",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (driver) => {
    setEditingDriver(driver);
    setFormData({
      name: driver.name,
      licenseNumber: driver.licenseNumber,
      phone: driver.phone,
      email: driver.email,
      assignedBusId: driver.assignedBusId || "",
      status: driver.status,
      shift: driver.shift,
      rating: driver.rating,
      experienceYears: driver.experienceYears,
      bloodGroup: driver.bloodGroup || "O+",
    });
    setIsModalOpen(true);
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.licenseNumber || !formData.phone) {
      toast.warning("Validation Error", "Please fill in all required fields.");
      return;
    }

    const matchedBus = buses.find((b) => b.id === formData.assignedBusId);

    const payload = {
      ...formData,
      rating: Number(formData.rating),
      experienceYears: Number(formData.experienceYears),
      assignedBusNumber: matchedBus ? matchedBus.busNumber : "Unassigned",
      shiftHoursToday: editingDriver ? editingDriver.shiftHoursToday : 4.5,
    };

    try {
      if (editingDriver) {
        await driverService.update(editingDriver.id, payload);
        toast.success("Driver Updated", `${payload.name} details saved.`);
      } else {
        await driverService.create(payload);
        toast.success("Driver Enrolled", `${payload.name} added to transit staff.`);
      }
      setIsModalOpen(false);
      loadData();
    } catch {
      toast.error("Save Error", "Unable to save driver profile.");
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await driverService.delete(deleteTarget.id);
      toast.success("Driver Removed", `${deleteTarget.name} profile deleted.`);
      setDeleteTarget(null);
      loadData();
    } catch {
      toast.error("Delete Error", "Could not remove driver.");
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = [
    {
      header: "Driver Details",
      key: "name",
      sortable: true,
      render: (val, row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-indigo-400 shrink-0">
            {val.split(" ").map((n) => n[0]).join("").slice(0, 2)}
          </div>
          <div>
            <span className="font-bold text-white block">{val}</span>
            <span className="text-[10px] text-slate-400 font-mono">{row.licenseNumber}</span>
          </div>
        </div>
      ),
    },
    {
      header: "Contact Phone",
      key: "phone",
      sortable: true,
      render: (val) => (
        <span className="flex items-center gap-1.5 text-xs text-slate-300">
          <Phone className="w-3.5 h-3.5 text-slate-500" />
          {val}
        </span>
      ),
    },
    {
      header: "Assigned Bus",
      key: "assignedBusNumber",
      sortable: true,
      render: (val) => (
        <span className="font-semibold text-indigo-400">{val || "Unassigned"}</span>
      ),
    },
    {
      header: "Duty Shift",
      key: "shift",
      sortable: true,
      render: (val, row) => (
        <div className="text-xs">
          <span>{val}</span>
          <span className="text-[10px] text-slate-500 block">{row.shiftHoursToday}h logged today</span>
        </div>
      ),
    },
    {
      header: "Safety Rating",
      key: "rating",
      sortable: true,
      render: (val) => (
        <div className="flex items-center gap-1 text-xs font-bold text-amber-400">
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          <span>{val} / 5.0</span>
        </div>
      ),
    },
    {
      header: "Experience",
      key: "experienceYears",
      sortable: true,
      render: (val) => `${val} yrs`,
    },
    {
      header: "Incidents",
      key: "incidentCount",
      sortable: true,
      render: (val) => (
        <span
          className={`font-semibold ${
            val > 0 ? "text-rose-400" : "text-emerald-400"
          }`}
        >
          {val} incident{val === 1 ? "" : "s"}
        </span>
      ),
    },
    {
      header: "Duty Status",
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
            title="Edit Driver"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setDeleteTarget(row)}
            className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors cursor-pointer"
            title="Delete Driver"
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
        { label: "On Duty", value: "on_duty" },
        { label: "Off Duty", value: "off_duty" },
        { label: "On Leave", value: "on_leave" },
      ],
    },
  ];

  const onDutyCount = drivers.filter((d) => d.status === "on_duty").length;
  const zeroIncidentCount = drivers.filter((d) => d.incidentCount === 0).length;

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Driver Roster & Shift Management</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Monitor driver safety ratings, duty allocations, shift hours, and licensing records.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/25 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Enrol Driver</span>
        </button>
      </div>

      {/* Driver Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          title="Total Staff"
          value={drivers.length}
          subtext="Licensed commercial drivers"
          icon={Users2}
          color="blue"
        />
        <StatCard
          title="Active On Duty"
          value={onDutyCount}
          subtext="Assigned to morning routes"
          icon={Clock}
          color="emerald"
        />
        <StatCard
          title="Avg Safety Rating"
          value="4.8"
          subtext="Based on student reviews"
          icon={Star}
          color="amber"
        />
        <StatCard
          title="Zero Incidents"
          value={`${zeroIncidentCount} / ${drivers.length}`}
          subtext="Impeccable driving records"
          icon={Award}
          color="purple"
        />
      </div>

      {/* Reusable Data Table */}
      <DataTable
        columns={columns}
        data={drivers}
        isLoading={isLoading}
        searchKey="name"
        searchPlaceholder="Search driver name or license..."
        filters={filters}
        csvFilename="drivers_roster.csv"
      />

      {/* Add / Edit Driver Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingDriver ? `Edit ${editingDriver.name}` : "Enrol New University Driver"}
        subtitle="Record commercial driving license, assign vehicle, and set shift schedule."
      >
        <form onSubmit={handleSubmitForm} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Full Legal Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Ramesh Chandra"
                className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Commercial DL Number *</label>
              <input
                type="text"
                required
                value={formData.licenseNumber}
                onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                placeholder="DL-04201800..."
                className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number *</label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98450 00000"
                className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="name@unitrack-drivers.edu"
                className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Duty Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              >
                <option value="on_duty">On Duty</option>
                <option value="off_duty">Off Duty</option>
                <option value="on_leave">On Leave</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Shift Type</label>
              <select
                value={formData.shift}
                onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
                className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              >
                <option value="Morning & Evening">Morning & Evening</option>
                <option value="Morning Shift Only">Morning Shift Only</option>
                <option value="Evening Shift Only">Evening Shift Only</option>
                <option value="Depot Standby">Depot Standby</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Experience (Years)</label>
              <input
                type="number"
                min="1"
                max="40"
                value={formData.experienceYears}
                onChange={(e) => setFormData({ ...formData, experienceYears: e.target.value })}
                className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Assigned Vehicle</label>
            <select
              value={formData.assignedBusId}
              onChange={(e) => setFormData({ ...formData, assignedBusId: e.target.value })}
              className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
            >
              <option value="">Unassigned</option>
              {buses.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.busNumber} ({b.plateNumber}) - {b.model}
                </option>
              ))}
            </select>
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
              {editingDriver ? "Save Changes" : "Enrol Driver"}
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
        message={`Are you sure you want to delete driver profile for ${deleteTarget?.name}? Their bus assignments will revert to unassigned.`}
        confirmLabel="Remove Driver"
        type="danger"
      />
    </div>
  );
};
