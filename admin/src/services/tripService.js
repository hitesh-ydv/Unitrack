import apiClient from "./api";

export const tripService = {
  getAll: async () => {
    return apiClient.get("/trips");
  },

  getById: async (id) => {
    return apiClient.get(`/trips/${id}`);
  },

  updateStatus: async (id, status, delayMinutes = 0) => {
    return apiClient.patch(`/trips/${id}/status`, { status, delayMinutes });
  },

  create: async (tripData) => {
    return apiClient.post("/trips", tripData);
  },

  update: async (id, tripData) => {
    return apiClient.put(`/trips/${id}`, tripData);
  },

  delete: async (id) => {
    return apiClient.delete(`/trips/${id}`);
  },
};
