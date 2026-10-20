import apiClient from "./api";

export const alertService = {
  getAll: async () => {
    return apiClient.get("/alerts");
  },

  acknowledge: async (id) => {
    return apiClient.post(`/alerts/${id}/acknowledge`);
  },

  resolve: async (id) => {
    return apiClient.post(`/alerts/${id}/resolve`);
  },

  create: async (alertData) => {
    return apiClient.post("/alerts", alertData);
  },
};
