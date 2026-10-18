import apiClient, { USE_MOCK } from "./api";
import { MOCK_GEOFENCES } from "../data/mockData";

let geofencesCache = [...MOCK_GEOFENCES];

export const geofenceService = {
  getAll: async () => {
    if (USE_MOCK) {
      return new Promise((resolve) => setTimeout(() => resolve([...geofencesCache]), 150));
    }
    return apiClient.get("/geofences");
  },

  create: async (data) => {
    if (USE_MOCK) {
      const newGeofence = {
        ...data,
        id: `GEO-${String(geofencesCache.length + 1).padStart(2, "0")}`,
        status: "active",
      };
      geofencesCache.unshift(newGeofence);
      return new Promise((resolve) => setTimeout(() => resolve(newGeofence), 200));
    }
    return apiClient.post("/geofences", data);
  },

  update: async (id, data) => {
    if (USE_MOCK) {
      const idx = geofencesCache.findIndex((g) => g.id === id);
      if (idx !== -1) {
        geofencesCache[idx] = { ...geofencesCache[idx], ...data };
        return new Promise((resolve) => setTimeout(() => resolve(geofencesCache[idx]), 150));
      }
      return Promise.reject(new Error("Geofence not found"));
    }
    return apiClient.put(`/geofences/${id}`, data);
  },

  delete: async (id) => {
    if (USE_MOCK) {
      geofencesCache = geofencesCache.filter((g) => g.id !== id);
      return new Promise((resolve) => setTimeout(() => resolve({ success: true, id }), 150));
    }
    return apiClient.delete(`/geofences/${id}`);
  },
};
