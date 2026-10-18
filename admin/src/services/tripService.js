import apiClient, { USE_MOCK } from "./api";
import { MOCK_TRIPS } from "../data/mockData";

let tripsCache = [...MOCK_TRIPS];

export const tripService = {
  getAll: async () => {
    if (USE_MOCK) {
      return new Promise((resolve) => setTimeout(() => resolve([...tripsCache]), 150));
    }
    return apiClient.get("/trips");
  },

  updateStatus: async (id, status, delayMinutes = 0) => {
    if (USE_MOCK) {
      const index = tripsCache.findIndex((t) => t.id === id);
      if (index !== -1) {
        tripsCache[index] = {
          ...tripsCache[index],
          status,
          delayMinutes,
        };
        return new Promise((resolve) => setTimeout(() => resolve(tripsCache[index]), 150));
      }
      return Promise.reject(new Error("Trip not found"));
    }
    return apiClient.patch(`/trips/${id}/status`, { status, delayMinutes });
  },

  create: async (tripData) => {
    if (USE_MOCK) {
      const newTrip = {
        ...tripData,
        id: `TRP-${Math.floor(9000 + Math.random() * 999)}`,
        currentStopIndex: 0,
        progressPercent: 0,
        status: "scheduled",
      };
      tripsCache.unshift(newTrip);
      return new Promise((resolve) => setTimeout(() => resolve(newTrip), 200));
    }
    return apiClient.post("/trips", tripData);
  },
};
