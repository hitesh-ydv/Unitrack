const express = require("express");
const router = express.Router();
const db = require("../db/d1Client");

// GET /api/drivers
router.get("/", async (req, res, next) => {
  try {
    const drivers = await db.query("SELECT * FROM drivers ORDER BY name ASC");
    res.json(drivers);
  } catch (err) {
    next(err);
  }
});

// GET /api/drivers/:id
router.get("/:id", async (req, res, next) => {
  try {
    const driver = await db.queryFirst("SELECT * FROM drivers WHERE id = ?", [req.params.id]);
    if (!driver) {
      return res.status(404).json({ message: "Driver not found" });
    }
    res.json(driver);
  } catch (err) {
    next(err);
  }
});

// POST /api/drivers
router.post("/", async (req, res, next) => {
  try {
    const data = req.body;
    const all = await db.query("SELECT id FROM drivers");
    const newId = data.id || `DRV-${String(all.length + 1).padStart(2, "0")}`;

    const newDriver = {
      id: newId,
      name: data.name || "New Driver",
      licenseNumber: data.licenseNumber || "DL-000000000000",
      phone: data.phone || "",
      email: data.email || "",
      assignedBusId: data.assignedBusId || null,
      assignedBusNumber: data.assignedBusNumber || "Unassigned",
      status: data.status || "on_duty",
      rating: Number(data.rating) || 5.0,
      shift: data.shift || "Morning Shift",
      shiftHoursToday: Number(data.shiftHoursToday) || 0,
      incidentCount: Number(data.incidentCount) || 0,
      experienceYears: Number(data.experienceYears) || 0,
      bloodGroup: data.bloodGroup || "O+",
      joinedDate: data.joinedDate || new Date().toISOString().split("T")[0],
      photoUrl: data.photoUrl || null,
      licenseDocUrl: data.licenseDocUrl || null,
    };

    await db.execute(
      `INSERT INTO drivers (
        id, name, licenseNumber, phone, email, assignedBusId, assignedBusNumber,
        status, rating, shift, shiftHoursToday, incidentCount, experienceYears,
        bloodGroup, joinedDate, photoUrl, licenseDocUrl
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newDriver.id, newDriver.name, newDriver.licenseNumber, newDriver.phone, newDriver.email,
        newDriver.assignedBusId, newDriver.assignedBusNumber, newDriver.status, newDriver.rating,
        newDriver.shift, newDriver.shiftHoursToday, newDriver.incidentCount, newDriver.experienceYears,
        newDriver.bloodGroup, newDriver.joinedDate, newDriver.photoUrl, newDriver.licenseDocUrl
      ]
    );

    res.status(201).json(newDriver);
  } catch (err) {
    next(err);
  }
});

// PUT /api/drivers/:id
router.put("/:id", async (req, res, next) => {
  try {
    const existing = await db.queryFirst("SELECT * FROM drivers WHERE id = ?", [req.params.id]);
    if (!existing) {
      return res.status(404).json({ message: "Driver not found" });
    }

    const updated = { ...existing, ...req.body };

    await db.execute(
      `UPDATE drivers SET
        name = ?, licenseNumber = ?, phone = ?, email = ?, assignedBusId = ?,
        assignedBusNumber = ?, status = ?, rating = ?, shift = ?, shiftHoursToday = ?,
        incidentCount = ?, experienceYears = ?, bloodGroup = ?, photoUrl = ?, licenseDocUrl = ?
       WHERE id = ?`,
      [
        updated.name, updated.licenseNumber, updated.phone, updated.email, updated.assignedBusId,
        updated.assignedBusNumber, updated.status, Number(updated.rating), updated.shift,
        Number(updated.shiftHoursToday), Number(updated.incidentCount), Number(updated.experienceYears),
        updated.bloodGroup, updated.photoUrl, updated.licenseDocUrl, req.params.id
      ]
    );

    const result = await db.queryFirst("SELECT * FROM drivers WHERE id = ?", [req.params.id]);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/drivers/:id
router.delete("/:id", async (req, res, next) => {
  try {
    const existing = await db.queryFirst("SELECT id FROM drivers WHERE id = ?", [req.params.id]);
    if (!existing) {
      return res.status(404).json({ message: "Driver not found" });
    }

    await db.execute("DELETE FROM drivers WHERE id = ?", [req.params.id]);
    res.json({ success: true, id: req.params.id });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
