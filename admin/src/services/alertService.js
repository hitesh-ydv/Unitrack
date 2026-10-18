import apiClient, { USE_MOCK } from "./api";
import { MOCK_ALERTS } from "../data/mockData";

let alertsCache = [...MOCK_ALERTS];

export const alertService = {
  getAll: async () => {
    if (USE_MOCK) {
      return new Promise((resolve) => setTimeout(() => resolve([...alertsCache]), 150));
    }
    return apiClient.get("/alerts");
  },

  acknowledge: async (id) => {
    if (USE_MOCK) {
      alertsCache = alertsCache.map((a) => (a.id === id ? { ...a, acknowledged: true } : a));
      return new Promise((resolve) => setTimeout(() => resolve({ success: true, id }), 150));
    }
    return apiClient.post(`/alerts/${id}/acknowledge`);
  },

  resolve: async (id) => {
    if (USE_MOCK) {
      alertsCache = alertsCache.map((a) => (a.id === id ? { ...a, resolved: true, acknowledged: true } : a));
      return new Promise((resolve) => setTimeout(() => resolve({ success: true, id }), 150));
    }
    return apiClient.post(`/alerts/${id}/resolve`);
  },

  create: async (alertData) => {
    if (USE_MOCK) {
      const newAlert = {
        ...alertData,
        id: `ALT-${Math.floor(500 + Math.random() * 499)}`,
        timestamp: "Just now",
        acknowledged: false,
        resolved: false,
      };
      alertsCache.unshift(newAlert);
      return new Promise((resolve) => setTimeout(() => resolve(newAlert), 200));
    }
    return apiClient.post("/alerts", alertData);
  },
};
