const express = require("express");
const router = express.Router();
const db = require("../db/d1Client");

// GET /api/buses - Get all buses
router.get("/", async (req, res, next) => {
  try {
    const buses = await db.query("SELECT * FROM buses ORDER BY busNumber ASC");
    res.json(buses);
  } catch (err) {
    next(err);
  }
});

// GET /api/buses/:id - Get bus by ID
router.get("/:id", async (req, res, next) => {
  try {
    const bus = await db.queryFirst("SELECT * FROM buses WHERE id = ?", [req.params.id]);
    if (!bus) {
      return res.status(404).json({ message: "Bus not found" });
    }
    res.json(bus);
  } catch (err) {
    next(err);
  }
});

// POST /api/buses - Create new bus
router.post("/", async (req, res, next) => {
  try {
    const busData = req.body;
    const allBuses = await db.query("SELECT id FROM buses");
    const newId = busData.id || `BUS-${String(allBuses.length + 1).padStart(2, "0")}`;

    const newBus = {
      id: newId,
      busNumber: busData.busNumber || `Bus ${allBuses.length + 101}`,
      plateNumber: busData.plateNumber || "KA-01-XX-0000",
      model: busData.model || "Standard Transit Bus",
      capacity: Number(busData.capacity) || 45,
      currentOccupancy: Number(busData.currentOccupancy) || 0,
      fuelType: busData.fuelType || "Diesel",
      fuelLevelPercent: Number(busData.fuelLevelPercent) || 100,
      status: busData.status || "active",
      gpsStatus: busData.gpsStatus || "live",
      assignedDriverId: busData.assignedDriverId || null,
      assignedDriverName: busData.assignedDriverName || "Unassigned",
      assignedDriverPhone: busData.assignedDriverPhone || "N/A",
      routeId: busData.routeId || null,
      routeName: busData.routeName || "Unassigned",
      odometerKm: Number(busData.odometerKm) || 0,
      speedKmh: Number(busData.speedKmh) || 0,
      headingDeg: Number(busData.headingDeg) || 0,
      currentLat: busData.currentLat || 12.9716,
      currentLng: busData.currentLng || 77.5946,
      lastPing: new Date().toISOString(),
      delayMinutes: Number(busData.delayMinutes) || 0,
      nextStopName: busData.nextStopName || "Main Campus Terminal",
      lastMaintenanceDate: busData.lastMaintenanceDate || new Date().toISOString().split("T")[0],
      nextMaintenanceDate: busData.nextMaintenanceDate || new Date(Date.now() + 90 * 86400000).toISOString().split("T")[0],
      imageUrl: busData.imageUrl || null,
    };

    await db.execute(
      `INSERT INTO buses (
        id, busNumber, plateNumber, model, capacity, currentOccupancy, fuelType, fuelLevelPercent,
        status, gpsStatus, assignedDriverId, assignedDriverName, assignedDriverPhone, routeId,
        routeName, odometerKm, speedKmh, headingDeg, currentLat, currentLng, lastPing, delayMinutes,
        nextStopName, lastMaintenanceDate, nextMaintenanceDate, imageUrl
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newBus.id, newBus.busNumber, newBus.plateNumber, newBus.model, newBus.capacity, newBus.currentOccupancy,
        newBus.fuelType, newBus.fuelLevelPercent, newBus.status, newBus.gpsStatus, newBus.assignedDriverId,
        newBus.assignedDriverName, newBus.assignedDriverPhone, newBus.routeId, newBus.routeName, newBus.odometerKm,
        newBus.speedKmh, newBus.headingDeg, newBus.currentLat, newBus.currentLng, newBus.lastPing, newBus.delayMinutes,
        newBus.nextStopName, newBus.lastMaintenanceDate, newBus.nextMaintenanceDate, newBus.imageUrl
      ]
    );

    res.status(201).json(newBus);
  } catch (err) {
    next(err);
  }
});

// PUT /api/buses/:id - Update bus
router.put("/:id", async (req, res, next) => {
  try {
    const existing = await db.queryFirst("SELECT * FROM buses WHERE id = ?", [req.params.id]);
    if (!existing) {
      return res.status(404).json({ message: "Bus not found" });
    }

    const updated = { ...existing, ...req.body };
    if (req.body.routeId === null) {
      updated.routeId = null;
      updated.routeName = req.body.routeName || "Unassigned";
    } else if (req.body.routeId && !req.body.routeName) {
      const r = await db.queryFirst("SELECT name FROM routes WHERE id = ?", [req.body.routeId]);
      if (r) updated.routeName = r.name;
    }

    await db.execute(
      `UPDATE buses SET
        busNumber = ?, plateNumber = ?, model = ?, capacity = ?, currentOccupancy = ?,
        fuelType = ?, fuelLevelPercent = ?, status = ?, gpsStatus = ?, assignedDriverId = ?,
        assignedDriverName = ?, assignedDriverPhone = ?, routeId = ?, routeName = ?,
        odometerKm = ?, speedKmh = ?, headingDeg = ?, currentLat = ?, currentLng = ?,
        lastPing = ?, delayMinutes = ?, nextStopName = ?, lastMaintenanceDate = ?,
        nextMaintenanceDate = ?, imageUrl = ?
       WHERE id = ?`,
      [
        updated.busNumber, updated.plateNumber, updated.model, Number(updated.capacity), Number(updated.currentOccupancy),
        updated.fuelType, Number(updated.fuelLevelPercent), updated.status, updated.gpsStatus, updated.assignedDriverId,
        updated.assignedDriverName, updated.assignedDriverPhone, updated.routeId, updated.routeName,
        Number(updated.odometerKm), Number(updated.speedKmh), Number(updated.headingDeg), Number(updated.currentLat), Number(updated.currentLng),
        updated.lastPing || new Date().toISOString(), Number(updated.delayMinutes), updated.nextStopName, updated.lastMaintenanceDate,
        updated.nextMaintenanceDate, updated.imageUrl, req.params.id
      ]
    );

    const result = await db.queryFirst("SELECT * FROM buses WHERE id = ?", [req.params.id]);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/buses/:id - Delete bus
router.delete("/:id", async (req, res, next) => {
  try {
    const existing = await db.queryFirst("SELECT id FROM buses WHERE id = ?", [req.params.id]);
    if (!existing) {
      return res.status(404).json({ message: "Bus not found" });
    }

    await db.execute("DELETE FROM buses WHERE id = ?", [req.params.id]);
    res.json({ success: true, id: req.params.id });
  } catch (err) {
    next(err);
  }
});

// Realtime bus location update handler (ideal for Postman & GPS telematics devices)
async function updateBusLocationHandler(req, res, next) {
  try {
    const rawBusId = req.params.id || req.body.busId || req.body.id || req.body.busNumber;
    if (!rawBusId) {
      return res.status(400).json({ message: "Bus ID, busId, or busNumber is required." });
    }

    const busId = decodeURIComponent(String(rawBusId)).trim();
    let bus = await db.queryFirst(
      "SELECT * FROM buses WHERE id = ? OR LOWER(id) = LOWER(?) OR LOWER(busNumber) = LOWER(?)",
      [busId, busId, busId]
    );
    if (!bus) {
      return res.status(404).json({ message: `Bus '${busId}' not found.` });
    }

    const lat = req.body.currentLat !== undefined
      ? Number(req.body.currentLat)
      : (req.body.lat !== undefined ? Number(req.body.lat) : bus.currentLat);

    const lng = req.body.currentLng !== undefined
      ? Number(req.body.currentLng)
      : (req.body.lng !== undefined ? Number(req.body.lng) : (req.body.lon !== undefined ? Number(req.body.lon) : bus.currentLng));

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ message: "Valid latitude and longitude are required (currentLat / currentLng or lat / lng)." });
    }

    const speed = req.body.speedKmh !== undefined
      ? Number(req.body.speedKmh)
      : (req.body.speed !== undefined ? Number(req.body.speed) : bus.speedKmh);

    const heading = req.body.headingDeg !== undefined
      ? Number(req.body.headingDeg)
      : (req.body.heading !== undefined ? Number(req.body.heading) : bus.headingDeg);

    const delayMinutes = req.body.delayMinutes !== undefined
      ? Number(req.body.delayMinutes)
      : (req.body.delay !== undefined ? Number(req.body.delay) : bus.delayMinutes);

    const nextStopName = req.body.nextStopName || req.body.nextStop || bus.nextStopName;
    const gpsStatus = req.body.gpsStatus || "live";
    const status = req.body.status || bus.status || "active";
    const lastPing = new Date().toISOString();

    await db.execute(
      `UPDATE buses SET
        currentLat = ?, currentLng = ?, speedKmh = ?, headingDeg = ?,
        delayMinutes = ?, nextStopName = ?, gpsStatus = ?, status = ?, lastPing = ?
       WHERE id = ?`,
      [lat, lng, speed, heading, delayMinutes, nextStopName, gpsStatus, status, lastPing, bus.id]
    );

    const updated = await db.queryFirst("SELECT * FROM buses WHERE id = ?", [bus.id]);
    res.json({
      success: true,
      message: `Realtime location updated for ${updated.busNumber}`,
      bus: updated,
    });
  } catch (err) {
    next(err);
  }
}

// POST or PATCH /api/buses/:id/location
router.post("/:id/location", updateBusLocationHandler);
router.patch("/:id/location", updateBusLocationHandler);

// POST /api/buses/location (with busId in body)
router.post("/location", updateBusLocationHandler);

// POST /api/buses/batch-location - Batch update bus locations (live telemetry)
router.post("/batch-location", async (req, res, next) => {
  try {
    const updates = req.body; // array of { id, currentLat, currentLng, speedKmh, headingDeg }
    if (!Array.isArray(updates)) {
      return res.status(400).json({ message: "Expected array of bus location updates." });
    }

    const now = new Date().toISOString();
    for (const u of updates) {
      if (u.id) {
        await db.execute(
          `UPDATE buses SET currentLat = ?, currentLng = ?, speedKmh = ?, headingDeg = ?, lastPing = ?, gpsStatus = 'live'
           WHERE id = ?`,
          [Number(u.currentLat), Number(u.currentLng), Number(u.speedKmh || 0), Number(u.headingDeg || 0), now, u.id]
        );
      }
    }

    const freshBuses = await db.query("SELECT * FROM buses ORDER BY busNumber ASC");
    res.json(freshBuses);
  } catch (err) {
    next(err);
  }
});

// POST /api/buses/advance-fleet - Advance buses along assigned road waypoints
router.post("/advance-fleet", async (req, res, next) => {
  try {
    const { advanceActiveFleetStep } = require("../services/fleetSimulationService");
    const updated = await advanceActiveFleetStep();
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

const { computeStopETAs, UNIVERSITY_COORDINATES } = require("../services/routingService");

// GET /api/buses/:id/route-details - Get bus along with its full route, ordered stops, and live ETAs
router.get("/:id/route-details", async (req, res, next) => {
  try {
    const bus = await db.queryFirst("SELECT * FROM buses WHERE id = ?", [req.params.id]);
    if (!bus) {
      return res.status(404).json({ message: "Bus not found" });
    }

    let route = null;
    let orderedStops = [];
    let nextStop = null;

    if (bus.routeId) {
      const rawRoute = await db.queryFirst("SELECT * FROM routes WHERE id = ?", [bus.routeId]);
      if (rawRoute) {
        const stopIds = typeof rawRoute.stops === "string" ? JSON.parse(rawRoute.stops || "[]") : rawRoute.stops || [];
        const waypoints = typeof rawRoute.waypoints === "string" ? JSON.parse(rawRoute.waypoints || "[]") : rawRoute.waypoints || [];
        const streetsTraversed = typeof rawRoute.streetsTraversed === "string" ? JSON.parse(rawRoute.streetsTraversed || "[]") : rawRoute.streetsTraversed || [];
        route = { ...rawRoute, stops: stopIds, waypoints, streetsTraversed };

        if (stopIds.length > 0) {
          const placeholders = stopIds.map(() => "?").join(",");
          const stopRows = await db.query(`SELECT * FROM stops WHERE id IN (${placeholders})`, stopIds);
          const stopMap = new Map();
          stopRows.forEach((s) => stopMap.set(s.id, s));

          orderedStops = stopIds.map((sid, idx) => {
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
                sequenceIndex: idx,
                isUniversity: true,
              };
            }
            const s = stopMap.get(sid);
            if (s) {
              return { ...s, sequenceIndex: idx, isUniversity: false };
            }
            return {
              id: sid,
              name: `Stop ${sid}`,
              code: sid,
              lat: UNIVERSITY_COORDINATES.lat,
              lng: UNIVERSITY_COORDINATES.lng,
              sequenceIndex: idx,
              isUniversity: false,
            };
          });

          const etaData = computeStopETAs(
            waypoints,
            orderedStops,
            Number(bus.currentLat) || UNIVERSITY_COORDINATES.lat,
            Number(bus.currentLng) || UNIVERSITY_COORDINATES.lng,
            Number(bus.speedKmh) || 35
          );

          orderedStops = etaData.stopsWithETA;
          nextStop = etaData.nextStop;
        }
      }
    }

    res.json({ bus, route, stops: orderedStops, nextStop });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

