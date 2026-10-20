import apiClient from "./api";

export const userService = {
  getAll: async () => {
    return apiClient.get("/users");
  },

  getRolesAndPermissions: async () => {
    return apiClient.get("/users/roles");
  },

  create: async (userData) => {
    return apiClient.post("/users", userData);
  },

  update: async (id, userData) => {
    return apiClient.put(`/users/${id}`, userData);
  },

  delete: async (id) => {
    return apiClient.delete(`/users/${id}`);
  },
};
