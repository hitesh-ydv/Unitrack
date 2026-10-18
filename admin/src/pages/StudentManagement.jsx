import React, { useState, useEffect } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Upload,
  QrCode,
} from "lucide-react";
import { DataTable } from "../components/common/DataTable";
import { Modal } from "../components/common/Modal";
import { ConfirmDialog } from "../components/common/ConfirmDialog";
import { studentService } from "../services/studentService";
import { busService } from "../services/busService";
import { stopService } from "../services/stopService";
import { useToast } from "../context/ToastContext";
import { parseCSVFile } from "../utils/csvUtils";

export const StudentManagement = () => {
  const [students, setStudents] = useState([]);
  const [buses, setBuses] = useState([]);
  const [stops, setStops] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal & Dialog state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeQrModalStudent, setActiveQrModalStudent] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    rollNumber: "",
    department: "Computer Science & Eng.",
    year: "1st Year",
    email: "",
    phone: "",
    assignedBusId: "",
    assignedStopId: "",
    guardianName: "",
    guardianPhone: "",
    rfidCode: "",
  });

  const toast = useToast();

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [stuData, busData, stopData] = await Promise.all([
        studentService.getAll(),
        busService.getAll(),
        stopService.getAll(),
      ]);
      setStudents(stuData);
      setBuses(busData);
      setStops(stopData);
    } catch {
      toast.error("Error", "Failed to load student transit roster.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAdd = () => {
    setEditingStudent(null);
    setFormData({
      name: "",
      rollNumber: `CS-2026-${Math.floor(100 + Math.random() * 899)}`,
      department: "Computer Science & Eng.",
      year: "1st Year",
      email: "",
      phone: "+91 98765 00000",
      assignedBusId: buses[0]?.id || "",
      assignedStopId: stops[0]?.id || "",
      guardianName: "",
      guardianPhone: "+91 98111 00000",
      rfidCode: `RFID-${Math.floor(1000 + Math.random() * 9000)}-AB`,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (student) => {
    setEditingStudent(student);
    setFormData({
      name: student.name,
      rollNumber: student.rollNumber,
      department: student.department,
      year: student.year,
      email: student.email,
      phone: student.phone,
      assignedBusId: student.assignedBusId || "",
      assignedStopId: student.assignedStopId || "",
      guardianName: student.guardianName || "",
      guardianPhone: student.guardianPhone || "",
      rfidCode: student.rfidCode || "",
    });
    setIsModalOpen(true);
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.rollNumber) {
      toast.warning("Validation Error", "Please provide student name and roll number.");
      return;
    }

    const matchedBus = buses.find((b) => b.id === formData.assignedBusId);
    const matchedStop = stops.find((s) => s.id === formData.assignedStopId);

    const payload = {
      ...formData,
      assignedBusNumber: matchedBus ? matchedBus.busNumber : "Bus 101",
      assignedStopName: matchedStop ? matchedStop.name : "Central Metro Interchange",
    };

    try {
      if (editingStudent) {
        await studentService.update(editingStudent.id, payload);
        toast.success("Updated", `${payload.name}'s transit profile updated.`);
      } else {
        await studentService.create(payload);
        toast.success("Enrolled", `${payload.name} assigned to ${payload.assignedBusNumber}.`);
      }
      setIsModalOpen(false);
      loadData();
    } catch {
      toast.error("Save Error", "Could not save student transit pass.");
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await studentService.delete(deleteTarget.id);
      toast.success("Deleted", `${deleteTarget.name} removed from roster.`);
      setDeleteTarget(null);
      loadData();
    } catch {
      toast.error("Delete Error", "Could not remove student.");
    } finally {
      setIsDeleting(false);
    }
  };

  // CSV Batch Import
  const handleCSVImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const parsedRows = await parseCSVFile(file);
      if (!parsedRows.length) {
        toast.warning("Empty File", "No entries in CSV.");
        return;
      }

      await studentService.importBatch(parsedRows);
      toast.success("Batch Import", `Added ${parsedRows.length} student transit passes.`);
      loadData();
    } catch {
      toast.error("Import Error", "Failed to parse student CSV file.");
    }
  };

  const columns = [
    {
      header: "Student",
      key: "name",
      sortable: true,
      render: (val, row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center font-bold text-xs shrink-0">
            {val.split(" ").map((n) => n[0]).join("").slice(0, 2)}
          </div>
          <div>
            <span className="font-bold text-white block">{val}</span>
            <span className="text-[10px] text-slate-400 font-mono">{row.rollNumber}</span>
          </div>
        </div>
      ),
    },
    {
      header: "Department & Year",
      key: "department",
      sortable: true,
      render: (val, row) => (
        <div className="text-xs">
          <span className="text-slate-200 block truncate max-w-[150px]">{val}</span>
          <span className="text-[10px] text-indigo-400">{row.year}</span>
        </div>
      ),
    },
    {
      header: "Assigned Bus & Stop",
      key: "assignedBusNumber",
      sortable: true,
      render: (val, row) => (
        <div className="text-xs">
          <span className="font-semibold text-white block">{val}</span>
          <span className="text-[10px] text-slate-400 block truncate max-w-[170px]">
            {row.assignedStopName}
          </span>
        </div>
      ),
    },
    {
      header: "Pass Credentials",
      key: "rfidCode",
      render: (val, row) => (
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-slate-300">
            {val}
          </span>
          <button
            onClick={() => setActiveQrModalStudent(row)}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
            title="Inspect Digital QR Pass"
          >
            <QrCode className="w-3.5 h-3.5 text-cyan-400" />
          </button>
        </div>
      ),
    },
    {
      header: "Guardian",
      key: "guardianName",
      render: (val, row) => (
        <div className="text-xs">
          <span className="text-slate-300 block">{val || "N/A"}</span>
          <span className="text-[10px] text-slate-500">{row.guardianPhone}</span>
        </div>
      ),
    },
    {
      header: "Actions",
      key: "actions",
      render: (_, row) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handleOpenEdit(row)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Edit Student"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setDeleteTarget(row)}
            className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors cursor-pointer"
            title="Delete Student"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  const filters = [
    {
      key: "assignedBusNumber",
      label: "Bus",
      options: buses.map((b) => ({ label: b.busNumber, value: b.busNumber })),
    },
    {
      key: "year",
      label: "Year",
      options: [
        { label: "1st Year", value: "1st Year" },
        { label: "2nd Year", value: "2nd Year" },
        { label: "3rd Year", value: "3rd Year" },
        { label: "4th Year", value: "4th Year" },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Student Transit Roster</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage student bus assignments, designate pickup stops, and inspect RFID/QR pass tokens.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* CSV Import */}
          <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold cursor-pointer transition-colors">
            <Upload className="w-3.5 h-3.5 text-slate-400" />
            <span>Import Student CSV</span>
            <input
              type="file"
              accept=".csv"
              onChange={handleCSVImport}
              className="hidden"
            />
          </label>

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/25 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Enrol Student</span>
          </button>
        </div>
      </div>

      {/* Reusable Data Table */}
      <DataTable
        columns={columns}
        data={students}
        isLoading={isLoading}
        searchKey="name"
        searchPlaceholder="Search student name, roll number, or RFID..."
        filters={filters}
        csvFilename="student_transit_roster.csv"
      />

      {/* Add / Edit Student Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingStudent ? `Edit ${editingStudent.name}` : "Enrol Student for University Transit"}
        subtitle="Link student account with allocated bus route, stop, and guardian emergency contact."
      >
        <form onSubmit={handleSubmitForm} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Aarav Sharma"
                className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">University Roll Number *</label>
              <input
                type="text"
                required
                value={formData.rollNumber}
                onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                placeholder="e.g. CS-2024-042"
                className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Academic Department</label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                placeholder="e.g. Computer Science & Eng."
                className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Year of Study</label>
              <select
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              >
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
                <option value="Postgraduate / PhD">Postgraduate / PhD</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Assigned University Bus</label>
              <select
                value={formData.assignedBusId}
                onChange={(e) => setFormData({ ...formData, assignedBusId: e.target.value })}
                className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              >
                {buses.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.busNumber} ({b.routeName})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Boarding Stop</label>
              <select
                value={formData.assignedStopId}
                onChange={(e) => setFormData({ ...formData, assignedStopId: e.target.value })}
                className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              >
                {stops.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.zone})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Guardian Name</label>
              <input
                type="text"
                value={formData.guardianName}
                onChange={(e) => setFormData({ ...formData, guardianName: e.target.value })}
                placeholder="Parent / Guardian Legal Name"
                className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Guardian Phone (For SOS/Delays)</label>
              <input
                type="text"
                value={formData.guardianPhone}
                onChange={(e) => setFormData({ ...formData, guardianPhone: e.target.value })}
                placeholder="+91 98111 00000"
                className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">RFID Smartcard Serial</label>
            <input
              type="text"
              value={formData.rfidCode}
              onChange={(e) => setFormData({ ...formData, rfidCode: e.target.value })}
              placeholder="RFID-XXXX-YY"
              className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-mono"
            />
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
              {editingStudent ? "Save Changes" : "Enrol Student"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Digital QR Modal */}
      <Modal
        isOpen={!!activeQrModalStudent}
        onClose={() => setActiveQrModalStudent(null)}
        title="Digital Transit QR Pass"
        subtitle="Cryptographically verifiable mobile student boarding token"
        maxWidth="max-w-sm"
      >
        {activeQrModalStudent && (
          <div className="flex flex-col items-center text-center p-2">
            <div className="p-4 bg-white rounded-2xl shadow-xl mb-4 border-4 border-indigo-600">
              <QrCode className="w-36 h-36 text-slate-950" />
            </div>
            <h3 className="font-extrabold text-base text-white">{activeQrModalStudent.name}</h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5">{activeQrModalStudent.rollNumber}</p>
            <div className="mt-3 p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs w-full text-left space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Assigned Bus:</span>
                <span className="font-bold text-white">{activeQrModalStudent.assignedBusNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Pickup Stop:</span>
                <span className="font-bold text-white truncate max-w-[170px]">{activeQrModalStudent.assignedStopName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Token ID:</span>
                <span className="font-mono text-indigo-400 font-semibold">{activeQrModalStudent.qrPassCode}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        loading={isDeleting}
        title={`Revoke pass for ${deleteTarget?.name}?`}
        message={`Are you sure you want to cancel the transit pass for ${deleteTarget?.name} (${deleteTarget?.rollNumber})?`}
        confirmLabel="Revoke Pass"
        type="danger"
      />
    </div>
  );
};
