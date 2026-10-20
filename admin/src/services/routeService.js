import apiClient from "./api";

export const UNIVERSITY_LOCATION = {
  lat: 12.9716,
  lng: 77.5946,
  name: "Apex University Central Terminal",
  code: "S-001",
};

export const routeService = {
  getAll: async () => {
    return apiClient.get("/routes");
  },

  getById: async (id) => {
    return apiClient.get(`/routes/${id}`);
  },

  create: async (routeData) => {
    return apiClient.post("/routes", routeData);
  },

  update: async (id, updatedData) => {
    return apiClient.put(`/routes/${id}`, updatedData);
  },

  delete: async (id) => {
    return apiClient.delete(`/routes/${id}`);
  },

  // Snap waypoints to actual roads and streets via backend routing service
  snapRoad: async (waypoints, enforceUniversity = true, outAndBack = false) => {
    return apiClient.post("/routes/snap-road", { waypoints, enforceUniversity, outAndBack });
  },

  // Reverse geocode latitude and longitude to street name
  reverseGeocode: async (lat, lng) => {
    return apiClient.get(`/routes/reverse-geocode?lat=${lat}&lng=${lng}`);
  },

  // Assign or create route for a specific bus
  assignRouteToBus: async (busId, routeData) => {
    return apiClient.post("/routes/assign-to-bus", { busId, routeData });
  },

  // Get student route bundle with live bus tracking, ordered stops, and ETAs
  getStudentView: async (busId) => {
    return apiClient.get(`/routes/bus/${busId}/student-view`);
  },
};
