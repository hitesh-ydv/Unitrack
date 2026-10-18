const db = require("../db/d1Client");

// In-memory route progress trackers for active buses { busId: { waypointIndex: 0, fraction: 0 } }
const busProgressMap = new Map();

/**
 * Calculates compass heading in degrees from point A to point B
 */
function calculateBearing(lat1, lng1, lat2, lng2) {
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const y = Math.sin(dLng) * Math.cos((lat2 * Math.PI) / 180);
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.cos(dLng);
  let brng = (Math.atan2(y, x) * 180) / Math.PI;
  return Math.round((brng + 360) % 360);
}

/**
 * Advance active buses along their road route waypoints (Zomato / Swiggy rider style progression)
 */
async function advanceActiveFleetStep() {
  const buses = await db.query("SELECT * FROM buses WHERE status = 'active'");
  const updatedBuses = [];

  for (const bus of buses) {
    if (!bus.routeId) continue;

    const route = await db.queryFirst("SELECT * FROM routes WHERE id = ?", [bus.routeId]);
    if (!route || !route.waypoints) continue;

    let waypoints = [];
    try {
      waypoints = typeof route.waypoints === "string" ? JSON.parse(route.waypoints) : route.waypoints;
    } catch {
      waypoints = [];
    }

    if (!Array.isArray(waypoints) || waypoints.length < 2) continue;

    let progress = busProgressMap.get(bus.id) || { index: 0, forward: true };

    // Advance 1 waypoint per step
    if (progress.forward) {
      progress.index += 1;
      if (progress.index >= waypoints.length - 1) {
        progress.index = waypoints.length - 1;
        progress.forward = false; // Turn around or loop back
      }
    } else {
      progress.index -= 1;
      if (progress.index <= 0) {
        progress.index = 0;
        progress.forward = true;
      }
    }
    busProgressMap.set(bus.id, progress);

    const currPoint = waypoints[progress.index];
    const nextTargetIndex = progress.forward
      ? Math.min(waypoints.length - 1, progress.index + 1)
      : Math.max(0, progress.index - 1);
    const nextPoint = waypoints[nextTargetIndex];

    const currentLat = Number(currPoint[0]);
    const currentLng = Number(currPoint[1]);
    const headingDeg = calculateBearing(currPoint[0], currPoint[1], nextPoint[0], nextPoint[1]);

    // Realistic vehicle speed based on turns
    const speedKmh = Math.floor(28 + Math.random() * 16);
    const lastPing = new Date().toISOString();

    await db.execute(
      `UPDATE buses SET currentLat = ?, currentLng = ?, headingDeg = ?, speedKmh = ?, lastPing = ?, gpsStatus = 'live' WHERE id = ?`,
      [currentLat, currentLng, headingDeg, speedKmh, lastPing, bus.id]
    );

    updatedBuses.push({
      ...bus,
      currentLat,
      currentLng,
      headingDeg,
      speedKmh,
      lastPing,
      gpsStatus: "live",
    });
  }

  return updatedBuses;
}

module.exports = {
  calculateBearing,
  advanceActiveFleetStep,
  busProgressMap,
};
