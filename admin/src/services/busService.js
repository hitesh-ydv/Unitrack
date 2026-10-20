import apiClient from "./api";

export const busService = {
  getAll: async () => {
    return apiClient.get("/buses");
  },

  getById: async (id) => {
    return apiClient.get(`/buses/${id}`);
  },

  create: async (busData) => {
    return apiClient.post("/buses", busData);
  },

  update: async (id, updatedData) => {
    return apiClient.put(`/buses/${id}`, updatedData);
  },

  delete: async (id) => {
    return apiClient.delete(`/buses/${id}`);
  },

  // Update a single bus realtime GPS location (matching Postman endpoint)
  updateLocation: async (id, locationData) => {
    return apiClient.post(`/buses/${id}/location`, locationData);
  },

  // Batch update bus locations
  updateLocationBatch: async (newLocations) => {
    if (!Array.isArray(newLocations) || newLocations.length === 0) return [];
    return apiClient.post(
      "/buses/batch-location",
      newLocations.map((b) => ({
        id: b.id,
        currentLat: b.currentLat,
        currentLng: b.currentLng,
        speedKmh: b.speedKmh,
        headingDeg: b.headingDeg,
      }))
    );
  },

  advanceFleet: async () => {
    return apiClient.post("/buses/advance-fleet");
  },

  getRouteDetails: async (busId) => {
    return apiClient.get(`/buses/${busId}/route-details`);
  },
};
