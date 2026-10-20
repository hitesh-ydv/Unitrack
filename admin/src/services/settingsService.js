import apiClient from "./api";

export const MAP_TILE_PROVIDERS = [
  {
    id: "osm",
    name: "OpenStreetMap Standard (Default)",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  {
    id: "carto_light",
    name: "CartoDB Positron (Enterprise Clean)",
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap',
  },
  {
    id: "carto_dark",
    name: "CartoDB Dark Matter (High Contrast Dark)",
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap',
  },
];

export const settingsService = {
  getSettings: async () => {
    return apiClient.get("/settings");
  },

  updateSettings: async (newSettings) => {
    return apiClient.put("/settings", newSettings);
  },

  getTileProviders: () => {
    return MAP_TILE_PROVIDERS;
  },
};
