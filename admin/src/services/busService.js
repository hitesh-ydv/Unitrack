import apiClient, { USE_MOCK } from "./api";
import { MOCK_BUSES } from "../data/mockData";

let busesCache = [...MOCK_BUSES];

export const busService = {
  getAll: async () => {
    if (USE_MOCK) {
      return new Promise((resolve) => setTimeout(() => resolve([...busesCache]), 150));
    }
    return apiClient.get("/buses");
  },

  getById: async (id) => {
    if (USE_MOCK) {
      const bus = busesCache.find((b) => b.id === id);
      return new Promise((resolve, reject) => {
        if (bus) resolve({ ...bus });
        else reject(new Error("Bus not found"));
      });
    }
    return apiClient.get(`/buses/${id}`);
  },

  create: async (busData) => {
    if (USE_MOCK) {
      const newBus = {
        ...busData,
        id: `BUS-${String(busesCache.length + 1).padStart(2, "0")}`,
        lastPing: new Date().toISOString(),
        gpsStatus: "live",
      };
      busesCache.unshift(newBus);
      return new Promise((resolve) => setTimeout(() => resolve(newBus), 200));
    }
    return apiClient.post("/buses", busData);
  },

  update: async (id, updatedData) => {
    if (USE_MOCK) {
      const index = busesCache.findIndex((b) => b.id === id);
      if (index !== -1) {
        busesCache[index] = { ...busesCache[index], ...updatedData };
        return new Promise((resolve) => setTimeout(() => resolve(busesCache[index]), 150));
      }
      return Promise.reject(new Error("Bus not found"));
    }
    return apiClient.put(`/buses/${id}`, updatedData);
  },

  delete: async (id) => {
    if (USE_MOCK) {
      busesCache = busesCache.filter((b) => b.id !== id);
      return new Promise((resolve) => setTimeout(() => resolve({ success: true, id }), 150));
    }
    return apiClient.delete(`/buses/${id}`);
  },

  updateLocationBatch: (newLocations) => {
    // Used by the live simulation engine
    if (!USE_MOCK && Array.isArray(newLocations) && newLocations.length > 0) {
      apiClient
        .post(
          "/buses/batch-location",
          newLocations.map((b) => ({
            id: b.id,
            currentLat: b.currentLat,
            currentLng: b.currentLng,
            speedKmh: b.speedKmh,
            headingDeg: b.headingDeg,
          }))
        )
        .catch(() => {});
    }
    busesCache = busesCache.map((bus) => {
      const update = newLocations.find((u) => u.id === bus.id);
      return update ? { ...bus, ...update } : bus;
    });
    return [...busesCache];
  },

  advanceFleet: async () => {
    if (USE_MOCK) return [...busesCache];
    return apiClient.post("/buses/advance-fleet");
  },

  getRouteDetails: async (busId) => {
    if (USE_MOCK) {
      const bus = busesCache.find((b) => b.id === busId);
      return { bus, route: null, stops: [] };
    }
    return apiClient.get(`/buses/${busId}/route-details`);
  },
};

