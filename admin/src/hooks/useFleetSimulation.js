import { useState, useEffect, useRef } from "react";
import { busService } from "../services/busService";

/**
 * Calculates compass heading bearing in degrees between two coordinates
 */
function getBearing(lat1, lng1, lat2, lng2) {
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const y = Math.sin(dLng) * Math.cos((lat2 * Math.PI) / 180);
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.cos(dLng);
  let brng = (Math.atan2(y, x) * 180) / Math.PI;
  return Math.round((brng + 360) % 360);
}

/**
 * Custom Hook: useFleetSimulation
 * Provides 60 FPS smooth animation (like Zomato / Swiggy delivery riders)
 * along actual road waypoints, smooth turning, and telemetry sync.
 */
export const useFleetSimulation = (initialBuses = [], routes = [], isEnabled = true) => {
  const [buses, setBuses] = useState(initialBuses);
  const [isSimulating, setIsSimulating] = useState(isEnabled);
  const [speedMultiplier, setSpeedMultiplier] = useState(1); // 1x, 2x, 4x
  const [lastTick, setLastTick] = useState(Date.now());

  // Keep routes lookup ref for animation loop
  const routesRef = useRef([]);
  useEffect(() => {
    routesRef.current = routes;
  }, [routes]);

  // Per-bus trajectory tracking state
  // busTrackingRef.current[busId] = { segmentIndex, t, forward, speedKmh }
  const busTrackingRef = useRef({});

  // Initialize or update tracking state when buses or routes change
  useEffect(() => {
    const tracking = { ...busTrackingRef.current };
    initialBuses.forEach((bus, i) => {
      if (!tracking[bus.id]) {
        tracking[bus.id] = {
          segmentIndex: (i * 3) % 20, // distribute buses across their route segments
          t: 0.1,
          forward: true,
          speedKmh: bus.speedKmh || 32,
        };
      }
    });
    busTrackingRef.current = tracking;
    setBuses(initialBuses);
  }, [initialBuses]);

  // 60 FPS Smooth requestAnimationFrame loop (Zomato / Swiggy rider style)
  useEffect(() => {
    if (!isSimulating) return;

    let animationFrameId;
    let lastTime = performance.now();
    let lastBackendSync = Date.now();

    const animate = (currentTime) => {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.1); // seconds elapsed, capped at 100ms
      lastTime = currentTime;

      const currentRoutes = routesRef.current;
      const tracking = busTrackingRef.current;

      setBuses((prevBuses) => {
        let changed = false;
        const nextBuses = prevBuses.map((bus) => {
          if (bus.status !== "active" || bus.gpsStatus === "offline") {
            return bus;
          }

          // Find assigned route
          const route = currentRoutes.find((r) => r.id === bus.routeId);
          const waypoints = route?.waypoints || [];

          if (Array.isArray(waypoints) && waypoints.length >= 2) {
            changed = true;
            let track = tracking[bus.id];
            if (!track) {
              track = { segmentIndex: 0, t: 0, forward: true, speedKmh: bus.speedKmh || 32 };
              tracking[bus.id] = track;
            }

            // Speed factor: approx progress per second along waypoints
            const progressRate = 0.08 * (track.speedKmh / 35) * speedMultiplier;
            track.t += progressRate * dt;

            const totalSegments = waypoints.length - 1;
            if (track.t >= 1.0) {
              track.t = 0;
              if (track.forward) {
                track.segmentIndex += 1;
                if (track.segmentIndex >= totalSegments) {
                  track.segmentIndex = totalSegments - 1;
                  track.forward = false; // smooth return loop
                }
              } else {
                track.segmentIndex -= 1;
                if (track.segmentIndex < 0) {
                  track.segmentIndex = 0;
                  track.forward = true;
                }
              }
            }

            const p1 = waypoints[track.segmentIndex];
            const p2 = waypoints[Math.min(waypoints.length - 1, track.segmentIndex + 1)];

            if (p1 && p2) {
              const [lat1, lng1] = p1;
              const [lat2, lng2] = p2;

              // Smooth linear interpolation along the road vector
              const currentLat = +(lat1 + (lat2 - lat1) * track.t).toFixed(6);
              const currentLng = +(lng1 + (lng2 - lng1) * track.t).toFixed(6);

              // Heading smoothly faces the direction of the road segment
              const targetBearing = track.forward
                ? getBearing(lat1, lng1, lat2, lng2)
                : getBearing(lat2, lng2, lat1, lng1);

              return {
                ...bus,
                currentLat,
                currentLng,
                headingDeg: targetBearing,
                lastPing: new Date().toISOString(),
              };
            }
          }

          // Fallback if bus has no waypoints yet: gentle drift
          const angle = ((bus.headingDeg || 45) * Math.PI) / 180;
          const delta = 0.00005 * speedMultiplier;
          return {
            ...bus,
            currentLat: +(bus.currentLat + Math.cos(angle) * delta).toFixed(6),
            currentLng: +(bus.currentLng + Math.sin(angle) * delta).toFixed(6),
            lastPing: new Date().toISOString(),
          };
        });

        // Periodic telemetry backend sync every 4 seconds
        if (Date.now() - lastBackendSync > 4000) {
          lastBackendSync = Date.now();
          busService.updateLocationBatch(nextBuses);
        }

        return changed ? nextBuses : prevBuses;
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [isSimulating, speedMultiplier]);

  const toggleSimulation = () => setIsSimulating((prev) => !prev);

  const triggerSimulatedDelay = (busId) => {
    setBuses((prev) =>
      prev.map((b) => (b.id === busId ? { ...b, delayMinutes: (b.delayMinutes || 0) + 10 } : b))
    );
  };

  return {
    buses,
    isSimulating,
    toggleSimulation,
    speedMultiplier,
    setSpeedMultiplier,
    lastTick,
    triggerSimulatedDelay,
  };
};
