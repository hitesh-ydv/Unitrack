import apiClient from "./api";

export const studentService = {
  getAll: async () => {
    return apiClient.get("/students");
  },

  getById: async (id) => {
    return apiClient.get(`/students/${id}`);
  },

  create: async (studentData) => {
    return apiClient.post("/students", studentData);
  },

  update: async (id, updatedData) => {
    return apiClient.put(`/students/${id}`, updatedData);
  },

  delete: async (id) => {
    return apiClient.delete(`/students/${id}`);
  },

  importBatch: async (importedList) => {
    return apiClient.post("/students/batch", importedList);
  },
};
