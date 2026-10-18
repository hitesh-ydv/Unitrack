const express = require("express");
const router = express.Router();
const db = require("../db/d1Client");

function formatStop(s) {
  if (!s) return null;
  return {
    ...s,
    hasShelter: Boolean(s.hasShelter),
    hasCctv: Boolean(s.hasCctv),
  };
}

// GET /api/stops
router.get("/", async (req, res, next) => {
  try {
    const rawStops = await db.query("SELECT * FROM stops ORDER BY id ASC");
    res.json(rawStops.map(formatStop));
  } catch (err) {
    next(err);
  }
});

// GET /api/stops/:id
router.get("/:id", async (req, res, next) => {
  try {
    const raw = await db.queryFirst("SELECT * FROM stops WHERE id = ?", [req.params.id]);
    if (!raw) {
      return res.status(404).json({ message: "Stop not found" });
    }
    res.json(formatStop(raw));
  } catch (err) {
    next(err);
  }
});

// POST /api/stops
router.post("/", async (req, res, next) => {
  try {
    const data = req.body;
    const all = await db.query("SELECT id FROM stops");
    const newId = data.id || `STP-${String(all.length + 1).padStart(2, "0")}`;

    const newStop = {
      id: newId,
      name: data.name || "New Stop",
      code: data.code || `S-${all.length + 101}`,
      lat: Number(data.lat) || 12.9716,
      lng: Number(data.lng) || 77.5946,
      geofenceRadiusMeters: Number(data.geofenceRadiusMeters) || 80,
      hasShelter: data.hasShelter ? 1 : 0,
      hasCctv: data.hasCctv ? 1 : 0,
      morningTime: data.morningTime || "07:30 AM",
      eveningTime: data.eveningTime || "05:30 PM",
      studentCount: Number(data.studentCount) || 0,
      zone: data.zone || "Metro Zone",
    };

    await db.execute(
      `INSERT INTO stops (
        id, name, code, lat, lng, geofenceRadiusMeters, hasShelter, hasCctv,
        morningTime, eveningTime, studentCount, zone
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newStop.id, newStop.name, newStop.code, newStop.lat, newStop.lng,
        newStop.geofenceRadiusMeters, newStop.hasShelter, newStop.hasCctv,
        newStop.morningTime, newStop.eveningTime, newStop.studentCount, newStop.zone
      ]
    );

    res.status(201).json(formatStop(newStop));
  } catch (err) {
    next(err);
  }
});

// PUT /api/stops/:id
router.put("/:id", async (req, res, next) => {
  try {
    const existing = await db.queryFirst("SELECT * FROM stops WHERE id = ?", [req.params.id]);
    if (!existing) {
      return res.status(404).json({ message: "Stop not found" });
    }

    const updated = {
      ...existing,
      ...req.body,
      hasShelter: req.body.hasShelter !== undefined ? (req.body.hasShelter ? 1 : 0) : existing.hasShelter,
      hasCctv: req.body.hasCctv !== undefined ? (req.body.hasCctv ? 1 : 0) : existing.hasCctv,
    };

    await db.execute(
      `UPDATE stops SET
        name = ?, code = ?, lat = ?, lng = ?, geofenceRadiusMeters = ?,
        hasShelter = ?, hasCctv = ?, morningTime = ?, eveningTime = ?,
        studentCount = ?, zone = ?
       WHERE id = ?`,
      [
        updated.name, updated.code, Number(updated.lat), Number(updated.lng),
        Number(updated.geofenceRadiusMeters), updated.hasShelter, updated.hasCctv,
        updated.morningTime, updated.eveningTime, Number(updated.studentCount),
        updated.zone, req.params.id
      ]
    );

    const result = await db.queryFirst("SELECT * FROM stops WHERE id = ?", [req.params.id]);
    res.json(formatStop(result));
  } catch (err) {
    next(err);
  }
});

// DELETE /api/stops/:id
router.delete("/:id", async (req, res, next) => {
  try {
    const existing = await db.queryFirst("SELECT id FROM stops WHERE id = ?", [req.params.id]);
    if (!existing) {
      return res.status(404).json({ message: "Stop not found" });
    }

    await db.execute("DELETE FROM stops WHERE id = ?", [req.params.id]);
    res.json({ success: true, id: req.params.id });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
