import React, { createContext, useContext, useState, useEffect } from "react";
import { settingsService } from "../services/settingsService";
import { MOCK_MAP_TILE_PROVIDERS } from "../data/mockData";

const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({
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
  });

  const [tileProviders, setTileProviders] = useState(MOCK_MAP_TILE_PROVIDERS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    settingsService.getSettings().then((data) => {
      setSettings(data);
      setLoading(false);
    });
  }, []);

  const updateSettings = async (newConfig) => {
    const updated = await settingsService.updateSettings(newConfig);
    setSettings(updated);
    return updated;
  };

  const activeTileProvider =
    tileProviders.find((t) => t.id === settings.selectedTileProviderId) || tileProviders[0];

  return (
    <SettingsContext.Provider
      value={{
        settings,
        activeTileProvider,
        tileProviders,
        updateSettings,
        loading,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};
