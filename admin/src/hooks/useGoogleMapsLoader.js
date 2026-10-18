import { useState, useEffect, useCallback } from "react";

let googleMapsPromise = null;

/**
 * Custom hook to dynamically load Google Maps JavaScript API with places & geometry libraries.
 * Safely accesses Vite env var VITE_GOOGLE_MAPS_API_KEY or localStorage fallback.
 */
export const useGoogleMapsLoader = () => {
  const envKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
  const storedKey = typeof window !== "undefined" ? localStorage.getItem("unitrack_google_maps_key") || "" : "";
  const [apiKey, setApiKey] = useState(storedKey || envKey);
  const [isLoaded, setIsLoaded] = useState(typeof window !== "undefined" && !!window.google?.maps);
  const [loadError, setLoadError] = useState(null);

  const loadScript = useCallback((keyToLoad) => {
    if (typeof window === "undefined") return;

    if (window.google?.maps) {
      setIsLoaded(true);
      setLoadError(null);
      return;
    }

    // Reuse in-flight promise if script is already loading
    if (googleMapsPromise) {
      googleMapsPromise
        .then(() => {
          setIsLoaded(true);
          setLoadError(null);
        })
        .catch((err) => {
          setLoadError(err.message || "Failed to load Google Maps");
        });
      return;
    }

    googleMapsPromise = new Promise((resolve, reject) => {
      // Remove any existing failed script
      const oldScript = document.getElementById("google-maps-api-script");
      if (oldScript) {
        oldScript.remove();
      }

      const script = document.createElement("script");
      script.id = "google-maps-api-script";
      script.type = "text/javascript";
      script.async = true;
      script.defer = true;

      const keyQuery = keyToLoad ? `key=${keyToLoad}&` : "";
      script.src = `https://maps.googleapis.com/maps/api/js?${keyQuery}libraries=places,geometry&v=weekly`;

      script.onload = () => {
        if (window.google?.maps) {
          resolve(window.google.maps);
        } else {
          reject(new Error("Google Maps loaded but window.google.maps is undefined"));
        }
      };

      script.onerror = (e) => {
        googleMapsPromise = null;
        reject(new Error("Failed to load Google Maps JavaScript API. Please check your network or API key."));
      };

      document.head.appendChild(script);
    });

    googleMapsPromise
      .then(() => {
        setIsLoaded(true);
        setLoadError(null);
      })
      .catch((err) => {
        setIsLoaded(false);
        setLoadError(err.message);
      });
  }, []);

  useEffect(() => {
    loadScript(apiKey);
  }, [apiKey, loadScript]);

  const updateApiKey = (newKey) => {
    const trimmed = (newKey || "").trim();
    if (typeof window !== "undefined") {
      localStorage.setItem("unitrack_google_maps_key", trimmed);
    }
    setApiKey(trimmed);
    googleMapsPromise = null;
    loadScript(trimmed);
  };

  return {
    isLoaded,
    loadError,
    apiKey,
    updateApiKey,
  };
};
