import apiClient, { USE_MOCK } from "./api";
import { MOCK_NOTIFICATIONS } from "../data/mockData";

let notifCache = [...MOCK_NOTIFICATIONS];

export const notificationService = {
  getAll: async () => {
    if (USE_MOCK) {
      return new Promise((resolve) => setTimeout(() => resolve([...notifCache]), 100));
    }
    return apiClient.get("/notifications");
  },

  create: async (data) => {
    if (USE_MOCK) {
      const newNotif = {
        id: `NOTIF-${Date.now()}`,
        time: "Just now",
        unread: true,
        ...data,
      };
      notifCache.unshift(newNotif);
      return new Promise((resolve) => setTimeout(() => resolve(newNotif), 150));
    }
    return apiClient.post("/notifications", data);
  },

  toggleRead: async (id) => {
    if (USE_MOCK) {
      notifCache = notifCache.map((n) => (n.id === id ? { ...n, unread: !n.unread } : n));
      return new Promise((resolve) => setTimeout(() => resolve({ success: true, id }), 100));
    }
    return apiClient.patch(`/notifications/${id}/read`);
  },

  markAllRead: async () => {
    if (USE_MOCK) {
      notifCache = notifCache.map((n) => ({ ...n, unread: false }));
      return new Promise((resolve) => setTimeout(() => resolve({ success: true }), 100));
    }
    return apiClient.post("/notifications/mark-all-read");
  },
};
