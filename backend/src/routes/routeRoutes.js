const express = require("express");
const router = express.Router();
const db = require("../db/d1Client");
const {
  UNIVERSITY_COORDINATES,
  computeRoadRoute,
  generateSymmetricStops,
  reverseGeocodeStreet,
  computeStopETAs,
} = require("../services/routingService");

function formatRoute(r) {
  if (!r) return null;
  return {
    ...r,
    stops: typeof r.stops === "string" ? JSON.parse(r.stops || "[]") : r.stops || [],
    waypoints: typeof r.waypoints === "string" ? JSON.parse(r.waypoints || "[]") : r.waypoints || [],
    streetsTraversed: typeof r.streetsTraversed === "string" ? JSON.parse(r.streetsTraversed || "[]") : r.streetsTraversed || [],
    outAndBack: r.outAndBack !== undefined ? Boolean(r.outAndBack) : true,
  };
}

// GET /api/routes/university-anchor - Return the constant University Terminal pin location
router.get("/university-anchor", (req, res) => {
  res.json(UNIVERSITY_COORDINATES);
});

// GET /api/routes/bus/:busId/student-view - Complete route, stops, bus telemetry, and ETAs for student app
router.get("/bus/:busId/student-view", async (req, res, next) => {
  try {
    const { busId } = req.params;
    let bus = await db.queryFirst("SELECT * FROM buses WHERE id = ?", [busId]);

    if (!bus) {
      // Fallback: pick the first active bus
      bus = await db.queryFirst("SELECT * FROM buses WHERE status = 'active' ORDER BY busNumber ASC");
    }

    if (!bus) {
      return res.status(404).json({ message: "No active buses found." });
    }

    // Find assigned route or fallback to first route
    let rawRoute = null;
    if (bus.routeId) {
      rawRoute = await db.queryFirst("SELECT * FROM routes WHERE id = ?", [bus.routeId]);
    }
    if (!rawRoute) {
      rawRoute = await db.queryFirst("SELECT * FROM routes ORDER BY id ASC");
    }

    if (!rawRoute) {
      return res.status(404).json({ message: "No route assigned to this bus." });
    }

    const route = formatRoute(rawRoute);
    const stopIds = route.stops || [];

    // Fetch all stops
    let stopsMap = new Map();
    if (stopIds.length > 0) {
      const placeholders = stopIds.map(() => "?").join(",");
      const stopsRows = await db.query(`SELECT * FROM stops WHERE id IN (${placeholders})`, stopIds);
      stopsRows.forEach((s) => stopsMap.set(s.id, s));
    }

    // Build ordered sequence of stops
    const orderedStops = stopIds.map((sid, index) => {
      if (sid === "STP-04") {
        return {
          id: "STP-04",
          name: UNIVERSITY_COORDINATES.name,
          code: UNIVERSITY_COORDINATES.code,
          lat: UNIVERSITY_COORDINATES.lat,
          lng: UNIVERSITY_COORDINATES.lng,
          morningTime: "07:00 AM",
          eveningTime: "06:00 PM",
          geofenceRadiusMeters: 80,
          zone: "Main Campus",
          isUniversity: true,
          sequenceIndex: index,
        };
      }

      const found = stopsMap.get(sid);
      if (found) {
        return {
          ...found,
          sequenceIndex: index,
          isUniversity: false,
        };
      }

      return {
        id: sid,
        name: `Stop ${sid}`,
        code: sid,
        lat: UNIVERSITY_COORDINATES.lat + (index * 0.005),
        lng: UNIVERSITY_COORDINATES.lng + (index * 0.005),
        morningTime: "07:30 AM",
        eveningTime: "05:30 PM",
        geofenceRadiusMeters: 80,
        zone: "Transit Corridor",
        isUniversity: false,
        sequenceIndex: index,
      };
    });

    // Compute dynamic ETAs and Next Stop
    const busLat = Number(bus.currentLat) || UNIVERSITY_COORDINATES.lat;
    const busLng = Number(bus.currentLng) || UNIVERSITY_COORDINATES.lng;
    const busSpeed = Number(bus.speedKmh) || 35;

    const etaTelemetry = computeStopETAs(route.waypoints, orderedStops, busLat, busLng, busSpeed);

    res.json({
      bus,
      route,
      nextStop: etaTelemetry.nextStop,
      orderedStops: etaTelemetry.stopsWithETA,
      streetsTraversed: route.streetsTraversed || [],
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/routes/snap-road - Compute road & street polyline between pinned points
router.post("/snap-road", async (req, res, next) => {
  try {
    const { waypoints = [], enforceUniversity = true, outAndBack = false } = req.body;
    const roadRoute = await computeRoadRoute(waypoints, enforceUniversity, outAndBack);
    res.json(roadRoute);
  } catch (err) {
    next(err);
  }
});

// GET /api/routes/reverse-geocode - Reverse geocode lat & lng to street name
router.get("/reverse-geocode", async (req, res, next) => {
  try {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ message: "Valid lat and lng query params are required." });
    }

    const geoData = await reverseGeocodeStreet(lat, lng);
    res.json(geoData);
  } catch (err) {
    next(err);
  }
});

// GET /api/routes
router.get("/", async (req, res, next) => {
  try {
    const rawRoutes = await db.query("SELECT * FROM routes ORDER BY id ASC");
    const routes = rawRoutes.map(formatRoute);
    res.json(routes);
  } catch (err) {
    next(err);
  }
});

// GET /api/routes/:id
router.get("/:id", async (req, res, next) => {
  try {
    const raw = await db.queryFirst("SELECT * FROM routes WHERE id = ?", [req.params.id]);
    if (!raw) {
      return res.status(404).json({ message: "Route not found" });
    }
    res.json(formatRoute(raw));
  } catch (err) {
    next(err);
  }
});

// POST /api/routes/assign-to-bus - Assign or create a dedicated route for a bus
router.post("/assign-to-bus", async (req, res, next) => {
  try {
    const { busId, routeData } = req.body;
    if (!busId) {
      return res.status(400).json({ message: "busId is required." });
    }

    const targetBus = await db.queryFirst("SELECT * FROM buses WHERE id = ?", [busId]);
    if (!targetBus) {
      return res.status(404).json({ message: `Bus ${busId} not found.` });
    }

    let finalWaypoints = routeData.waypoints || [];
    let finalDistance = Number(routeData.distanceKm) || 15.0;
    let finalDuration = Number(routeData.estimatedDurationMin) || 35;
    let streetsTraversed = Array.isArray(routeData.streetsTraversed) ? routeData.streetsTraversed : [];
    const isOutAndBack = routeData.outAndBack !== undefined ? Boolean(routeData.outAndBack) : true;

    if (routeData.autoSnapRoad) {
      try {
        const snapped = await computeRoadRoute(finalWaypoints, false, isOutAndBack);
        if (snapped && snapped.waypoints && snapped.waypoints.length > 0) {
          finalWaypoints = snapped.waypoints;
          finalDistance = snapped.distanceKm;
          finalDuration = snapped.estimatedDurationMin;
          if (snapped.streetsTraversed && snapped.streetsTraversed.length > 0) {
            streetsTraversed = snapped.streetsTraversed;
          }
        }
      } catch (snapErr) {
        console.warn("computeRoadRoute error in assign-to-bus:", snapErr.message);
      }
    }

    let finalStops = routeData.stops || [];
    if (isOutAndBack && Array.isArray(finalStops) && finalStops.length > 0) {
      finalStops = generateSymmetricStops(finalStops);
    }

    const allRoutes = await db.query("SELECT id FROM routes");
    const routeId = routeData.id || `RT-BUS-${busId.replace(/[^a-zA-Z0-9]/g, "")}`;
    const routeName = routeData.name || `Dedicated Route for ${targetBus.busNumber}`;
    const routeCode = routeData.code || `R-${targetBus.busNumber.replace(/\D/g, "") || allRoutes.length + 101}`;

    const stopsJson = typeof finalStops === "string" ? finalStops : JSON.stringify(finalStops);
    const waypointsJson = typeof finalWaypoints === "string" ? finalWaypoints : JSON.stringify(finalWaypoints);
    const streetsJson = typeof streetsTraversed === "string" ? streetsTraversed : JSON.stringify(streetsTraversed);

    await db.execute(
      `INSERT OR REPLACE INTO routes (
        id, name, code, color, status, distanceKm, estimatedDurationMin, operatingHours,
        stops, waypoints, studentAssignedCount, activeBusId, streetsTraversed, outAndBack
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        routeId,
        routeName,
        routeCode,
        routeData.color || "#3b82f6",
        routeData.status || "active",
        finalDistance,
        finalDuration,
        routeData.operatingHours || "07:00 AM - 06:30 PM",
        stopsJson,
        waypointsJson,
        Number(routeData.studentAssignedCount) || 0,
        busId,
        streetsJson,
        isOutAndBack ? 1 : 0,
      ]
    );

    // Update bus with new route
    await db.execute(
      `UPDATE buses SET routeId = ?, routeName = ? WHERE id = ?`,
      [routeId, routeName, busId]
    );

    const savedRoute = await db.queryFirst("SELECT * FROM routes WHERE id = ?", [routeId]);
    const updatedBus = await db.queryFirst("SELECT * FROM buses WHERE id = ?", [busId]);

    res.json({
      route: formatRoute(savedRoute),
      bus: updatedBus,
      message: `Assigned route ${routeName} to ${targetBus.busNumber}`,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/routes
router.post("/", async (req, res, next) => {
  try {
    const data = req.body;
    const all = await db.query("SELECT id FROM routes");
    const newId = data.id || `RT-${String(all.length + 1).padStart(2, "0")}`;

    let finalWaypoints = data.waypoints || [];
    let distanceKm = Number(data.distanceKm) || 15.0;
    let estimatedDurationMin = Number(data.estimatedDurationMin) || 40;
    let streetsTraversed = Array.isArray(data.streetsTraversed) ? data.streetsTraversed : [];
    const isOutAndBack = data.outAndBack !== undefined ? Boolean(data.outAndBack) : true;

    // Road snap if explicitly requested
    if (data.autoSnapRoad && Array.isArray(finalWaypoints) && finalWaypoints.length > 0) {
      try {
        const snapped = await computeRoadRoute(finalWaypoints, false, isOutAndBack);
        if (snapped && snapped.waypoints && snapped.waypoints.length > 0) {
          finalWaypoints = snapped.waypoints;
          distanceKm = snapped.distanceKm;
          estimatedDurationMin = snapped.estimatedDurationMin;
          if (snapped.streetsTraversed) {
            streetsTraversed = snapped.streetsTraversed;
          }
        }
      } catch (snapErr) {
        console.warn("computeRoadRoute error in POST /routes:", snapErr.message);
      }
    }

    const stopsJson = typeof data.stops === "string" ? data.stops : JSON.stringify(data.stops || []);
    const waypointsJson = typeof finalWaypoints === "string" ? finalWaypoints : JSON.stringify(finalWaypoints);
    const streetsJson = JSON.stringify(streetsTraversed);

    const newRoute = {
      id: newId,
      name: data.name || "New Route",
      code: data.code || `R-${all.length + 101}`,
      color: data.color || "#3b82f6",
      status: data.status || "active",
      distanceKm,
      estimatedDurationMin,
      operatingHours: data.operatingHours || "07:00 AM - 06:00 PM",
      stops: stopsJson,
      waypoints: waypointsJson,
      studentAssignedCount: Number(data.studentAssignedCount) || 0,
      activeBusId: data.activeBusId || null,
      streetsTraversed: streetsJson,
      outAndBack: isOutAndBack ? 1 : 0,
    };

    await db.execute(
      `INSERT OR REPLACE INTO routes (
        id, name, code, color, status, distanceKm, estimatedDurationMin, operatingHours,
        stops, waypoints, studentAssignedCount, activeBusId, streetsTraversed, outAndBack
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newRoute.id, newRoute.name, newRoute.code, newRoute.color, newRoute.status,
        newRoute.distanceKm, newRoute.estimatedDurationMin, newRoute.operatingHours,
        newRoute.stops, newRoute.waypoints, newRoute.studentAssignedCount, newRoute.activeBusId,
        newRoute.streetsTraversed, newRoute.outAndBack
      ]
    );

    // If activeBusId was assigned, link bus to this route
    if (newRoute.activeBusId) {
      await db.execute("UPDATE buses SET routeId = ?, routeName = ? WHERE id = ?", [
        newRoute.id,
        newRoute.name,
        newRoute.activeBusId,
      ]);
    }

    res.status(201).json(formatRoute(newRoute));
  } catch (err) {
    next(err);
  }
});

// PUT /api/routes/:id
router.put("/:id", async (req, res, next) => {
  try {
    const existing = await db.queryFirst("SELECT * FROM routes WHERE id = ?", [req.params.id]);
    if (!existing) {
      return res.status(404).json({ message: "Route not found" });
    }

    let finalWaypoints = req.body.waypoints !== undefined ? req.body.waypoints : JSON.parse(existing.waypoints || "[]");
    let distanceKm = req.body.distanceKm !== undefined ? Number(req.body.distanceKm) : existing.distanceKm;
    let estimatedDurationMin = req.body.estimatedDurationMin !== undefined ? Number(req.body.estimatedDurationMin) : existing.estimatedDurationMin;
    let streetsTraversed = req.body.streetsTraversed !== undefined ? req.body.streetsTraversed : JSON.parse(existing.streetsTraversed || "[]");
    const isOutAndBack = req.body.outAndBack !== undefined
      ? Boolean(req.body.outAndBack)
      : (existing.outAndBack !== undefined ? Boolean(existing.outAndBack) : true);

    if (req.body.autoSnapRoad && Array.isArray(finalWaypoints) && finalWaypoints.length > 0) {
      try {
        const snapped = await computeRoadRoute(finalWaypoints, false, isOutAndBack);
        if (snapped && snapped.waypoints && snapped.waypoints.length > 0) {
          finalWaypoints = snapped.waypoints;
          distanceKm = snapped.distanceKm;
          estimatedDurationMin = snapped.estimatedDurationMin;
          if (snapped.streetsTraversed) {
            streetsTraversed = snapped.streetsTraversed;
          }
        }
      } catch (snapErr) {
        console.warn("computeRoadRoute error in PUT /routes:", snapErr.message);
      }
    }

    const stopsJson = req.body.stops !== undefined
      ? (typeof req.body.stops === "string" ? req.body.stops : JSON.stringify(req.body.stops))
      : existing.stops;

    const waypointsJson = typeof finalWaypoints === "string" ? finalWaypoints : JSON.stringify(finalWaypoints);
    const streetsJson = typeof streetsTraversed === "string" ? streetsTraversed : JSON.stringify(streetsTraversed);

    const updated = {
      ...existing,
      ...req.body,
      distanceKm,
      estimatedDurationMin,
      stops: stopsJson,
      waypoints: waypointsJson,
      streetsTraversed: streetsJson,
      outAndBack: isOutAndBack ? 1 : 0,
    };

    await db.execute(
      `UPDATE routes SET
        name = ?, code = ?, color = ?, status = ?, distanceKm = ?, estimatedDurationMin = ?,
        operatingHours = ?, stops = ?, waypoints = ?, studentAssignedCount = ?, activeBusId = ?,
        streetsTraversed = ?, outAndBack = ?
       WHERE id = ?`,
      [
        updated.name, updated.code, updated.color, updated.status, Number(updated.distanceKm),
        Number(updated.estimatedDurationMin), updated.operatingHours, updated.stops, updated.waypoints,
        Number(updated.studentAssignedCount), updated.activeBusId, updated.streetsTraversed,
        updated.outAndBack, req.params.id
      ]
    );

    // Keep active bus sync
    if (updated.activeBusId) {
      await db.execute("UPDATE buses SET routeId = ?, routeName = ? WHERE id = ?", [
        req.params.id,
        updated.name,
        updated.activeBusId,
      ]);
    }

    const result = await db.queryFirst("SELECT * FROM routes WHERE id = ?", [req.params.id]);
    res.json(formatRoute(result));
  } catch (err) {
    next(err);
  }
});

// DELETE /api/routes/:id
router.delete("/:id", async (req, res, next) => {
  try {
    const existing = await db.queryFirst("SELECT id FROM routes WHERE id = ?", [req.params.id]);
    if (!existing) {
      return res.status(404).json({ message: "Route not found" });
    }

    // Clear route from buses assigned to it
    await db.execute("UPDATE buses SET routeId = NULL, routeName = 'Unassigned' WHERE routeId = ?", [req.params.id]);
    await db.execute("DELETE FROM routes WHERE id = ?", [req.params.id]);
    res.json({ success: true, id: req.params.id });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
