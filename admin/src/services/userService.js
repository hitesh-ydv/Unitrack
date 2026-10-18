import apiClient, { USE_MOCK } from "./api";
import { MOCK_USERS, MOCK_ROLES_PERMISSIONS } from "../data/mockData";

let usersCache = [...MOCK_USERS];

export const userService = {
  getAll: async () => {
    if (USE_MOCK) {
      return new Promise((resolve) => setTimeout(() => resolve([...usersCache]), 150));
    }
    return apiClient.get("/users");
  },

  getRolesAndPermissions: async () => {
    if (USE_MOCK) {
      return new Promise((resolve) => setTimeout(() => resolve([...MOCK_ROLES_PERMISSIONS]), 100));
    }
    return apiClient.get("/users/roles");
  },

  create: async (userData) => {
    if (USE_MOCK) {
      const newUser = {
        ...userData,
        id: `USR-${String(usersCache.length + 1).padStart(3, "0")}`,
        status: "active",
        lastLogin: "Never",
      };
      usersCache.unshift(newUser);
      return new Promise((resolve) => setTimeout(() => resolve(newUser), 200));
    }
    return apiClient.post("/users", userData);
  },

  update: async (id, userData) => {
    if (USE_MOCK) {
      const idx = usersCache.findIndex((u) => u.id === id);
      if (idx !== -1) {
        usersCache[idx] = { ...usersCache[idx], ...userData };
        return new Promise((resolve) => setTimeout(() => resolve(usersCache[idx]), 150));
      }
      return Promise.reject(new Error("User not found"));
    }
    return apiClient.put(`/users/${id}`, userData);
  },

  delete: async (id) => {
    if (USE_MOCK) {
      usersCache = usersCache.filter((u) => u.id !== id);
      return new Promise((resolve) => setTimeout(() => resolve({ success: true, id }), 150));
    }
    return apiClient.delete(`/users/${id}`);
  },
};
