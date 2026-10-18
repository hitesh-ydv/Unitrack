const express = require("express");
const router = express.Router();
const db = require("../db/d1Client");

// GET /api/trips
router.get("/", async (req, res, next) => {
  try {
    const trips = await db.query("SELECT * FROM trips ORDER BY id DESC");
    res.json(trips);
  } catch (err) {
    next(err);
  }
});

// POST /api/trips
router.post("/", async (req, res, next) => {
  try {
    const data = req.body;
    const newId = data.id || `TRP-${Math.floor(9000 + Math.random() * 999)}`;

    const newTrip = {
      id: newId,
      busId: data.busId || "BUS-01",
      busNumber: data.busNumber || "Bus 101",
      driverId: data.driverId || "DRV-01",
      driverName: data.driverName || "Driver",
      routeId: data.routeId || "RT-01",
      routeName: data.routeName || "Route 101",
      direction: data.direction || "Morning Pickup",
      scheduledStart: data.scheduledStart || "07:15 AM",
      actualStart: data.actualStart || "07:15 AM",
      scheduledEnd: data.scheduledEnd || "08:15 AM",
      status: data.status || "scheduled",
      currentStopIndex: Number(data.currentStopIndex) || 0,
      totalStops: Number(data.totalStops) || 4,
      progressPercent: Number(data.progressPercent) || 0,
      delayMinutes: Number(data.delayMinutes) || 0,
      passengersBoarded: Number(data.passengersBoarded) || 0,
      expectedPassengers: Number(data.expectedPassengers) || 45,
    };

    await db.execute(
      `INSERT INTO trips (
        id, busId, busNumber, driverId, driverName, routeId, routeName, direction,
        scheduledStart, actualStart, scheduledEnd, status, currentStopIndex, totalStops,
        progressPercent, delayMinutes, passengersBoarded, expectedPassengers
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newTrip.id, newTrip.busId, newTrip.busNumber, newTrip.driverId, newTrip.driverName,
        newTrip.routeId, newTrip.routeName, newTrip.direction, newTrip.scheduledStart,
        newTrip.actualStart, newTrip.scheduledEnd, newTrip.status, newTrip.currentStopIndex,
        newTrip.totalStops, newTrip.progressPercent, newTrip.delayMinutes,
        newTrip.passengersBoarded, newTrip.expectedPassengers
      ]
    );

    res.status(201).json(newTrip);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/trips/:id/status
router.patch("/:id/status", async (req, res, next) => {
  try {
    const { status, delayMinutes } = req.body;
    const existing = await db.queryFirst("SELECT * FROM trips WHERE id = ?", [req.params.id]);

    if (!existing) {
      return res.status(404).json({ message: "Trip not found" });
    }

    const newDelay = delayMinutes !== undefined ? Number(delayMinutes) : existing.delayMinutes;
    await db.execute(
      "UPDATE trips SET status = ?, delayMinutes = ? WHERE id = ?",
      [status || existing.status, newDelay, req.params.id]
    );

    const updated = await db.queryFirst("SELECT * FROM trips WHERE id = ?", [req.params.id]);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
