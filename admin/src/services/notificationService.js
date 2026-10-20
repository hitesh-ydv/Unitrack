import apiClient from "./api";

export const notificationService = {
  getAll: async () => {
    return apiClient.get("/notifications");
  },

  create: async (data) => {
    return apiClient.post("/notifications", data);
  },

  toggleRead: async (id) => {
    return apiClient.patch(`/notifications/${id}/read`);
  },

  markAllRead: async () => {
    return apiClient.post("/notifications/mark-all-read");
  },
};
