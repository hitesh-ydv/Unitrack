import React, { useState } from "react";
import {
  Settings,
  Map,
  Radio,
  Sliders,
  Shield,
  Save,
  RotateCcw,
  Building,
  Check,
  CheckCircle2,
} from "lucide-react";
import { useSettings } from "../context/SettingsContext";
import { useToast } from "../context/ToastContext";

export const SettingsPage = () => {
  const { settings, updateSettings, tileProviders } = useSettings();
  const [formData, setFormData] = useState({ ...settings });
  const [isSaving, setIsSaving] = useState(false);

  const toast = useToast();

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateSettings(formData);
      toast.success("Settings Saved", "System preferences and map layers updated.");
    } catch {
      toast.error("Error", "Could not save preferences.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setFormData({ ...settings });
    toast.info("Reset", "Form reverted to saved system state.");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">System Configuration & Map Telematics</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure Leaflet map tile providers, telemetry ping frequencies, safety threshold limits, and institution branding.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold cursor-pointer"
          >
            Revert
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/25 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? "Saving..." : "Save Preferences"}</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Map Tile Provider Selection */}
        <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
              <Map className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Configurable Leaflet Map Tile Provider</h3>
              <p className="text-xs text-slate-400">
                Choose a high-performance open-source raster tile source with proper legal attribution.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {tileProviders.map((provider) => {
              const isSelected = formData.selectedTileProviderId === provider.id;
              return (
                <div
                  key={provider.id}
                  onClick={() => setFormData({ ...formData, selectedTileProviderId: provider.id })}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-indigo-950/40 border-indigo-500 shadow-xl ring-2 ring-indigo-500/30"
                      : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-xs text-white">{provider.name}</span>
                    {isSelected && <Check className="w-4 h-4 text-indigo-400" />}
                  </div>
                  <p className="text-[10px] text-slate-500 font-mono truncate">{provider.url}</p>
                  <p className="text-[10px] text-slate-400 mt-2 italic truncate">
                    Attribution: {provider.attribution.replace(/<[^>]+>/g, "")}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 2: Telematics & Safety Thresholds */}
        <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Telemetry & Safety Threshold Constraints</h3>
              <p className="text-xs text-slate-400">
                Set thresholds for triggering automatic alerts, speed enforcement, and stale pings.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                GPS Heartbeat Ping Interval
              </label>
              <select
                value={formData.gpsPingIntervalSec}
                onChange={(e) =>
                  setFormData({ ...formData, gpsPingIntervalSec: Number(e.target.value) })
                }
                className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              >
                <option value={3}>3 Seconds (Ultra Real-time)</option>
                <option value={5}>5 Seconds (Recommended Standard)</option>
                <option value={10}>10 Seconds (Bandwidth Efficient)</option>
                <option value={30}>30 Seconds (Low Power Mode)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Critical Delay Threshold (Minutes)
              </label>
              <input
                type="number"
                min="3"
                max="60"
                value={formData.delayThresholdMin}
                onChange={(e) =>
                  setFormData({ ...formData, delayThresholdMin: Number(e.target.value) })
                }
                className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                Trips delayed beyond this will trigger control room alerts.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Speed Violation Threshold (km/h)
              </label>
              <input
                type="number"
                min="30"
                max="90"
                value={formData.overspeedLimitKmh}
                onChange={(e) =>
                  setFormData({ ...formData, overspeedLimitKmh: Number(e.target.value) })
                }
                className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                Exceeding this speed flags driver with an overspeed violation.
              </span>
            </div>
          </div>
        </div>

        {/* Section 3: Campus Identity & Public Hotlines */}
        <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">University Identity & Transit Hotline</h3>
              <p className="text-xs text-slate-400">
                Official institution credentials shown on student boarding passes and parent SMS feeds.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                University Name
              </label>
              <input
                type="text"
                value={formData.universityName}
                onChange={(e) => setFormData({ ...formData, universityName: e.target.value })}
                className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Campus / Branch Location
              </label>
              <input
                type="text"
                value={formData.campusBranch}
                onChange={(e) => setFormData({ ...formData, campusBranch: e.target.value })}
                className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Emergency Dispatch Hotline
              </label>
              <input
                type="text"
                value={formData.emergencyHotline}
                onChange={(e) => setFormData({ ...formData, emergencyHotline: e.target.value })}
                className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Transit Support Email
              </label>
              <input
                type="email"
                value={formData.transportEmail}
                onChange={(e) => setFormData({ ...formData, transportEmail: e.target.value })}
                className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
