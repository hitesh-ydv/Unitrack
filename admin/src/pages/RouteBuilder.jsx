import React, { useState, useEffect } from "react";
import {
  Route as RouteIcon,
  Plus,
  Edit2,
  Trash2,
  MapPin,
  Clock,
  Compass,
  Check,
  Navigation,
  Bus,
  Sparkles,
  ChevronUp,
  ChevronDown,
  X,
  Map as MapIcon,
  RotateCcw,
  Repeat,
  ArrowRightLeft,
  List,
  Search,
  GripVertical,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { GoogleRouteMap } from "../components/googleMap/GoogleRouteMap";
import { StatusBadge } from "../components/common/StatusBadge";
import { ConfirmDialog } from "../components/common/ConfirmDialog";
import { routeService, UNIVERSITY_LOCATION } from "../services/routeService";
import { stopService } from "../services/stopService";
import { busService } from "../services/busService";
import { useGoogleMapsLoader } from "../hooks/useGoogleMapsLoader";
import { useToast } from "../context/ToastContext";

export const RouteBuilder = () => {
  const [routes, setRoutes] = useState([]);
  const [allStops, setAllStops] = useState([]);
  const [buses, setBuses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Google Maps JS API dynamic loader
  const { isLoaded, loadError, apiKey, updateApiKey } = useGoogleMapsLoader();

  // Active view: "studio" (interactive route maker) | "catalog" (list all routes)
  const [activeTab, setActiveTab] = useState("studio");

  // Route metadata
  const [routeId, setRouteId] = useState(null);
  const [routeName, setRouteName] = useState("North Campus Express");
  const [routeCode, setRouteCode] = useState("R-101");
  const [routeColor, setRouteColor] = useState("#3b82f6");
  const [operatingHours, setOperatingHours] = useState("07:00 AM - 07:00 PM");
  const [selectedBusId, setSelectedBusId] = useState("");
  const [isOutAndBack, setIsOutAndBack] = useState(true);

  // 1. Source (Starting Point) & Destination (University Terminal)
  const [sourceStop, setSourceStop] = useState(null);
  const [destinationStop, setDestinationStop] = useState(null);

  // 2. Ordered Intermediate Stops in Route (between Source & Destination)
  const [routeStops, setRouteStops] = useState([]);

  // Search & Filter Available Stops from Stop Management
  const [stopSearchQuery, setStopSearchQuery] = useState("");
  const [stopZoneFilter, setStopZoneFilter] = useState("all");
  const [isStopPickerOpen, setIsStopPickerOpen] = useState(false);

  // Drag and drop state
  const [draggedIndex, setDraggedIndex] = useState(null);

  // Snapped road route telemetry
  const [roadPolyline, setRoadPolyline] = useState([]);
  const [distanceKm, setDistanceKm] = useState(14.0);
  const [estimatedDurationMin, setEstimatedDurationMin] = useState(35);
  const [isSnapping, setIsSnapping] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [streetsTraversed, setStreetsTraversed] = useState([
    "Central Metro Corridor",
    "Campus Access Boulevard",
  ]);

  // Delete modal confirmation
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const toast = useToast();

  // Load all initial data from services
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [routeData, stopData, busData] = await Promise.all([
        routeService.getAll(),
        stopService.getAll(),
        busService.getAll(),
      ]);

      const stopsList = Array.isArray(stopData) ? stopData : [];
      setRoutes(routeData || []);
      setAllStops(stopsList);
      setBuses(busData || []);

      if (stopsList.length > 0) {
        // Find university / destination terminal
        const univStop =
          stopsList.find(
            (s) => s.isUniversity || s.code === "S-001" || /university|campus|terminal|main/i.test(s.name)
          ) || (stopsList.length > 1 ? stopsList[stopsList.length - 1] : stopsList[0]);

        // Find initial departure source
        const initialSource =
          stopsList.find((s) => s.id !== univStop?.id) || stopsList[0];

        // Intermediate stops between source and destination
        const intermediate = stopsList
          .filter((s) => s.id !== initialSource?.id && s.id !== univStop?.id)
          .slice(0, 2);

        if (!sourceStop && initialSource) {
          setSourceStop(initialSource);
        }
        if (!destinationStop && univStop) {
          setDestinationStop(univStop);
        }

        if (routeStops.length === 0) {
          setRouteStops(intermediate);
          if (initialSource && univStop) {
            triggerSnapRoad(initialSource, intermediate, univStop, isOutAndBack);
          }
        }
      }
    } catch {
      toast.error("Error", "Failed to load stops, routes, and bus fleet.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Road-following route generation: Google Maps DirectionsService with OSRM fallback
  const triggerSnapRoad = async (src, stopsList, dest, outAndBack = isOutAndBack) => {
    if (!src || !dest) return;

    setIsSnapping(true);

    // 1. Attempt road calculation via Google Maps DirectionsService if loaded
    if (window.google?.maps?.DirectionsService && src.lat && src.lng && dest.lat && dest.lng) {
      try {
        const directionsService = new window.google.maps.DirectionsService();

        const waypoints = (stopsList || [])
          .filter((s) => s.lat && s.lng)
          .slice(0, 25)
          .map((s) => ({
            location: new window.google.maps.LatLng(Number(s.lat), Number(s.lng)),
            stopover: true,
          }));

        const request = {
          origin: new window.google.maps.LatLng(Number(src.lat), Number(src.lng)),
          destination: new window.google.maps.LatLng(Number(dest.lat), Number(dest.lng)),
          waypoints,
          travelMode: window.google.maps.TravelMode.DRIVING,
          optimizeWaypoints: false, // Strict sequence order as specified by admin
        };

        const result = await new Promise((resolve, reject) => {
          directionsService.route(request, (res, status) => {
            if (status === window.google.maps.DirectionsStatus.OK) {
              resolve(res);
            } else {
              reject(new Error(`Directions status: ${status}`));
            }
          });
        });

        if (result?.routes?.[0]) {
          const route = result.routes[0];
          const outboundCoords = [];
          if (route.overview_path) {
            route.overview_path.forEach((pt) => {
              outboundCoords.push([pt.lat(), pt.lng()]);
            });
          }

          let totalMeters = 0;
          let totalSeconds = 0;
          const streets = [];

          if (route.legs) {
            route.legs.forEach((leg) => {
              totalMeters += leg.distance?.value || 0;
              totalSeconds += leg.duration?.value || 0;
              if (leg.steps) {
                leg.steps.forEach((step) => {
                  const rawName = step.instructions?.replace(/<[^>]+>/g, "").trim();
                  if (rawName && !streets.includes(rawName)) {
                    streets.push(rawName);
                  }
                });
              }
            });
          }

          const oneWayDistance = Number((totalMeters / 1000).toFixed(1));
          const oneWayDuration = Math.max(1, Math.round(totalSeconds / 60));

          if (outAndBack) {
            const returnCoords = [...outboundCoords].reverse().slice(1);
            setRoadPolyline([...outboundCoords, ...returnCoords]);
            setDistanceKm(Number((oneWayDistance * 2).toFixed(1)));
            setEstimatedDurationMin(oneWayDuration * 2);
          } else {
            setRoadPolyline(outboundCoords);
            setDistanceKm(oneWayDistance);
            setEstimatedDurationMin(oneWayDuration);
          }

          if (streets.length > 0) {
            setStreetsTraversed(streets.slice(0, 5));
          }
          setIsSnapping(false);
          return;
        }
      } catch (directionsErr) {
        console.warn("Google DirectionsService fallback to OSRM:", directionsErr);
      }
    }

    // 2. Resilient fallback to backend/OSRM routeService.snapRoad
    const rawWaypoints = [
      [Number(src.lat), Number(src.lng)],
      ...(stopsList || []).filter((s) => s && s.lat && s.lng).map((s) => [Number(s.lat), Number(s.lng)]),
      [Number(dest.lat), Number(dest.lng)],
    ];

    try {
      const snapped = await routeService.snapRoad(rawWaypoints, false, outAndBack);
      if (snapped && Array.isArray(snapped.waypoints) && snapped.waypoints.length > 1) {
        setRoadPolyline(snapped.waypoints);
        setDistanceKm(snapped.distanceKm || 14.0);
        setEstimatedDurationMin(snapped.estimatedDurationMin || 35);
        if (snapped.streetsTraversed?.length) {
          setStreetsTraversed(snapped.streetsTraversed);
        }
        setIsSnapping(false);
        return;
      }
    } catch (err) {
      console.warn("Road snapping fallback error:", err);
    }

    // 3. Direct / interpolated coordinates fallback so route polyline is NEVER blank
    let fallbackPath = rawWaypoints;
    if (outAndBack) {
      const returnCoords = [...rawWaypoints].reverse().slice(1);
      fallbackPath = [...rawWaypoints, ...returnCoords];
    }
    setRoadPolyline(fallbackPath);

    let approxDist = 0;
    for (let i = 0; i < rawWaypoints.length - 1; i++) {
      const [lat1, lon1] = rawWaypoints[i];
      const [lat2, lon2] = rawWaypoints[i + 1];
      const R = 6371;
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLon = ((lon2 - lon1) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
      approxDist += R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
    const oneWayKm = Number(Math.max(1, approxDist).toFixed(1));
    const totalDist = outAndBack ? Number((oneWayKm * 2).toFixed(1)) : oneWayKm;
    setDistanceKm(totalDist);
    setEstimatedDurationMin(Math.max(5, Math.round((totalDist / 25) * 60)));
    setIsSnapping(false);
  };

  // Recompute when outAndBack toggles
  const handleToggleOutAndBack = () => {
    const nextMode = !isOutAndBack;
    setIsOutAndBack(nextMode);
    triggerSnapRoad(sourceStop, routeStops, destinationStop, nextMode);
    toast.info(
      nextMode ? "Two-Way Route Active" : "One-Way Route Active",
      nextMode
        ? "Bus travels to University and returns along the exact same road."
        : "Standard one-way directional corridor."
    );
  };

  // ----------------------------------------------------
  // Source & Destination Handlers
  // ----------------------------------------------------
  const handleSelectSource = (stopId) => {
    const found = allStops.find((s) => s.id === stopId);
    if (!found) return;

    // Remove from intermediate if present
    const updatedIntermediate = routeStops.filter((s) => s.id !== stopId);
    setSourceStop(found);
    setRouteStops(updatedIntermediate);
    triggerSnapRoad(found, updatedIntermediate, destinationStop, isOutAndBack);
    toast.success("Source Updated", `Route starts from "${found.name}"`);
  };

  const handleSelectDestination = (stopId) => {
    const found = allStops.find((s) => s.id === stopId);
    if (!found) return;

    const updatedIntermediate = routeStops.filter((s) => s.id !== stopId);
    setDestinationStop(found);
    setRouteStops(updatedIntermediate);
    triggerSnapRoad(sourceStop, updatedIntermediate, found, isOutAndBack);
    toast.success("Destination Updated", `Route terminates at "${found.name}"`);
  };

  // ----------------------------------------------------
  // Stop Search & Add from Stop Management
  // ----------------------------------------------------
  const handleAddStopToRoute = (stop) => {
    // Check if already in source, destination, or route
    if (sourceStop?.id === stop.id) {
      toast.warning("Already Added", `"${stop.name}" is already the Route Source.`);
      return;
    }
    if (destinationStop?.id === stop.id) {
      toast.warning("Already Added", `"${stop.name}" is already the University Destination.`);
      return;
    }
    if (routeStops.some((s) => s.id === stop.id)) {
      toast.warning("Already in Route", `"${stop.name}" is already included in this route.`);
      return;
    }

    const updated = [...routeStops, stop];
    setRouteStops(updated);
    triggerSnapRoad(sourceStop, updated, destinationStop, isOutAndBack);
    toast.success("Stop Added", `Added "${stop.name}" to route itinerary.`);
  };

  const handleRemoveStopFromRoute = (stopId) => {
    const updated = routeStops.filter((s) => s.id !== stopId);
    setRouteStops(updated);
    triggerSnapRoad(sourceStop, updated, destinationStop, isOutAndBack);
    toast.info("Stop Removed", "Recalculated road route.");
  };

  // ----------------------------------------------------
  // Drag-and-Drop Stop Reordering
  // ----------------------------------------------------
  const handleDragStart = (e, index) => {
    e.dataTransfer.setData("text/plain", String(index));
    e.dataTransfer.effectAllowed = "move";
    setDraggedIndex(index);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    const updated = [...routeStops];
    const [movedItem] = updated.splice(draggedIndex, 1);
    updated.splice(targetIndex, 0, movedItem);

    setRouteStops(updated);
    setDraggedIndex(null);
    triggerSnapRoad(sourceStop, updated, destinationStop, isOutAndBack);
    toast.success("Stop Reordered", `Moved "${movedItem.name}" in route sequence.`);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // Up/Down button fallback for accessible reordering
  const handleMoveStopUp = (index) => {
    if (index === 0) return;
    const updated = [...routeStops];
    const temp = updated[index];
    updated[index] = updated[index - 1];
    updated[index - 1] = temp;

    setRouteStops(updated);
    triggerSnapRoad(sourceStop, updated, destinationStop, isOutAndBack);
  };

  const handleMoveStopDown = (index) => {
    if (index >= routeStops.length - 1) return;
    const updated = [...routeStops];
    const temp = updated[index];
    updated[index] = updated[index + 1];
    updated[index + 1] = temp;

    setRouteStops(updated);
    triggerSnapRoad(sourceStop, updated, destinationStop, isOutAndBack);
  };

  // ----------------------------------------------------
  // Save Route & Assign to Bus
  // ----------------------------------------------------
  const handleSaveRoute = async () => {
    if (!routeName.trim() || !routeCode.trim()) {
      toast.warning("Validation Error", "Please provide a Route Name and Code.");
      return;
    }
    if (!sourceStop || !destinationStop) {
      toast.warning("Incomplete Route", "Please designate both a Source and Destination.");
      return;
    }
    if (sourceStop.id === destinationStop.id) {
      toast.warning("Invalid Terminals", "Source departure stop and University destination cannot be identical.");
      return;
    }

    setIsSaving(true);
    const assignedBus = buses.find((b) => b.id === selectedBusId);
    const stopIds = [sourceStop.id, ...routeStops.map((s) => s.id), destinationStop.id];
    const targetRouteId = routeId || `RT-${String(routes.length + 1).padStart(2, "0")}`;

    const computedWaypoints =
      roadPolyline && roadPolyline.length > 1
        ? roadPolyline
        : [
            [Number(sourceStop.lat), Number(sourceStop.lng)],
            ...routeStops.filter((s) => s && s.lat && s.lng).map((s) => [Number(s.lat), Number(s.lng)]),
            [Number(destinationStop.lat), Number(destinationStop.lng)],
            ...(isOutAndBack
              ? [
                  ...routeStops.filter((s) => s && s.lat && s.lng).map((s) => [Number(s.lat), Number(s.lng)]).reverse(),
                  [Number(sourceStop.lat), Number(sourceStop.lng)],
                ]
              : []),
          ];

    const payload = {
      id: targetRouteId,
      name: routeName.trim(),
      code: routeCode.trim(),
      color: routeColor,
      operatingHours: operatingHours,
      status: "active",
      distanceKm: Number(distanceKm),
      estimatedDurationMin: Number(estimatedDurationMin),
      sourceStopId: sourceStop.id,
      destinationStopId: destinationStop.id,
      stops: stopIds,
      waypoints: computedWaypoints,
      streetsTraversed: streetsTraversed,
      activeBusId: selectedBusId || null,
      outAndBack: isOutAndBack,
    };

    try {
      if (routeId) {
        await routeService.update(routeId, payload);
        toast.success("Route Updated", `Saved updates to ${routeName}.`);
      } else {
        await routeService.create(payload);
        setRouteId(targetRouteId);
        toast.success("Route Created", `Registered new route ${routeName}.`);
      }

      // Synchronize bus assignment
      if (selectedBusId) {
        // Clear this route from other buses if re-assigning
        const otherAssignedBuses = buses.filter((b) => b.id !== selectedBusId && b.routeId === targetRouteId);
        for (const ob of otherAssignedBuses) {
          await busService.update(ob.id, { routeId: null, routeName: "Unassigned" });
        }
        await busService.update(selectedBusId, { routeId: targetRouteId, routeName: routeName.trim() });
        toast.success(
          "Bus Fleet Synchronized",
          `${routeName} assigned to ${assignedBus ? assignedBus.busNumber : "bus"}.`
        );
      } else if (routeId) {
        // If bus assignment removed, unassign from buses
        const prevBuses = buses.filter((b) => b.routeId === routeId);
        for (const pb of prevBuses) {
          await busService.update(pb.id, { routeId: null, routeName: "Unassigned" });
        }
      }

      await loadData();
    } catch (err) {
      console.error("Save route error:", err);
      const errMsg = err?.response?.data?.message || err?.message || "Failed to save route to database.";
      toast.error("Save Error", errMsg);
    } finally {
      setIsSaving(false);
    }
  };

  // Delete route handler
  const handleDeleteRoute = async (target) => {
    if (!target) return;
    setIsDeleting(true);
    try {
      await routeService.delete(target.id);

      // Unassign any buses associated with this route
      const assignedBuses = buses.filter((b) => b.routeId === target.id);
      for (const b of assignedBuses) {
        await busService.update(b.id, { routeId: null, routeName: "Unassigned" });
      }

      toast.success("Route Deleted", `${target.name} permanently removed.`);
      setDeleteTarget(null);

      if (routeId === target.id) {
        handleStartNewRoute();
      }
      await loadData();
    } catch {
      toast.error("Delete Error", "Could not remove route.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Load existing route into Studio for editing
  const handleOpenEditRoute = (route) => {
    setRouteId(route.id);
    setRouteName(route.name);
    setRouteCode(route.code);
    setRouteColor(route.color || "#3b82f6");
    setOperatingHours(route.operatingHours || "07:00 AM - 07:00 PM");
    setSelectedBusId(route.activeBusId || "");
    setIsOutAndBack(route.outAndBack !== undefined ? Boolean(route.outAndBack) : true);

    // Resolve source, destination, intermediate stops
    const stopsCatalog = new Map(allStops.map((s) => [s.id, s]));
    const rawStops = route.stops || [];

    const src = stopsCatalog.get(rawStops[0]) || allStops[0];
    const dest = stopsCatalog.get(rawStops[rawStops.length - 1]) || destinationStop;
    const intermediate = rawStops
      .slice(1, rawStops.length - 1)
      .map((id) => stopsCatalog.get(id))
      .filter(Boolean);

    setSourceStop(src);
    setDestinationStop(dest);
    setRouteStops(intermediate);
    if (route.waypoints && Array.isArray(route.waypoints) && route.waypoints.length > 1) {
      setRoadPolyline(route.waypoints);
      if (route.distanceKm) setDistanceKm(route.distanceKm);
      if (route.estimatedDurationMin) setEstimatedDurationMin(route.estimatedDurationMin);
      if (route.streetsTraversed) setStreetsTraversed(route.streetsTraversed);
    } else {
      triggerSnapRoad(src, intermediate, dest, route.outAndBack !== undefined ? Boolean(route.outAndBack) : true);
    }

    setActiveTab("studio");
    toast.info("Editing Route", `Loaded "${route.name}" into Route Builder Studio.`);
  };

  // Start fresh route
  const handleStartNewRoute = () => {
    setRouteId(null);
    setRouteName(`Custom Route ${routes.length + 1}`);
    setRouteCode(`R-${101 + routes.length}`);
    setRouteColor("#3b82f6");
    setSelectedBusId("");
    setIsOutAndBack(true);

    const univStop =
      allStops.find(
        (s) => s.isUniversity || s.code === "S-001" || /university|campus|terminal|main/i.test(s.name)
      ) || (allStops.length > 1 ? allStops[allStops.length - 1] : allStops[0]);

    const initialSource = allStops.find((s) => s.id !== univStop?.id) || allStops[0];
    const intermediate = allStops.filter((s) => s.id !== initialSource?.id && s.id !== univStop?.id).slice(0, 2);

    setSourceStop(initialSource || null);
    setDestinationStop(univStop || null);
    setRouteStops(intermediate || []);
    if (initialSource && univStop) {
      triggerSnapRoad(initialSource, intermediate, univStop, true);
    }
    toast.info("New Route", "Ready to construct custom route.");
  };

  // Filter available stops for search modal/panel
  const availableStops = allStops.filter((stop) => {
    const matchesSearch =
      !stopSearchQuery ||
      stop.name.toLowerCase().includes(stopSearchQuery.toLowerCase()) ||
      stop.code.toLowerCase().includes(stopSearchQuery.toLowerCase()) ||
      (stop.zone || "").toLowerCase().includes(stopSearchQuery.toLowerCase());

    const matchesZone = stopZoneFilter === "all" || stop.zone === stopZoneFilter;
    return matchesSearch && matchesZone;
  });

  // Extract unique zones from allStops
  const zones = ["all", ...new Set(allStops.map((s) => s.zone).filter(Boolean))];

  const assignedBus = buses.find((b) => b.id === selectedBusId);

  return (
    <div className="space-y-4">
      {/* Top Header Bar with Route Selector & Quick Actions */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <RouteIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white tracking-tight">
                Bus Route Builder
              </h1>
              {routeId ? (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold">
                  Editing: {routeCode}
                </span>
              ) : (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold">
                  New Route
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              Select source and university destination, add & drag-and-drop reorder stops from Stop Management, generate road-following paths, and assign to buses.
            </p>
          </div>
        </div>

        {/* Route Selector Dropdown & Header Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Direct Route Selection Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-1.5 shadow-inner">
            <RouteIcon className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="text-[11px] text-slate-400 font-semibold shrink-0">Route:</span>
            <select
              value={routeId || "new"}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "new") {
                  handleStartNewRoute();
                } else {
                  const targetRoute = routes.find((r) => r.id === val);
                  if (targetRoute) handleOpenEditRoute(targetRoute);
                }
              }}
              className="bg-transparent text-xs text-white font-bold outline-none cursor-pointer max-w-[190px] truncate"
            >
              <option value="new" className="bg-slate-900 text-emerald-400 font-semibold">
                + Build New Route
              </option>
              {routes.map((r) => (
                <option key={r.id} value={r.id} className="bg-slate-900 text-white">
                  {r.name} ({r.code})
                </option>
              ))}
            </select>
          </div>

          {/* Quick Save / Update Button */}
          <button
            type="button"
            onClick={handleSaveRoute}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 cursor-pointer transition-all disabled:opacity-50"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{isSaving ? "Saving..." : routeId ? "Update Route" : "Save Route"}</span>
          </button>

          {/* Quick Delete Route Button (if editing existing route) */}
          {routeId && (
            <button
              type="button"
              onClick={() => {
                const current = routes.find((r) => r.id === routeId);
                if (current) setDeleteTarget(current);
              }}
              title="Delete Current Route"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold cursor-pointer transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Delete</span>
            </button>
          )}

          {/* New Route Button */}
          <button
            type="button"
            onClick={handleStartNewRoute}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New</span>
          </button>

          <div className="flex items-center bg-slate-950/80 border border-slate-800 rounded-xl p-1">
            <button
              onClick={() => setActiveTab("studio")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "studio"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Studio</span>
            </button>
            <button
              onClick={() => setActiveTab("catalog")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "catalog"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>All ({routes.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Studio Arena */}
      {activeTab === "studio" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* Left Column: Route Configuration & Drag-and-Drop Stops List (5 cols) */}
          <div className="lg:col-span-5 space-y-3.5">
            {/* 1. Basic Route Info & Bus Assignment */}
            <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl shadow-xl space-y-3">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Route Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={routeName}
                    onChange={(e) => setRouteName(e.target.value)}
                    placeholder="e.g. North Metro Express"
                    className="w-full bg-slate-950 border border-slate-700/80 focus:border-indigo-500 rounded-xl px-2.5 py-1.5 text-xs text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Route Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={routeCode}
                    onChange={(e) => setRouteCode(e.target.value)}
                    placeholder="e.g. R-101"
                    className="w-full bg-slate-950 border border-slate-700/80 focus:border-indigo-500 rounded-xl px-2.5 py-1.5 text-xs text-white outline-none font-mono"
                  />
                </div>
              </div>

              {/* Bus Assignment Selector */}
              <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-950/70 border border-slate-800">
                <div className="flex items-center gap-2 min-w-0">
                  <Bus className="w-4 h-4 text-cyan-400 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[10px] text-slate-400 font-medium block">
                      Assign to Fleet Bus
                    </span>
                    <select
                      value={selectedBusId}
                      onChange={(e) => setSelectedBusId(e.target.value)}
                      className="bg-transparent text-xs text-white font-bold focus:outline-none cursor-pointer"
                    >
                      <option value="" className="bg-slate-900 text-slate-400">
                        -- Keep Unassigned --
                      </option>
                      {buses.map((b) => (
                        <option key={b.id} value={b.id} className="bg-slate-900 text-white">
                          {b.busNumber} ({b.plateNumber})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {assignedBus && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shrink-0">
                    {assignedBus.capacity} Seats
                  </span>
                )}
              </div>

              {/* Two-Way Out-and-Back Switch */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
                <div>
                  <span className="font-semibold text-white flex items-center gap-1.5">
                    <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-400" />
                    Two-Way Corridor (Out & Back)
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Returns along the exact same streets in reverse
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleToggleOutAndBack}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isOutAndBack
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {isOutAndBack ? "ENABLED" : "OFF"}
                </button>
              </div>

              {/* Live Distance & Duration Metrics */}
              <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-800/80 text-center">
                <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/60">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    Distance
                  </span>
                  <span className="font-extrabold text-xs text-white">{distanceKm} km</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/60">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    Duration
                  </span>
                  <span className="font-extrabold text-xs text-emerald-400">~{estimatedDurationMin}m</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/60">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    Total Stops
                  </span>
                  <span className="font-extrabold text-xs text-indigo-400">
                    {routeStops.length + 2} stops
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Source & Destination Selectors */}
            <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl shadow-xl space-y-3">
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-emerald-400" />
                Route Terminals (Source & University Destination)
              </h3>

              {/* Source Picker */}
              <div className="p-2.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-400 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Source (Start Terminal)
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {sourceStop?.code || "S-START"}
                  </span>
                </div>
                <select
                  value={sourceStop?.id || ""}
                  onChange={(e) => handleSelectSource(e.target.value)}
                  className="w-full bg-slate-950 border border-emerald-500/40 rounded-lg px-2.5 py-1.5 text-xs text-white font-semibold focus:outline-none cursor-pointer"
                >
                  {allStops.map((stop) => (
                    <option key={`src-${stop.id}`} value={stop.id}>
                      {stop.name} ({stop.code} &bull; {stop.zone})
                    </option>
                  ))}
                </select>
                <div className="flex flex-wrap items-center gap-x-2 text-[10px] text-slate-400 font-mono">
                  <span>GPS: {Number(sourceStop?.lat || 0).toFixed(4)}, {Number(sourceStop?.lng || 0).toFixed(4)}</span>
                  <span>&bull;</span>
                  <span className="text-emerald-400">AM: {sourceStop?.morningTime || "07:30 AM"}</span>
                  <span className="text-amber-400">PM: {sourceStop?.eveningTime || "05:30 PM"}</span>
                  <span className="text-slate-500">({sourceStop?.geofenceRadiusMeters || 75}m radius)</span>
                </div>
              </div>

              {/* Destination Picker */}
              <div className="p-2.5 rounded-xl bg-amber-950/20 border border-amber-500/30 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-amber-400 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                    <span>🏛️</span>
                    University Destination (Terminal)
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {destinationStop?.code || "S-001"}
                  </span>
                </div>
                <select
                  value={destinationStop?.id || ""}
                  onChange={(e) => handleSelectDestination(e.target.value)}
                  className="w-full bg-slate-950 border border-amber-500/40 rounded-lg px-2.5 py-1.5 text-xs text-white font-semibold focus:outline-none cursor-pointer"
                >
                  {allStops.map((stop) => (
                    <option key={`dest-${stop.id}`} value={stop.id}>
                      {stop.name} ({stop.code} &bull; {stop.zone})
                    </option>
                  ))}
                </select>
                <div className="flex flex-wrap items-center gap-x-2 text-[10px] text-slate-400 font-mono">
                  <span>GPS: {Number(destinationStop?.lat || 0).toFixed(4)}, {Number(destinationStop?.lng || 0).toFixed(4)}</span>
                  <span>&bull;</span>
                  <span className="text-amber-400">Arrival: {destinationStop?.morningTime || "08:15 AM"}</span>
                  <span className="text-amber-400">PM: {destinationStop?.eveningTime || "06:00 PM"}</span>
                  <span className="text-slate-500">({destinationStop?.geofenceRadiusMeters || 100}m radius)</span>
                </div>
              </div>
            </div>

            {/* 3. Intermediate Stops (with Drag-and-Drop Reordering) */}
            <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl shadow-xl flex flex-col space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-indigo-400" />
                    Stops Along Corridor ({routeStops.length})
                  </h3>
                  <span className="text-[10px] text-slate-400">
                    Drag handles <GripVertical className="w-2.5 h-2.5 inline" /> to reorder stops in sequence
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setIsStopPickerOpen(true)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Stop</span>
                </button>
              </div>

              {/* Stops Itinerary List */}
              <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                {/* 1. Source Visual Node */}
                <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/40 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-5 h-5 rounded-md bg-emerald-500 text-slate-950 font-bold text-[10px] flex items-center justify-center shrink-0">
                      S
                    </span>
                    <div className="min-w-0">
                      <span className="font-bold text-white block truncate">
                        {sourceStop?.name || "Source Terminal"}
                      </span>
                      <div className="flex items-center gap-1 text-[10px] text-emerald-400/90 font-mono">
                        <span>{sourceStop?.code || "START"}</span>
                        <span>&bull;</span>
                        <span>AM: {sourceStop?.morningTime || "07:30 AM"}</span>
                        <span>PM: {sourceStop?.eveningTime || "05:30 PM"}</span>
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-semibold px-2 py-0.5 rounded bg-emerald-500/20 shrink-0">
                    START
                  </span>
                </div>

                {/* 2. Drag & Drop Intermediate Stops */}
                {routeStops.length === 0 ? (
                  <div className="py-6 px-4 text-center rounded-xl border border-dashed border-slate-800 text-slate-500 text-xs">
                    No intermediate stops added yet. Click &ldquo;Add Stop&rdquo; above or search from Stop Management.
                  </div>
                ) : (
                  routeStops.map((stop, idx) => (
                    <div
                      key={`route-stop-${stop.id}`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, idx)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, idx)}
                      onDragEnd={handleDragEnd}
                      className={`p-2.5 rounded-xl border transition-all text-xs flex items-center justify-between gap-2 group cursor-grab active:cursor-grabbing ${
                        draggedIndex === idx
                          ? "opacity-50 border-indigo-500 bg-indigo-950/40"
                          : "bg-slate-950/70 border-slate-800/90 hover:border-indigo-500/50"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="text-slate-500 group-hover:text-slate-300 shrink-0">
                          <GripVertical className="w-3.5 h-3.5" />
                        </div>
                        <span className="w-5 h-5 rounded-md bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <span className="font-bold text-white truncate block">
                            {stop.name}
                          </span>
                          <div className="flex flex-wrap items-center gap-x-1.5 text-[10px] text-slate-400 font-mono truncate">
                            <span>{stop.code}</span>
                            <span>&bull;</span>
                            <span className="text-emerald-400">AM: {stop.morningTime || "07:35 AM"}</span>
                            <span className="text-amber-400">PM: {stop.eveningTime || "05:35 PM"}</span>
                            <span className="text-slate-500">({stop.geofenceRadiusMeters || 75}m)</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {/* Move Up */}
                        <button
                          type="button"
                          onClick={() => handleMoveStopUp(idx)}
                          disabled={idx === 0}
                          className={`p-1 rounded transition-colors ${
                            idx === 0
                              ? "text-slate-700 cursor-not-allowed"
                              : "text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                          }`}
                          title="Move earlier"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>

                        {/* Move Down */}
                        <button
                          type="button"
                          onClick={() => handleMoveStopDown(idx)}
                          disabled={idx >= routeStops.length - 1}
                          className={`p-1 rounded transition-colors ${
                            idx >= routeStops.length - 1
                              ? "text-slate-700 cursor-not-allowed"
                              : "text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                          }`}
                          title="Move later"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Stop from Route */}
                        <button
                          type="button"
                          onClick={() => handleRemoveStopFromRoute(stop.id)}
                          className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="Remove from Route"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}

                {/* 3. Destination Visual Node */}
                <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-500/40 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-5 h-5 rounded-md bg-amber-500 text-slate-950 font-bold text-[10px] flex items-center justify-center shrink-0">
                      🏛️
                    </span>
                    <div className="min-w-0">
                      <span className="font-bold text-white block truncate">
                        {destinationStop?.name || "Apex University Terminal"}
                      </span>
                      <div className="flex items-center gap-1 text-[10px] text-amber-400/90 font-mono">
                        <span>{destinationStop?.code || "S-001"}</span>
                        <span>&bull;</span>
                        <span>AM: {destinationStop?.morningTime || "08:15 AM"}</span>
                        <span>PM: {destinationStop?.eveningTime || "06:00 PM"}</span>
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] text-amber-400 font-semibold px-2 py-0.5 rounded bg-amber-500/20 shrink-0">
                    DESTINATION
                  </span>
                </div>
              </div>

              {/* Action Buttons: Snap & Save */}
              <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => triggerSnapRoad(sourceStop, routeStops, destinationStop, isOutAndBack)}
                  disabled={isSnapping}
                  className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{isSnapping ? "Calculating Road..." : "Recalculate Path"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveRoute}
                  disabled={isSaving}
                  className="flex-1 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSaving ? "Saving..." : "Save Route to Bus"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Google Maps Interactive Road Map Canvas (7 cols) */}
          <div className="lg:col-span-7">
            <GoogleRouteMap
              sourceStop={sourceStop}
              destinationStop={destinationStop}
              routeStops={routeStops}
              allStops={allStops}
              roadPolyline={roadPolyline}
              routeColor={routeColor}
              distanceKm={distanceKm}
              estimatedDurationMin={estimatedDurationMin}
              streetsTraversed={streetsTraversed}
              isOutAndBack={isOutAndBack}
              onAddStop={handleAddStopToRoute}
              onRemoveStop={handleRemoveStopFromRoute}
              isLoaded={isLoaded}
              loadError={loadError}
              apiKey={apiKey}
              onUpdateApiKey={updateApiKey}
            />
          </div>
        </div>
      ) : (
        /* All Routes Catalog Tab */
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {routes.map((rt) => {
              const bus = buses.find((b) => b.id === rt.activeBusId || b.routeId === rt.id);
              const stopsCount = rt.stops?.length || 0;

              return (
                <div
                  key={rt.id}
                  className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all shadow-xl flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3.5 h-3.5 rounded-full shrink-0 border border-white/30"
                          style={{ backgroundColor: rt.color || "#3b82f6" }}
                        />
                        <span className="font-bold text-sm text-white">{rt.name}</span>
                      </div>
                      <span className="font-mono text-xs text-slate-400 px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
                        {rt.code}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-cyan-300 font-medium">
                      <Bus className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>{bus ? `${bus.busNumber} (${bus.plateNumber})` : "Unassigned to bus"}</span>
                    </div>

                    <div className="grid grid-cols-3 gap-1 text-center text-xs p-2 rounded-xl bg-slate-950/60 border border-slate-800/80">
                      <div>
                        <span className="text-[10px] text-slate-500 block">Distance</span>
                        <span className="font-bold text-white">{rt.distanceKm || 14} km</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Duration</span>
                        <span className="font-bold text-emerald-400">~{rt.estimatedDurationMin || 35}m</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Stops</span>
                        <span className="font-bold text-indigo-400">{stopsCount}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 mt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(rt)}
                      className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                      title="Delete Route"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenEditRoute(rt)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit in Studio</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Stop Search & Selection Modal (from Stop Management) */}
      {isStopPickerOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-indigo-400" />
                  Select Stop from Stop Management
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Pick an existing transit stop to add to your custom route corridor.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsStopPickerOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Input & Zone Filter */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="sm:col-span-2 relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={stopSearchQuery}
                  onChange={(e) => setStopSearchQuery(e.target.value)}
                  placeholder="Search stop name, code, or zone..."
                  className="w-full pl-8 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500"
                />
              </div>

              <select
                value={stopZoneFilter}
                onChange={(e) => setStopZoneFilter(e.target.value)}
                className="px-2.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 outline-none cursor-pointer"
              >
                {zones.map((z) => (
                  <option key={z} value={z}>
                    {z === "all" ? "All Zones" : z}
                  </option>
                ))}
              </select>
            </div>

            {/* Available Stops List */}
            <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1">
              {availableStops.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs">
                  No stops found matching &ldquo;{stopSearchQuery}&rdquo;.
                </div>
              ) : (
                availableStops.map((stop) => {
                  const isSource = sourceStop?.id === stop.id;
                  const isDest = destinationStop?.id === stop.id;
                  const isAlreadyInRoute = routeStops.some((s) => s.id === stop.id);
                  const isUnavailable = isSource || isDest || isAlreadyInRoute;

                  return (
                    <div
                      key={`picker-${stop.id}`}
                      className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-white truncate block">
                            {stop.name}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            ({stop.code})
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-1.5 text-[11px] text-slate-400 mt-0.5">
                          <span>{stop.zone}</span>
                          <span>&bull;</span>
                          <span className="text-emerald-400 font-medium">AM: {stop.morningTime}</span>
                          <span>&bull;</span>
                          <span className="text-amber-400 font-medium">PM: {stop.eveningTime}</span>
                          <span className="text-slate-500">({stop.geofenceRadiusMeters || 75}m)</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={isUnavailable}
                        onClick={() => {
                          handleAddStopToRoute(stop);
                          setIsStopPickerOpen(false);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-colors ${
                          isUnavailable
                            ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                            : "bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer shadow-xs"
                        }`}
                      >
                        {isSource ? "Source" : isDest ? "Destination" : isAlreadyInRoute ? "In Route" : "+ Add"}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => handleDeleteRoute(deleteTarget)}
        loading={isDeleting}
        title={`Delete ${deleteTarget?.name}?`}
        message={`Are you sure you want to permanently delete ${deleteTarget?.name}? Any fleet buses assigned to this route will become unassigned.`}
        confirmLabel="Delete Route"
        type="danger"
      />
    </div>
  );
};
