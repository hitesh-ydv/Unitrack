import apiClient from "./api";

export const geofenceService = {
  getAll: async () => {
    return apiClient.get("/geofences");
  },

  getById: async (id) => {
    return apiClient.get(`/geofences/${id}`);
  },

  create: async (data) => {
    return apiClient.post("/geofences", data);
  },

  update: async (id, data) => {
    return apiClient.put(`/geofences/${id}`, data);
  },

  delete: async (id) => {
    return apiClient.delete(`/geofences/${id}`);
  },
};
