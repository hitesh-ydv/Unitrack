/**
 * Route & Stop Progression Logic for UniTrack
 * Determines covered stops, next stop, and ETA based on bus position along assigned route waypoints.
 */

// Helper to calculate euclidean or spherical distance between two points in km
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Finds the index of the closest waypoint along the route to a given coordinate [lat, lng]
 */
export function findClosestWaypointIndex(pointLat, pointLng, waypoints = []) {
  if (!waypoints || waypoints.length === 0) return 0;
  let minDistance = Infinity;
  let closestIndex = 0;

  for (let i = 0; i < waypoints.length; i++) {
    const [wLat, wLng] = waypoints[i];
    const dist = calculateDistanceKm(pointLat, pointLng, wLat, wLng);
    if (dist < minDistance) {
      minDistance = dist;
      closestIndex = i;
    }
  }

  return closestIndex;
}

/**
 * Computes full route stop analysis for a bus:
 * - resolves ordered stop objects
 * - classifies each stop as 'covered', 'next', or 'upcoming'
 * - computes remaining distance to next stop and estimated arrival minutes
 */
export function computeRouteStopProgress(bus, route, allStops = []) {
  if (!bus || !route) {
    return {
      orderedStops: [],
      coveredCount: 0,
      remainingCount: 0,
      totalCount: 0,
      nextStop: null,
      previousStop: null,
      etaMinutes: 0,
      sourceName: "Route Start",
      destinationName: "University Campus Terminal",
      progressPercent: 0,
    };
  }

  const waypoints = route.waypoints || [];
  const stopIds = route.stops || [];

  // Resolve stop objects in order
  const stopsMap = new Map((allStops || []).map((s) => [s.id, s]));
  const orderedStops = stopIds.map((id, index) => {
    const stopData = stopsMap.get(id);
    if (stopData) {
      return {
        ...stopData,
        routeIndex: index,
        closestWaypointIndex: findClosestWaypointIndex(stopData.lat, stopData.lng, waypoints),
      };
    }
    return {
      id,
      name: `Stop ${index + 1}`,
      lat: waypoints[Math.min(index * 2, waypoints.length - 1)]?.[0] || 12.9716,
      lng: waypoints[Math.min(index * 2, waypoints.length - 1)]?.[1] || 77.5946,
      routeIndex: index,
      closestWaypointIndex: Math.min(index * 2, waypoints.length - 1),
    };
  });

  // Determine bus's current position along route waypoints
  const busWaypointIndex = findClosestWaypointIndex(bus.currentLat, bus.currentLng, waypoints);

  // Classify each stop
  let nextStopFound = false;
  let nextStop = null;
  let previousStop = null;
  let coveredCount = 0;

  const analyzedStops = orderedStops.map((stop, idx) => {
    let status = "upcoming";

    // A stop is covered if the bus has progressed past its closest waypoint on this trip
    if (busWaypointIndex > stop.closestWaypointIndex + 0.5) {
      status = "covered";
      coveredCount++;
      previousStop = stop;
    } else if (!nextStopFound) {
      status = "next";
      nextStopFound = true;
      nextStop = stop;
    } else {
      status = "upcoming";
    }

    return {
      ...stop,
      status,
    };
  });

  // If bus is past all stops, the last stop is current
  if (!nextStop && orderedStops.length > 0) {
    nextStop = orderedStops[orderedStops.length - 1];
  }

  // Calculate ETA to next stop
  let etaMinutes = 3;
  if (nextStop && bus.currentLat && bus.currentLng) {
    const distToNextKm = calculateDistanceKm(bus.currentLat, bus.currentLng, nextStop.lat, nextStop.lng);
    const speed = Math.max(bus.speedKmh || 25, 15); // assume at least 15 km/h in city traffic
    const hours = distToNextKm / speed;
    etaMinutes = Math.max(1, Math.round(hours * 60 + (bus.delayMinutes > 5 ? 2 : 0)));
  }

  const totalCount = orderedStops.length;
  const remainingCount = Math.max(0, totalCount - coveredCount);
  const progressPercent = totalCount > 0 ? Math.round((coveredCount / totalCount) * 100) : 0;

  const sourceName = orderedStops[0]?.name || "Route Origin";
  const destinationName =
    orderedStops[orderedStops.length - 1]?.name || "Apex University Central Terminal";

  return {
    orderedStops: analyzedStops,
    coveredCount,
    remainingCount,
    totalCount,
    nextStop,
    previousStop,
    etaMinutes,
    sourceName,
    destinationName,
    progressPercent,
  };
}
