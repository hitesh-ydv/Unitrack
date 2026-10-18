const UNIVERSITY_COORDINATES = {
  lat: 12.9716,
  lng: 77.5946,
  name: "Apex University Central Terminal",
  code: "S-001",
};

/**
 * Calculates a road-accurate driving route between coordinates using OpenStreetMap OSRM.
 * Supports outAndBack: true where the bus travels outward and returns along the EXACT same road.
 */
async function computeRoadRoute(waypoints = [], enforceUniversityLoop = true, outAndBack = false) {
  let points = waypoints.map((p) => {
    if (Array.isArray(p)) return { lat: Number(p[0]), lng: Number(p[1]) };
    return { lat: Number(p.lat), lng: Number(p.lng) };
  });

  // Ensure first point is University Terminal
  const startMatches =
    points.length > 0 &&
    Math.abs(points[0].lat - UNIVERSITY_COORDINATES.lat) < 0.0005 &&
    Math.abs(points[0].lng - UNIVERSITY_COORDINATES.lng) < 0.0005;

  if (!startMatches) {
    points.unshift({ lat: UNIVERSITY_COORDINATES.lat, lng: UNIVERSITY_COORDINATES.lng });
  }

  // If NOT outAndBack, and enforceUniversityLoop is true, ensure last point is University
  if (!outAndBack && enforceUniversityLoop) {
    const endMatches =
      points.length > 1 &&
      Math.abs(points[points.length - 1].lat - UNIVERSITY_COORDINATES.lat) < 0.0005 &&
      Math.abs(points[points.length - 1].lng - UNIVERSITY_COORDINATES.lng) < 0.0005;

    if (!endMatches) {
      points.push({ lat: UNIVERSITY_COORDINATES.lat, lng: UNIVERSITY_COORDINATES.lng });
    }
  }

  // Need at least 2 points
  if (points.length < 2) {
    points = [
      { lat: UNIVERSITY_COORDINATES.lat, lng: UNIVERSITY_COORDINATES.lng },
      { lat: 12.9820, lng: 77.6180 },
    ];
  }

  // Format coordinates for OSRM: lng,lat;lng,lat...
  const coordString = points.map((p) => `${p.lng.toFixed(6)},${p.lat.toFixed(6)}`).join(";");
  const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${coordString}?overview=full&geometries=geojson&steps=true`;

  let outboundWaypoints = [];
  let outboundDistanceKm = 0;
  let outboundDurationMin = 0;
  let streetNames = new Set();
  let isRoadSnapped = false;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(osrmUrl, {
      signal: controller.signal,
      headers: { "User-Agent": "UniTrack-Transit-Fleet/1.0" },
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (data.code === "Ok" && data.routes && data.routes.length > 0) {
        const osrmRoute = data.routes[0];
        // OSRM coordinates are [lng, lat], Leaflet polyline expects [lat, lng]
        outboundWaypoints = osrmRoute.geometry.coordinates.map(([lng, lat]) => [
          Number(lat.toFixed(6)),
          Number(lng.toFixed(6)),
        ]);

        outboundDistanceKm = Number((osrmRoute.distance / 1000).toFixed(1));
        outboundDurationMin = Math.max(1, Math.round(osrmRoute.duration / 60));
        isRoadSnapped = true;

        if (osrmRoute.legs) {
          for (const leg of osrmRoute.legs) {
            if (leg.steps) {
              for (const step of leg.steps) {
                if (step.name && step.name.trim().length > 0) {
                  streetNames.add(step.name.trim());
                }
              }
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn("[RoutingService] OSRM query fallback:", err.message);
  }

  // Fallback interpolation if OSRM unavailable
  if (outboundWaypoints.length < 2) {
    outboundWaypoints = interpolateDenseCoordinates(points);
    outboundDistanceKm = calculateApproxDistanceKm(outboundWaypoints);
    outboundDurationMin = Math.round((outboundDistanceKm / 25) * 60);
    streetNames.add("University Campus Road");
    streetNames.add("Connecting Arterial Corridor");
  }

  // If outAndBack is enabled ("route should be same in going and back again"):
  // The return journey traverses the EXACT SAME road and street waypoints in reverse!
  if (outAndBack) {
    // Reverse the outbound road waypoints (excluding duplicate turnaround point)
    const returnWaypoints = [...outboundWaypoints].reverse().slice(1);
    const fullRoundTripWaypoints = [...outboundWaypoints, ...returnWaypoints];
    const totalDistanceKm = Number((outboundDistanceKm * 2).toFixed(1));
    const totalDurationMin = outboundDurationMin * 2;

    return {
      waypoints: fullRoundTripWaypoints,
      outboundWaypoints: outboundWaypoints,
      returnWaypoints: [...outboundWaypoints].reverse(),
      distanceKm: totalDistanceKm,
      oneWayDistanceKm: outboundDistanceKm,
      estimatedDurationMin: totalDurationMin,
      oneWayDurationMin: outboundDurationMin,
      streetsTraversed: Array.from(streetNames),
      isRoadSnapped,
      pointCount: fullRoundTripWaypoints.length,
      isOutAndBack: true,
    };
  }

  return {
    waypoints: outboundWaypoints,
    distanceKm: outboundDistanceKm,
    estimatedDurationMin: outboundDurationMin,
    streetsTraversed: Array.from(streetNames),
    isRoadSnapped,
    pointCount: outboundWaypoints.length,
    isOutAndBack: false,
  };
}

/**
 * Generates symmetric stop sequence for out-and-back route:
 * [University, S1, S2, S3, S2, S1, University]
 */
function generateSymmetricStops(outboundStopIds = []) {
  const cleanStops = outboundStopIds.filter((id) => id && id !== "STP-04");
  const returnStops = [...cleanStops].reverse().slice(1); // avoid duplicating turnaround stop
  return ["STP-04", ...cleanStops, ...returnStops, "STP-04"];
}

/**
 * Interpolates smooth intermediate points between pins for smooth rider animation
 */
function interpolateDenseCoordinates(points, stepsBetween = 12) {
  const result = [];
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];

    for (let step = 0; step < stepsBetween; step++) {
      const t = step / stepsBetween;
      const lat = p1.lat + (p2.lat - p1.lat) * t;
      const lng = p1.lng + (p2.lng - p1.lng) * t;
      result.push([Number(lat.toFixed(6)), Number(lng.toFixed(6))]);
    }
  }
  const last = points[points.length - 1];
  result.push([Number(last.lat.toFixed(6)), Number(last.lng.toFixed(6))]);
  return result;
}

function calculateApproxDistanceKm(coords) {
  let totalKm = 0;
  for (let i = 0; i < coords.length - 1; i++) {
    const [lat1, lng1] = coords[i];
    const [lat2, lng2] = coords[i + 1];
    const R = 6371; // Earth radius km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    totalKm += R * c;
  }
  return Number(totalKm.toFixed(1));
}

/**
 * Reverse geocode a latitude & longitude to get the street/road name
 */
async function reverseGeocodeStreet(lat, lng) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=17&addressdetails=1`;

    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "UniTrack-Transit-Fleet/1.0" },
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};
      const road = addr.road || addr.street || addr.pedestrian || addr.suburb || data.name;
      const neighborhood = addr.neighbourhood || addr.suburb || addr.city_district || "";

      let stopName = road || "Transit Waypoint";
      if (neighborhood && road && !road.includes(neighborhood)) {
        stopName = `${road}, ${neighborhood}`;
      }

      return {
        roadName: road || "City Road",
        suggestedStopName: stopName,
        displayName: data.display_name,
        zone: neighborhood || addr.city || "Transit Corridor",
      };
    }
  } catch (err) {
    console.warn("[RoutingService] Reverse geocode error:", err.message);
  }

  return {
    roadName: `Road near ${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)}`,
    suggestedStopName: `Stop @ ${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)}`,
    displayName: `${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)}`,
    zone: "Metro Zone",
  };
}

function haversineDistanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculates dynamic Estimated Time of Arrival (ETA) and next-stop telemetry for all stops
 */
function computeStopETAs(waypoints = [], orderedStops = [], busLat, busLng, busSpeedKmh = 35) {
  if (!Array.isArray(waypoints) || waypoints.length === 0 || !Array.isArray(orderedStops) || orderedStops.length === 0) {
    return {
      nextStop: null,
      stopsWithETA: orderedStops,
    };
  }

  const effectiveSpeed = Math.max(Number(busSpeedKmh) || 30, 20); // min 20 km/h in city traffic

  // 1. Find closest waypoint to current bus position
  let busWpIdx = 0;
  let minBusDist = Infinity;
  for (let i = 0; i < waypoints.length; i++) {
    const dist = haversineDistanceKm(busLat, busLng, waypoints[i][0], waypoints[i][1]);
    if (dist < minBusDist) {
      minBusDist = dist;
      busWpIdx = i;
    }
  }

  // 2. Map each stop in ordered sequence to its waypoint index along the route
  const midPoint = Math.floor(orderedStops.length / 2);
  let lastStopWpIdx = 0;

  const stopsWithWaypoints = orderedStops.map((stop, sIdx) => {
    // For out-and-back journeys, look ahead from lastStopWpIdx
    let bestWpIdx = lastStopWpIdx;
    let minStopDist = Infinity;

    // Search window for stop
    const searchStart = sIdx === 0 ? 0 : Math.max(0, lastStopWpIdx);
    const searchEnd = waypoints.length;

    for (let i = searchStart; i < searchEnd; i++) {
      const dist = haversineDistanceKm(stop.lat, stop.lng, waypoints[i][0], waypoints[i][1]);
      if (dist < minStopDist) {
        minStopDist = dist;
        bestWpIdx = i;
      }
    }

    lastStopWpIdx = bestWpIdx;
    return {
      ...stop,
      sequenceOrder: sIdx + 1,
      waypointIndex: bestWpIdx,
    };
  });

  // 3. Compute distance along waypoints and ETA for each stop
  let nextStop = null;
  let hasFoundNext = false;

  const now = new Date();

  const stopsWithETA = stopsWithWaypoints.map((stop, sIdx) => {
    const isPast = stop.waypointIndex < busWpIdx && sIdx < stopsWithWaypoints.length - 1;

    if (isPast) {
      return {
        ...stop,
        status: "passed",
        statusLabel: "Departed",
        distanceKm: 0,
        distanceMeters: 0,
        etaMinutes: 0,
        etaLabel: "Departed",
        expectedTime: stop.morningTime || "Passed",
      };
    }

    // Calculate distance from current bus waypoint to this stop waypoint
    let distKm = 0;
    const startIdx = Math.min(busWpIdx, stop.waypointIndex);
    const endIdx = Math.max(busWpIdx, stop.waypointIndex);

    for (let i = startIdx; i < endIdx; i++) {
      distKm += haversineDistanceKm(
        waypoints[i][0],
        waypoints[i][1],
        waypoints[i + 1][0],
        waypoints[i + 1][1]
      );
    }

    const etaMin = Math.max(1, Math.round((distKm / effectiveSpeed) * 60));
    const arrivalDate = new Date(now.getTime() + etaMin * 60000);
    const arrivalHours = arrivalDate.getHours();
    const arrivalMins = String(arrivalDate.getMinutes()).padStart(2, "0");
    const ampm = arrivalHours >= 12 ? "PM" : "AM";
    const formattedHours = arrivalHours % 12 || 12;
    const arrivalClockTime = `${formattedHours}:${arrivalMins} ${ampm}`;

    const isNext = !hasFoundNext;
    if (isNext) {
      hasFoundNext = true;
    }

    const stopData = {
      ...stop,
      status: isNext ? "next" : "upcoming",
      statusLabel: isNext ? "Next Stop" : "Upcoming Stop",
      distanceKm: Number(distKm.toFixed(2)),
      distanceMeters: Math.round(distKm * 1000),
      etaMinutes: etaMin,
      etaLabel: `${etaMin} min${etaMin > 1 ? "s" : ""}`,
      expectedTime: arrivalClockTime,
    };

    if (isNext) {
      nextStop = stopData;
    }

    return stopData;
  });

  // Fallback if bus reached the final stop
  if (!nextStop && stopsWithETA.length > 0) {
    nextStop = stopsWithETA[stopsWithETA.length - 1];
  }

  return {
    nextStop,
    stopsWithETA,
  };
}

module.exports = {
  UNIVERSITY_COORDINATES,
  computeRoadRoute,
  generateSymmetricStops,
  reverseGeocodeStreet,
  computeStopETAs,
  haversineDistanceKm,
};

