import apiClient from "./api";

export const stopService = {
  getAll: async () => {
    return apiClient.get("/stops");
  },

  getById: async (id) => {
    return apiClient.get(`/stops/${id}`);
  },

  create: async (stopData) => {
    return apiClient.post("/stops", stopData);
  },

  update: async (id, updatedData) => {
    return apiClient.put(`/stops/${id}`, updatedData);
  },

  delete: async (id) => {
    return apiClient.delete(`/stops/${id}`);
  },

  importBatch: async (stopsList) => {
    return apiClient.post("/stops/batch", { stops: stopsList });
  },
};
