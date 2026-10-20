const express = require("express");
const router = express.Router();
const db = require("../db/d1Client");

const DEFAULT_SETTINGS = {
  universityName: "Apex University of Science & Technology",
  campusBranch: "Main Technology Campus (East Hub)",
  emergencyHotline: "+91 (080) 2841-9999",
  transportEmail: "transport-desk@apex.edu",
  selectedTileProviderId: "osm",
  gpsPingIntervalSec: 5,
  delayThresholdMin: 10,
  overspeedLimitKmh: 50,
  geofenceBufferMeters: 50,
  enableAutoAlerts: true,
  enableSmsNotifications: true,
  enableParentPortalSync: true,
};

// GET /api/settings
router.get("/", async (req, res, next) => {
  try {
    const row = await db.queryFirst("SELECT value FROM settings WHERE key = 'general_settings'");
    if (!row || !row.value) {
      return res.json(DEFAULT_SETTINGS);
    }
    const parsed = typeof row.value === "string" ? JSON.parse(row.value) : row.value;
    res.json(parsed);
  } catch (err) {
    next(err);
  }
});

// PUT /api/settings
router.put("/", async (req, res, next) => {
  try {
    const current = await db.queryFirst("SELECT value FROM settings WHERE key = 'general_settings'");
    const currentSettings = current && current.value
      ? (typeof current.value === "string" ? JSON.parse(current.value) : current.value)
      : DEFAULT_SETTINGS;

    const merged = { ...currentSettings, ...req.body };
    const serialized = JSON.stringify(merged);

    await db.execute(
      "INSERT OR REPLACE INTO settings (key, value) VALUES ('general_settings', ?)",
      [serialized]
    );

    res.json(merged);
  } catch (err) {
    next(err);
  }
});

// POST /api/settings/reset-database - Purge all previous data from Cloudflare D1
router.post("/reset-database", async (req, res, next) => {
  try {
    const clearDb = require("../db/clearDb");
    await clearDb();
    res.json({ success: true, message: "Cloudflare D1 database cleared successfully." });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
