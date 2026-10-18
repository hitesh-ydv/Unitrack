const express = require("express");
const router = express.Router();
const db = require("../db/d1Client");

// GET /api/geofences
router.get("/", async (req, res, next) => {
  try {
    const geofences = await db.query("SELECT * FROM geofences ORDER BY id ASC");
    res.json(geofences);
  } catch (err) {
    next(err);
  }
});

// POST /api/geofences
router.post("/", async (req, res, next) => {
  try {
    const data = req.body;
    const all = await db.query("SELECT id FROM geofences");
    const newId = data.id || `GEO-${String(all.length + 1).padStart(2, "0")}`;

    const newGeofence = {
      id: newId,
      name: data.name || "New Geofence Perimeter",
      type: data.type || "circle",
      lat: Number(data.lat) || 12.9716,
      lng: Number(data.lng) || 77.5946,
      radiusMeters: Number(data.radiusMeters) || 500,
      speedLimitKmh: Number(data.speedLimitKmh) || 25,
      triggerType: data.triggerType || "enter_and_exit",
      status: data.status || "active",
      description: data.description || "",
      color: data.color || "#3b82f6",
    };

    await db.execute(
      `INSERT INTO geofences (id, name, type, lat, lng, radiusMeters, speedLimitKmh, triggerType, status, description, color)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newGeofence.id, newGeofence.name, newGeofence.type, newGeofence.lat, newGeofence.lng,
        newGeofence.radiusMeters, newGeofence.speedLimitKmh, newGeofence.triggerType,
        newGeofence.status, newGeofence.description, newGeofence.color
      ]
    );

    res.status(201).json(newGeofence);
  } catch (err) {
    next(err);
  }
});

// PUT /api/geofences/:id
router.put("/:id", async (req, res, next) => {
  try {
    const existing = await db.queryFirst("SELECT * FROM geofences WHERE id = ?", [req.params.id]);
    if (!existing) {
      return res.status(404).json({ message: "Geofence not found" });
    }

    const updated = { ...existing, ...req.body };

    await db.execute(
      `UPDATE geofences SET
        name = ?, type = ?, lat = ?, lng = ?, radiusMeters = ?, speedLimitKmh = ?,
        triggerType = ?, status = ?, description = ?, color = ?
       WHERE id = ?`,
      [
        updated.name, updated.type, Number(updated.lat), Number(updated.lng),
        Number(updated.radiusMeters), Number(updated.speedLimitKmh), updated.triggerType,
        updated.status, updated.description, updated.color, req.params.id
      ]
    );

    const result = await db.queryFirst("SELECT * FROM geofences WHERE id = ?", [req.params.id]);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/geofences/:id
router.delete("/:id", async (req, res, next) => {
  try {
    const existing = await db.queryFirst("SELECT id FROM geofences WHERE id = ?", [req.params.id]);
    if (!existing) {
      return res.status(404).json({ message: "Geofence not found" });
    }

    await db.execute("DELETE FROM geofences WHERE id = ?", [req.params.id]);
    res.json({ success: true, id: req.params.id });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
