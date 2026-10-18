import apiClient, { USE_MOCK } from "./api";
import { MOCK_STUDENTS } from "../data/mockData";

let studentsCache = [...MOCK_STUDENTS];

export const studentService = {
  getAll: async () => {
    if (USE_MOCK) {
      return new Promise((resolve) => setTimeout(() => resolve([...studentsCache]), 150));
    }
    return apiClient.get("/students");
  },

  getById: async (id) => {
    if (USE_MOCK) {
      const student = studentsCache.find((s) => s.id === id);
      return new Promise((resolve, reject) => {
        if (student) resolve({ ...student });
        else reject(new Error("Student not found"));
      });
    }
    return apiClient.get(`/students/${id}`);
  },

  create: async (studentData) => {
    if (USE_MOCK) {
      const newStudent = {
        ...studentData,
        id: `STU-2026-${String(studentsCache.length + 101).padStart(3, "0")}`,
        rfidCode: studentData.rfidCode || `RFID-${Math.floor(1000 + Math.random() * 9000)}-AB`,
        qrPassCode: `PASS-QR-${Math.floor(10000 + Math.random() * 90000)}`,
        boardingStatusToday: "Pending",
        status: "active",
      };
      studentsCache.unshift(newStudent);
      return new Promise((resolve) => setTimeout(() => resolve(newStudent), 200));
    }
    return apiClient.post("/students", studentData);
  },

  update: async (id, updatedData) => {
    if (USE_MOCK) {
      const index = studentsCache.findIndex((s) => s.id === id);
      if (index !== -1) {
        studentsCache[index] = { ...studentsCache[index], ...updatedData };
        return new Promise((resolve) => setTimeout(() => resolve(studentsCache[index]), 150));
      }
      return Promise.reject(new Error("Student not found"));
    }
    return apiClient.put(`/students/${id}`, updatedData);
  },

  delete: async (id) => {
    if (USE_MOCK) {
      studentsCache = studentsCache.filter((s) => s.id !== id);
      return new Promise((resolve) => setTimeout(() => resolve({ success: true, id }), 150));
    }
    return apiClient.delete(`/students/${id}`);
  },

  importBatch: async (importedList) => {
    if (USE_MOCK) {
      const formatted = importedList.map((item, idx) => ({
        id: item.id || `STU-2026-${String(studentsCache.length + idx + 101).padStart(3, "0")}`,
        name: item.name || "Unknown",
        rollNumber: item.rollNumber || `CS-2025-${idx + 100}`,
        department: item.department || "General Sciences",
        year: item.year || "1st Year",
        email: item.email || `${item.name?.toLowerCase().replace(/\s+/g, ".")}@uni.edu`,
        phone: item.phone || "+91 98000 00000",
        assignedBusNumber: item.assignedBusNumber || "Bus 101",
        assignedStopName: item.assignedStopName || "Central Metro Interchange",
        rfidCode: item.rfidCode || `RFID-${Math.floor(1000 + Math.random() * 9000)}`,
        qrPassCode: `PASS-QR-${Math.floor(10000 + Math.random() * 90000)}`,
        boardingStatusToday: "Pending",
        status: "active",
      }));
      studentsCache = [...formatted, ...studentsCache];
      return new Promise((resolve) => setTimeout(() => resolve(formatted), 300));
    }
    return apiClient.post("/students/batch", importedList);
  },
};
