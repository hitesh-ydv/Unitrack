import apiClient from "./api";

export const driverService = {
  getAll: async () => {
    return apiClient.get("/drivers");
  },

  getById: async (id) => {
    return apiClient.get(`/drivers/${id}`);
  },

  create: async (driverData) => {
    return apiClient.post("/drivers", driverData);
  },

  update: async (id, updatedData) => {
    return apiClient.put(`/drivers/${id}`, updatedData);
  },

  delete: async (id) => {
    return apiClient.delete(`/drivers/${id}`);
  },
};
