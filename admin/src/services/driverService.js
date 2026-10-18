import apiClient, { USE_MOCK } from "./api";
import { MOCK_DRIVERS } from "../data/mockData";

let driversCache = [...MOCK_DRIVERS];

export const driverService = {
  getAll: async () => {
    if (USE_MOCK) {
      return new Promise((resolve) => setTimeout(() => resolve([...driversCache]), 150));
    }
    return apiClient.get("/drivers");
  },

  getById: async (id) => {
    if (USE_MOCK) {
      const driver = driversCache.find((d) => d.id === id);
      return new Promise((resolve, reject) => {
        if (driver) resolve({ ...driver });
        else reject(new Error("Driver not found"));
      });
    }
    return apiClient.get(`/drivers/${id}`);
  },

  create: async (driverData) => {
    if (USE_MOCK) {
      const newDriver = {
        ...driverData,
        id: `DRV-${String(driversCache.length + 1).padStart(2, "0")}`,
        incidentCount: 0,
        joinedDate: new Date().toISOString().split("T")[0],
      };
      driversCache.unshift(newDriver);
      return new Promise((resolve) => setTimeout(() => resolve(newDriver), 200));
    }
    return apiClient.post("/drivers", driverData);
  },

  update: async (id, updatedData) => {
    if (USE_MOCK) {
      const index = driversCache.findIndex((d) => d.id === id);
      if (index !== -1) {
        driversCache[index] = { ...driversCache[index], ...updatedData };
        return new Promise((resolve) => setTimeout(() => resolve(driversCache[index]), 150));
      }
      return Promise.reject(new Error("Driver not found"));
    }
    return apiClient.put(`/drivers/${id}`, updatedData);
  },

  delete: async (id) => {
    if (USE_MOCK) {
      driversCache = driversCache.filter((d) => d.id !== id);
      return new Promise((resolve) => setTimeout(() => resolve({ success: true, id }), 150));
    }
    return apiClient.delete(`/drivers/${id}`);
  },
};
