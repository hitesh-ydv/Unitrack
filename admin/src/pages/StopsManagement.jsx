import React, { useState, useEffect, useRef } from "react";
import {
  MapPin,
  Plus,
  Edit2,
  Trash2,
  Clock,
  Shield,
  Home,
  CheckCircle2,
  XCircle,
  Compass,
  Map as MapIcon,
  List,
  Sparkles,
  Upload,
  Download,
  AlertCircle,
  FileSpreadsheet,
  X,
  Search,
} from "lucide-react";
import { DataTable } from "../components/common/DataTable";
import { Modal } from "../components/common/Modal";
import { ConfirmDialog } from "../components/common/ConfirmDialog";
import { GoogleStopPickerMap } from "../components/googleMap/GoogleStopPickerMap";
import { GoogleStopsCatalogMap } from "../components/googleMap/GoogleStopsCatalogMap";
import { stopService } from "../services/stopService";
import { routeService, UNIVERSITY_LOCATION } from "../services/routeService";
import { useGoogleMapsLoader } from "../hooks/useGoogleMapsLoader";
import { useToast } from "../context/ToastContext";
import { exportToCSV, parseCSVFile } from "../utils/csvUtils";

export const StopsManagement = () => {
  const [stops, setStops] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState("table"); // "table" | "map"

  // Google Maps dynamic loader
  const { isLoaded, loadError, apiKey, updateApiKey } = useGoogleMapsLoader();

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStop, setEditingStop] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // CSV Import State
  const fileInputRef = useRef(null);
  const [csvPreviewData, setCsvPreviewData] = useState(null); // { validNew: [], duplicates: [], invalid: [] }
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    lat: UNIVERSITY_LOCATION.lat,
    lng: UNIVERSITY_LOCATION.lng,
    geofenceRadiusMeters: 75,
    zone: "Metro City Core",
    morningTime: "07:30 AM",
    eveningTime: "05:30 PM",
    hasShelter: true,
    hasCctv: true,
  });

  const toast = useToast();

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await stopService.getAll();
      setStops(data || []);
    } catch {
      toast.error("Error", "Failed to load stops.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAdd = () => {
    setEditingStop(null);
    setFormData({
      name: "",
      code: `S-${Math.floor(100 + Math.random() * 899)}`,
      lat: 12.9750,
      lng: 77.6050,
      geofenceRadiusMeters: 80,
      zone: "University Corridor",
      morningTime: "07:30 AM",
      eveningTime: "05:30 PM",
      hasShelter: true,
      hasCctv: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (stop) => {
    setEditingStop(stop);
    setFormData({
      name: stop.name || "",
      code: stop.code || "",
      lat: Number(stop.lat) || UNIVERSITY_LOCATION.lat,
      lng: Number(stop.lng) || UNIVERSITY_LOCATION.lng,
      geofenceRadiusMeters: Number(stop.geofenceRadiusMeters) || 75,
      zone: stop.zone || "Metro City Core",
      morningTime: stop.morningTime || "07:30 AM",
      eveningTime: stop.eveningTime || "05:30 PM",
      hasShelter: Boolean(stop.hasShelter),
      hasCctv: Boolean(stop.hasCctv),
    });
    setIsModalOpen(true);
  };

  // Callback from GoogleStopPickerMap when address is searched or marker is dragged
  const handleLocationPickerChange = ({ lat, lng, suggestedName }) => {
    setFormData((prev) => {
      const isAutoName = !prev.name || prev.name.startsWith("Stop @") || prev.name.startsWith("New Stop");
      return {
        ...prev,
        lat,
        lng,
        name: suggestedName && isAutoName ? suggestedName : prev.name || suggestedName || "",
      };
    });
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.code) {
      toast.warning("Validation Error", "Please provide a name and stop code.");
      return;
    }

    const latNum = Number(formData.lat);
    const lngNum = Number(formData.lng);
    const radiusNum = Number(formData.geofenceRadiusMeters);

    if (isNaN(latNum) || latNum < -90 || latNum > 90) {
      toast.warning("Invalid Latitude", "Latitude must be a valid number between -90 and 90.");
      return;
    }
    if (isNaN(lngNum) || lngNum < -180 || lngNum > 180) {
      toast.warning("Invalid Longitude", "Longitude must be a valid number between -180 and 180.");
      return;
    }
    if (isNaN(radiusNum) || radiusNum <= 0) {
      toast.warning("Invalid Radius", "Geofence radius must be a positive number of meters.");
      return;
    }

    const payload = {
      ...formData,
      lat: latNum,
      lng: lngNum,
      geofenceRadiusMeters: radiusNum,
    };

    try {
      if (editingStop) {
        await stopService.update(editingStop.id, payload);
        toast.success("Stop Updated", `Saved updates to "${payload.name}".`);
      } else {
        await stopService.create(payload);
        toast.success("Stop Registered", `Added "${payload.name}" to transit network.`);
      }
      setIsModalOpen(false);
      loadData();
    } catch {
      toast.error("Save Error", "Unable to save transit stop.");
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await stopService.delete(deleteTarget.id);
      toast.success("Stop Deleted", `Removed "${deleteTarget.name}".`);
      setDeleteTarget(null);
      loadData();
    } catch {
      toast.error("Delete Error", "Could not remove stop.");
    } finally {
      setIsDeleting(false);
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    if (!stops.length) {
      toast.warning("Empty Catalog", "No stops available to export.");
      return;
    }

    const exportRows = stops.map((s) => ({
      name: s.name,
      code: s.code,
      latitude: s.lat,
      longitude: s.lng,
      geofenceRadiusMeters: s.geofenceRadiusMeters || 75,
      morningTime: s.morningTime || "07:30 AM",
      eveningTime: s.eveningTime || "05:30 PM",
      zone: s.zone || "Metro Zone",
      hasShelter: s.hasShelter ? "true" : "false",
      hasCctv: s.hasCctv ? "true" : "false",
    }));

    exportToCSV(exportRows, `transit_stops_${new Date().toISOString().slice(0, 10)}.csv`);
    toast.success("CSV Exported", `Downloaded ${stops.length} stops.`);
  };

  // CSV Import with Validation & Duplicate Detection
  const handleCSVFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const parsedRows = await parseCSVFile(file);
      if (!parsedRows || !parsedRows.length) {
        toast.warning("Empty File", "No records found in CSV file.");
        return;
      }

      const validNew = [];
      const duplicates = [];
      const invalid = [];
      const seenCodes = new Set();
      const seenNames = new Set();

      parsedRows.forEach((row, idx) => {
        const rowNum = idx + 2;
        const name = (row.name || row.Name || row.stopName || row["Stop Name"] || "").trim();
        const code = (row.code || row.Code || row.stopCode || row["Stop Code"] || `S-${Math.floor(100 + Math.random() * 899)}`).trim();
        const rawLat = row.latitude || row.Latitude || row.lat || row.Lat;
        const rawLng = row.longitude || row.Longitude || row.lng || row.Lng;
        const rawRadius = row.geofenceRadiusMeters || row.radius || row.Radius || 75;
        const morningTime = (row.morningTime || row.morning || row["Morning Arrival"] || "07:30 AM").trim();
        const eveningTime = (row.eveningTime || row.evening || row["Evening Return"] || "05:30 PM").trim();
        const zone = (row.zone || row.Zone || "Metro Zone").trim();
        const hasShelter = row.hasShelter === "true" || row.hasShelter === true || row.hasShelter === "1" || row.hasShelter === "Yes";
        const hasCctv = row.hasCctv === "true" || row.hasCctv === true || row.hasCctv === "1" || row.hasCctv === "Yes";

        if (!name) {
          invalid.push({ rowNum, reason: "Missing Stop Name", raw: row });
          return;
        }

        const lat = parseFloat(rawLat);
        const lng = parseFloat(rawLng);
        const radius = parseFloat(rawRadius) || 75;

        if (isNaN(lat) || lat < -90 || lat > 90) {
          invalid.push({ rowNum, reason: `Invalid Latitude "${rawLat}" (must be -90 to 90)`, raw: row });
          return;
        }
        if (isNaN(lng) || lng < -180 || lng > 180) {
          invalid.push({ rowNum, reason: `Invalid Longitude "${rawLng}" (must be -180 to 180)`, raw: row });
          return;
        }

        const normalizedStop = {
          name,
          code,
          lat,
          lng,
          geofenceRadiusMeters: radius,
          morningTime,
          eveningTime,
          zone,
          hasShelter,
          hasCctv,
        };

        const matchExisting = stops.find(
          (s) =>
            s.code?.toLowerCase() === code.toLowerCase() ||
            s.name?.toLowerCase() === name.toLowerCase() ||
            (Math.abs(s.lat - lat) < 0.0003 && Math.abs(s.lng - lng) < 0.0003)
        );

        const inBatchDuplicate = seenCodes.has(code.toLowerCase()) || seenNames.has(name.toLowerCase());

        if (matchExisting) {
          duplicates.push({
            rowNum,
            stop: normalizedStop,
            matchedWith: matchExisting,
            reason: `Matches existing stop "${matchExisting.name}" (${matchExisting.code})`,
          });
        } else if (inBatchDuplicate) {
          duplicates.push({
            rowNum,
            stop: normalizedStop,
            reason: "Duplicate entry inside this CSV file",
          });
        } else {
          seenCodes.add(code.toLowerCase());
          seenNames.add(name.toLowerCase());
          validNew.push(normalizedStop);
        }
      });

      setCsvPreviewData({
        fileName: file.name,
        totalRows: parsedRows.length,
        validNew,
        duplicates,
        invalid,
      });

      setIsImportModalOpen(true);
    } catch {
      toast.error("Parse Error", "Failed to read CSV. Check file formatting.");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleConfirmImport = async (includeDuplicates = false) => {
    if (!csvPreviewData) return;
    setIsImporting(true);

    try {
      let stopsToSave = [...csvPreviewData.validNew];
      if (includeDuplicates) {
        const dupStops = csvPreviewData.duplicates.map((d) => d.stop);
        stopsToSave = [...stopsToSave, ...dupStops];
      }

      if (stopsToSave.length === 0) {
        toast.warning("No Stops", "No stops to import.");
        setIsImportModalOpen(false);
        return;
      }

      await stopService.importBatch(stopsToSave);
      toast.success(
        "Import Successful",
        `Imported ${stopsToSave.length} transit stops into Stop Management.`
      );
      setIsImportModalOpen(false);
      setCsvPreviewData(null);
      loadData();
    } catch {
      toast.error("Import Error", "Failed to save imported stops.");
    } finally {
      setIsImporting(false);
    }
  };

  // Table Columns
  const columns = [
    {
      header: "Stop Name & Code",
      key: "name",
      sortable: true,
      render: (val, row) => {
        const isUniv = row.code === "S-001" || row.name?.toLowerCase().includes("university");
        return (
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                isUniv
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                  : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
              }`}
            >
              {isUniv ? "🏛️" : <MapPin className="w-4 h-4" />}
            </div>
            <div>
              <span className="font-bold text-white block flex items-center gap-1.5">
                {val}
                {isUniv && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
                    Campus Hub
                  </span>
                )}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {row.code} &bull; <span className="text-slate-300">{row.zone}</span>
              </span>
            </div>
          </div>
        );
      },
    },
    {
      header: "Geofence (GPS & Radius)",
      key: "lat",
      sortable: true,
      render: (val, row) => (
        <div className="space-y-1">
          <div className="font-mono text-xs text-slate-200 flex items-center gap-1.5">
            <span className="text-slate-400">Lat:</span> {Number(val).toFixed(4)}
            <span className="text-slate-500">&bull;</span>
            <span className="text-slate-400">Lng:</span> {Number(row.lng).toFixed(4)}
          </div>
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-950/60 border border-indigo-500/30 text-[10px] font-semibold text-indigo-300">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
            <span>Radius: {row.geofenceRadiusMeters || 75}m</span>
          </div>
        </div>
      ),
    },
    {
      header: "Morning Timing",
      key: "morningTime",
      sortable: true,
      render: (val) => (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-semibold text-xs font-mono">
          <Clock className="w-3.5 h-3.5 text-emerald-400" />
          <span>{val || "07:30 AM"}</span>
        </div>
      ),
    },
    {
      header: "Evening Timing",
      key: "eveningTime",
      sortable: true,
      render: (val) => (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-semibold text-xs font-mono">
          <Clock className="w-3.5 h-3.5 text-indigo-400" />
          <span>{val || "05:30 PM"}</span>
        </div>
      ),
    },
    {
      header: "Amenities",
      key: "hasShelter",
      render: (_, row) => (
        <div className="flex items-center gap-1.5 text-xs">
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
              row.hasShelter
                ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                : "bg-slate-800 text-slate-500 border-slate-700"
            }`}
          >
            {row.hasShelter ? "Shelter" : "No Shelter"}
          </span>
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
              row.hasCctv
                ? "bg-blue-500/10 text-blue-300 border-blue-500/20"
                : "bg-slate-800 text-slate-500 border-slate-700"
            }`}
          >
            {row.hasCctv ? "CCTV Active" : "No CCTV"}
          </span>
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
            title="Edit Stop Details"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setDeleteTarget(row)}
            className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors cursor-pointer"
            title="Delete Stop"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header and Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold text-emerald-400">Google Maps API Enabled</span>
            <span className="text-xs text-slate-600">&bull;</span>
            <span className="text-xs text-slate-400">{stops.length} Registered Stops</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Transit Stops Management
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Search addresses on Google Maps, pinpoint or drag markers, configure geofence radius & timetables, and batch import/export CSV.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View toggle (Table vs Map) */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1">
            <button
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                viewMode === "table"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
            <button
              onClick={() => setViewMode("map")}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                viewMode === "map"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>Map View</span>
            </button>
          </div>

          {/* Export CSV Button */}
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold cursor-pointer transition-colors"
            title="Export all stops to CSV format"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Export CSV</span>
          </button>

          {/* Import CSV Button */}
          <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold cursor-pointer transition-colors">
            <Upload className="w-3.5 h-3.5 text-indigo-400" />
            <span>Import CSV</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleCSVFileChange}
              className="hidden"
            />
          </label>

          {/* Add Stop Button */}
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Stop</span>
          </button>
        </div>
      </div>

      {/* Main View: Interactive Google Map or Data Table */}
      {viewMode === "map" ? (
        <GoogleStopsCatalogMap
          stops={stops}
          onEditStop={handleOpenEdit}
          isLoaded={isLoaded}
        />
      ) : (
        <DataTable
          columns={columns}
          data={stops}
          isLoading={isLoading}
          searchKey="name"
          searchPlaceholder="Search stop name, code, or zone..."
          csvFilename="transit_stops_catalog.csv"
        />
      )}

      {/* Manual Add / Edit Stop Modal with Google Maps Address Search, Draggable Marker & Live Geofence Circle */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingStop ? `Edit Stop: ${editingStop.name}` : "Add New Transit Stop"}
        subtitle="Search an address on Google Maps, click or drag the marker to pinpoint, and set geofence radius."
        maxWidth="max-w-4xl"
      >
        <form onSubmit={handleSubmitForm} className="space-y-4">
          {/* Basic Stop Information */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Stop Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Central Metro Interchange"
                className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Stop Code *
              </label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="e.g. S-101"
                className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
          </div>

          {/* Google Maps Geofence Configuration with Address Search, Draggable Pin & Circle */}
          <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-indigo-400" />
                Google Maps Location & Geofence
              </span>
              <span className="text-[11px] text-slate-400">
                Search address, click map, or drag marker
              </span>
            </div>

            {/* Google Stop Picker Map with Places Autocomplete & Draggable Marker */}
            <GoogleStopPickerMap
              lat={formData.lat}
              lng={formData.lng}
              radius={formData.geofenceRadiusMeters}
              onLocationChange={handleLocationPickerChange}
              isLoaded={isLoaded}
              apiKey={apiKey}
            />

            {/* Coordinate Numeric Inputs & Geofence Radius */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Latitude (-90 to 90) *
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={formData.lat}
                  onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                  placeholder="12.9750"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Longitude (-180 to 180) *
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={formData.lng}
                  onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
                  placeholder="77.6050"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Geofence Radius (meters) *
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="10"
                    max="500"
                    required
                    value={formData.geofenceRadiusMeters}
                    onChange={(e) =>
                      setFormData({ ...formData, geofenceRadiusMeters: e.target.value })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                  <div className="flex items-center gap-1 shrink-0">
                    {[50, 75, 100].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, geofenceRadiusMeters: preset })
                        }
                        className={`px-2 py-1.5 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer ${
                          Number(formData.geofenceRadiusMeters) === preset
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-800 text-slate-400 hover:text-white"
                        }`}
                      >
                        {preset}m
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Timings & Zone */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Morning Arrival Timing
              </label>
              <input
                type="text"
                value={formData.morningTime}
                onChange={(e) => setFormData({ ...formData, morningTime: e.target.value })}
                placeholder="07:30 AM"
                className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Evening Return Timing
              </label>
              <input
                type="text"
                value={formData.eveningTime}
                onChange={(e) => setFormData({ ...formData, eveningTime: e.target.value })}
                placeholder="05:30 PM"
                className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Zone / Sector
              </label>
              <input
                type="text"
                value={formData.zone}
                onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
                placeholder="e.g. North Suburbs"
                className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Amenities Checkboxes */}
          <div className="flex items-center gap-6 pt-1">
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.hasShelter}
                onChange={(e) => setFormData({ ...formData, hasShelter: e.target.checked })}
                className="rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-0"
              />
              <span>Has Passenger Shelter</span>
            </label>

            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.hasCctv}
                onChange={(e) => setFormData({ ...formData, hasCctv: e.target.checked })}
                className="rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-0"
              />
              <span>Equipped with Safety CCTV</span>
            </label>
          </div>

          {/* Modal Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
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
              {editingStop ? "Save Changes" : "Register Stop"}
            </button>
          </div>
        </form>
      </Modal>

      {/* CSV Import Review & Duplicate Detection Modal */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="CSV Import Review & Validation"
        subtitle={`Reviewing entries from ${csvPreviewData?.fileName || "uploaded file"}`}
        maxWidth="max-w-3xl"
      >
        {csvPreviewData && (
          <div className="space-y-4">
            {/* Summary KPI Cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                <span className="text-[10px] text-emerald-400 font-bold uppercase block">
                  Valid New Stops
                </span>
                <span className="text-xl font-bold text-white mt-0.5 block">
                  {csvPreviewData.validNew.length}
                </span>
                <span className="text-[10px] text-slate-400">Ready to import</span>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
                <span className="text-[10px] text-amber-400 font-bold uppercase block">
                  Duplicates Detected
                </span>
                <span className="text-xl font-bold text-white mt-0.5 block">
                  {csvPreviewData.duplicates.length}
                </span>
                <span className="text-[10px] text-slate-400">Code/Name/Location match</span>
              </div>

              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-center">
                <span className="text-[10px] text-rose-400 font-bold uppercase block">
                  Invalid Rows
                </span>
                <span className="text-xl font-bold text-white mt-0.5 block">
                  {csvPreviewData.invalid.length}
                </span>
                <span className="text-[10px] text-slate-400">Missing required data</span>
              </div>
            </div>

            {/* Duplicates List */}
            {csvPreviewData.duplicates.length > 0 && (
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Duplicate Stops Found in Catalog ({csvPreviewData.duplicates.length})
                </h4>
                <div className="max-h-36 overflow-y-auto space-y-1.5 p-2 bg-slate-950/70 border border-slate-800 rounded-xl text-xs">
                  {csvPreviewData.duplicates.map((dup, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-lg bg-amber-500/5 border border-amber-500/20 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-white">{dup.stop.name}</span>{" "}
                        <span className="text-slate-400 font-mono">({dup.stop.code})</span>
                        <p className="text-[11px] text-amber-400/90 mt-0.5">{dup.reason}</p>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold">
                        Duplicate
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Invalid Rows List */}
            {csvPreviewData.invalid.length > 0 && (
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                  <XCircle className="w-3.5 h-3.5" />
                  Invalid / Malformed Rows ({csvPreviewData.invalid.length})
                </h4>
                <div className="max-h-28 overflow-y-auto space-y-1 p-2 bg-slate-950/70 border border-slate-800 rounded-xl text-xs">
                  {csvPreviewData.invalid.map((inv, idx) => (
                    <div
                      key={idx}
                      className="p-1.5 rounded-lg bg-rose-500/5 border border-rose-500/20 flex items-center justify-between text-[11px]"
                    >
                      <span className="text-slate-300 font-medium">Row #{inv.rowNum}</span>
                      <span className="text-rose-400">{inv.reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Valid New Stops Preview */}
            {csvPreviewData.validNew.length > 0 && (
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  New Stops Ready for Import ({csvPreviewData.validNew.length})
                </h4>
                <div className="max-h-36 overflow-y-auto space-y-1 p-2 bg-slate-950/70 border border-slate-800 rounded-xl text-xs">
                  {csvPreviewData.validNew.map((stop, idx) => (
                    <div
                      key={idx}
                      className="p-1.5 px-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{stop.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">({stop.code})</span>
                        <span className="text-[10px] text-indigo-400">&bull; {stop.geofenceRadiusMeters}m</span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {stop.morningTime} &bull; {stop.eveningTime}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>

              {csvPreviewData.validNew.length > 0 && (
                <button
                  type="button"
                  disabled={isImporting}
                  onClick={() => handleConfirmImport(false)}
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md transition-all cursor-pointer"
                >
                  {isImporting
                    ? "Importing..."
                    : `Import New Stops Only (${csvPreviewData.validNew.length})`}
                </button>
              )}

              {csvPreviewData.duplicates.length > 0 && (
                <button
                  type="button"
                  disabled={isImporting}
                  onClick={() => handleConfirmImport(true)}
                  className="px-4 py-2 text-xs font-semibold text-amber-200 bg-amber-600/80 hover:bg-amber-600 rounded-xl shadow-md transition-all cursor-pointer"
                >
                  {isImporting
                    ? "Updating..."
                    : `Import All & Overwrite Duplicates (${csvPreviewData.validNew.length + csvPreviewData.duplicates.length})`}
                </button>
              )}
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
        title={`Remove ${deleteTarget?.name}?`}
        message={`Are you sure you want to delete stop "${deleteTarget?.name}"? Routes using this stop will be affected.`}
        confirmLabel="Remove Stop"
        type="danger"
      />
    </div>
  );
};
