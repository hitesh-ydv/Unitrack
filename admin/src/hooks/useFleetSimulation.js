import { useState, useEffect, useRef } from "react";
import { busService } from "../services/busService";

/**
 * Custom Hook: useFleetSimulation (Realtime Backend Telemetry Sync)
 * Synchronizes with real vehicle telematics from the backend API (or Postman updates).
 * Polls the backend regularly so that any location update made via Postman or GPS tracker
 * appears live on the admin map immediately.
 */
export const useFleetSimulation = (initialBuses = [], routes = [], isEnabled = true) => {
  const [buses, setBuses] = useState(initialBuses);
  const [isSimulating, setIsSimulating] = useState(isEnabled);
  const [speedMultiplier, setSpeedMultiplier] = useState(1); // Poll interval rate
  const [lastTick, setLastTick] = useState(Date.now());

  // Update buses whenever initialBuses change
  useEffect(() => {
    if (Array.isArray(initialBuses)) {
      setBuses(initialBuses);
    }
  }, [initialBuses]);

  // Realtime Polling Loop: Fetches latest bus GPS telemetry from the backend API
  useEffect(() => {
    if (!isSimulating) return;

    let isMounted = true;
    // Interval based on speedMultiplier: 1x -> 2500ms, 2x -> 1500ms, 4x -> 800ms
    const intervalMs = Math.max(800, Math.round(2500 / speedMultiplier));

    const pollBackendTelemetry = async () => {
      try {
        const freshBuses = await busService.getAll();
        if (isMounted && Array.isArray(freshBuses)) {
          setBuses(freshBuses);
          setLastTick(Date.now());
        }
      } catch (err) {
        // Silently tolerate transient network glitches during polling
      }
    };

    const intervalId = setInterval(pollBackendTelemetry, intervalMs);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [isSimulating, speedMultiplier]);

  const toggleSimulation = () => setIsSimulating((prev) => !prev);

  // Trigger traffic delay by persisting directly to backend API
  const triggerSimulatedDelay = async (busId) => {
    const targetBus = buses.find((b) => b.id === busId);
    const newDelay = (targetBus?.delayMinutes || 0) + 10;

    // Optimistically update local state
    setBuses((prev) =>
      prev.map((b) => (b.id === busId ? { ...b, delayMinutes: newDelay } : b))
    );

    // Save delay to backend
    try {
      await busService.updateLocation(busId, { delayMinutes: newDelay });
    } catch (e) {
      console.warn("Failed to persist delay update to backend:", e);
    }
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
