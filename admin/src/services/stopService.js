import apiClient, { USE_MOCK } from "./api";
import { MOCK_STOPS } from "../data/mockData";

let stopsCache = [...MOCK_STOPS];

export const stopService = {
  getAll: async () => {
    if (USE_MOCK) {
      return new Promise((resolve) => setTimeout(() => resolve([...stopsCache]), 150));
    }
    return apiClient.get("/stops");
  },

  getById: async (id) => {
    if (USE_MOCK) {
      const stop = stopsCache.find((s) => s.id === id);
      return new Promise((resolve, reject) => {
        if (stop) resolve({ ...stop });
        else reject(new Error("Stop not found"));
      });
    }
    return apiClient.get(`/stops/${id}`);
  },

  create: async (stopData) => {
    if (USE_MOCK) {
      const newStop = {
        ...stopData,
        id: `STP-${String(stopsCache.length + 1).padStart(2, "0")}`,
        studentCount: 0,
      };
      stopsCache.push(newStop);
      return new Promise((resolve) => setTimeout(() => resolve(newStop), 200));
    }
    return apiClient.post("/stops", stopData);
  },

  update: async (id, updatedData) => {
    if (USE_MOCK) {
      const index = stopsCache.findIndex((s) => s.id === id);
      if (index !== -1) {
        stopsCache[index] = { ...stopsCache[index], ...updatedData };
        return new Promise((resolve) => setTimeout(() => resolve(stopsCache[index]), 150));
      }
      return Promise.reject(new Error("Stop not found"));
    }
    return apiClient.put(`/stops/${id}`, updatedData);
  },

  delete: async (id) => {
    if (USE_MOCK) {
      stopsCache = stopsCache.filter((s) => s.id !== id);
      return new Promise((resolve) => setTimeout(() => resolve({ success: true, id }), 150));
    }
    return apiClient.delete(`/stops/${id}`);
  },

  importBatch: async (stopsList) => {
    if (USE_MOCK) {
      const created = [];
      for (const s of stopsList) {
        const existingIdx = stopsCache.findIndex((ex) => ex.code === s.code || ex.id === s.id);
        if (existingIdx !== -1) {
          stopsCache[existingIdx] = { ...stopsCache[existingIdx], ...s };
          created.push(stopsCache[existingIdx]);
        } else {
          const newStop = {
            ...s,
            id: s.id || `STP-${String(stopsCache.length + 1).padStart(2, "0")}`,
            studentCount: s.studentCount || 0,
          };
          stopsCache.push(newStop);
          created.push(newStop);
        }
      }
      return new Promise((resolve) => setTimeout(() => resolve(created), 200));
    }
    return apiClient.post("/stops/batch", { stops: stopsList });
  },
};
