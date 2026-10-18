import apiClient, { USE_MOCK } from "./api";
import { MOCK_MAP_TILE_PROVIDERS } from "../data/mockData";

const DEFAULT_SETTINGS = {
  universityName: "Apex University of Science & Technology",
  campusBranch: "Main Technology Campus (East Hub)",
  emergencyHotline: "+91 (080) 2841-9999",
  transportEmail: "transport-desk@apex.edu",
  selectedTileProviderId: "osm",
  gpsPingIntervalSec: 5,
  delayThresholdMin: 10,
  overspeedLimitKmh: 50,
  geofenceBufferMeters: 50,
  enableAutoAlerts: true,
  enableSmsNotifications: true,
  enableParentPortalSync: true,
};

let settingsCache = { ...DEFAULT_SETTINGS };

export const settingsService = {
  getSettings: async () => {
    if (USE_MOCK) {
      return new Promise((resolve) => setTimeout(() => resolve({ ...settingsCache }), 100));
    }
    return apiClient.get("/settings");
  },

  updateSettings: async (newSettings) => {
    if (USE_MOCK) {
      settingsCache = { ...settingsCache, ...newSettings };
      return new Promise((resolve) => setTimeout(() => resolve({ ...settingsCache }), 150));
    }
    return apiClient.put("/settings", newSettings);
  },

  getTileProviders: () => {
    return MOCK_MAP_TILE_PROVIDERS;
  },
};
