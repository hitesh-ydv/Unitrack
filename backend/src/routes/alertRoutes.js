const express = require("express");
const router = express.Router();
const db = require("../db/d1Client");

function formatAlert(a) {
  if (!a) return null;
  return {
    ...a,
    acknowledged: Boolean(a.acknowledged),
    resolved: Boolean(a.resolved),
  };
}

// GET /api/alerts
router.get("/", async (req, res, next) => {
  try {
    const alerts = await db.query("SELECT * FROM alerts ORDER BY id DESC");
    res.json(alerts.map(formatAlert));
  } catch (err) {
    next(err);
  }
});

// POST /api/alerts
router.post("/", async (req, res, next) => {
  try {
    const data = req.body;
    const newId = data.id || `ALT-${Math.floor(500 + Math.random() * 499)}`;

    const newAlert = {
      id: newId,
      type: data.type || "info",
      severity: data.severity || "info",
      title: data.title || "Transit Notification",
      description: data.description || "",
      busId: data.busId || null,
      busNumber: data.busNumber || "Fleet Wide",
      driverName: data.driverName || "N/A",
      timestamp: data.timestamp || "Just now",
      acknowledged: data.acknowledged ? 1 : 0,
      resolved: data.resolved ? 1 : 0,
    };

    await db.execute(
      `INSERT INTO alerts (id, type, severity, title, description, busId, busNumber, driverName, timestamp, acknowledged, resolved)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newAlert.id, newAlert.type, newAlert.severity, newAlert.title, newAlert.description,
        newAlert.busId, newAlert.busNumber, newAlert.driverName, newAlert.timestamp,
        newAlert.acknowledged, newAlert.resolved
      ]
    );

    res.status(201).json(formatAlert(newAlert));
  } catch (err) {
    next(err);
  }
});

// POST /api/alerts/:id/acknowledge
router.post("/:id/acknowledge", async (req, res, next) => {
  try {
    const existing = await db.queryFirst("SELECT * FROM alerts WHERE id = ?", [req.params.id]);
    if (!existing) {
      return res.status(404).json({ message: "Alert not found" });
    }

    await db.execute("UPDATE alerts SET acknowledged = 1 WHERE id = ?", [req.params.id]);
    res.json({ success: true, id: req.params.id });
  } catch (err) {
    next(err);
  }
});

// POST /api/alerts/:id/resolve
router.post("/:id/resolve", async (req, res, next) => {
  try {
    const existing = await db.queryFirst("SELECT * FROM alerts WHERE id = ?", [req.params.id]);
    if (!existing) {
      return res.status(404).json({ message: "Alert not found" });
    }

    await db.execute("UPDATE alerts SET resolved = 1, acknowledged = 1 WHERE id = ?", [req.params.id]);
    res.json({ success: true, id: req.params.id });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
