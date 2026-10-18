import apiClient, { USE_MOCK } from "./api";
import { MOCK_ROUTES } from "../data/mockData";

let routesCache = [...MOCK_ROUTES];

export const UNIVERSITY_LOCATION = {
  lat: 12.9716,
  lng: 77.5946,
  name: "Apex University Central Terminal",
  code: "S-001",
};

export const routeService = {
  getAll: async () => {
    if (USE_MOCK) {
      return new Promise((resolve) => setTimeout(() => resolve([...routesCache]), 150));
    }
    return apiClient.get("/routes");
  },

  getById: async (id) => {
    if (USE_MOCK) {
      const route = routesCache.find((r) => r.id === id);
      return new Promise((resolve, reject) => {
        if (route) resolve({ ...route });
        else reject(new Error("Route not found"));
      });
    }
    return apiClient.get(`/routes/${id}`);
  },

  create: async (routeData) => {
    if (USE_MOCK) {
      const newRoute = {
        ...routeData,
        id: `RT-${String(routesCache.length + 1).padStart(2, "0")}`,
        status: routeData.status || "active",
        studentAssignedCount: 0,
      };
      routesCache.unshift(newRoute);
      return new Promise((resolve) => setTimeout(() => resolve(newRoute), 200));
    }
    return apiClient.post("/routes", routeData);
  },

  update: async (id, updatedData) => {
    if (USE_MOCK) {
      const index = routesCache.findIndex((r) => r.id === id);
      if (index !== -1) {
        routesCache[index] = { ...routesCache[index], ...updatedData };
        return new Promise((resolve) => setTimeout(() => resolve(routesCache[index]), 150));
      }
      return Promise.reject(new Error("Route not found"));
    }
    return apiClient.put(`/routes/${id}`, updatedData);
  },

  delete: async (id) => {
    if (USE_MOCK) {
      routesCache = routesCache.filter((r) => r.id !== id);
      return new Promise((resolve) => setTimeout(() => resolve({ success: true, id }), 150));
    }
    return apiClient.delete(`/routes/${id}`);
  },

  // Snap waypoints to actual roads and streets
  snapRoad: async (waypoints, enforceUniversity = true, outAndBack = false) => {
    if (USE_MOCK) {
      // Direct call to OSRM in browser if in mock mode
      try {
        let pts = waypoints.map((p) => (Array.isArray(p) ? { lat: p[0], lng: p[1] } : p));
        if (enforceUniversity && !outAndBack) {
          pts = [
            { lat: UNIVERSITY_LOCATION.lat, lng: UNIVERSITY_LOCATION.lng },
            ...pts,
            { lat: UNIVERSITY_LOCATION.lat, lng: UNIVERSITY_LOCATION.lng },
          ];
        } else if (enforceUniversity) {
          pts = [
            { lat: UNIVERSITY_LOCATION.lat, lng: UNIVERSITY_LOCATION.lng },
            ...pts,
          ];
        }
        const coords = pts.map((p) => `${p.lng},${p.lat}`).join(";");
        const res = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`
        );
        const data = await res.json();
        if (data.code === "Ok" && data.routes?.[0]) {
          const outboundWaypoints = data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
          const oneWayDistance = Number((data.routes[0].distance / 1000).toFixed(1));
          const oneWayDuration = Math.max(1, Math.round(data.routes[0].duration / 60));

          const streets = [];
          if (data.routes[0].legs) {
            for (const leg of data.routes[0].legs) {
              if (leg.steps) {
                for (const step of leg.steps) {
                  if (step.name && step.name.trim().length > 0 && !streets.includes(step.name.trim())) {
                    streets.push(step.name.trim());
                  }
                }
              }
            }
          }

          if (outAndBack) {
            const returnWaypoints = [...outboundWaypoints].reverse().slice(1);
            return {
              waypoints: [...outboundWaypoints, ...returnWaypoints],
              outboundWaypoints,
              returnWaypoints: [...outboundWaypoints].reverse(),
              distanceKm: Number((oneWayDistance * 2).toFixed(1)),
              estimatedDurationMin: oneWayDuration * 2,
              oneWayDistanceKm: oneWayDistance,
              oneWayDurationMin: oneWayDuration,
              streetsTraversed: streets.length > 0 ? streets : ["University Campus Road", "Connecting Arterial Corridor"],
              isOutAndBack: true,
            };
          }

          return {
            waypoints: outboundWaypoints,
            distanceKm: oneWayDistance,
            estimatedDurationMin: oneWayDuration,
            streetsTraversed: streets.length > 0 ? streets : ["University Campus Road", "Connecting Arterial Corridor"],
            isOutAndBack: false,
          };
        }
      } catch (err) {
        console.warn("OSRM direct query fallback:", err);
      }
      return {
        waypoints,
        distanceKm: 15.0,
        estimatedDurationMin: 35,
        streetsTraversed: ["University Campus Road", "Metro Expressway"],
      };
    }
    return apiClient.post("/routes/snap-road", { waypoints, enforceUniversity, outAndBack });
  },

  // Reverse geocode latitude and longitude to street name
  reverseGeocode: async (lat, lng) => {
    if (USE_MOCK) {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
        );
        const data = await res.json();
        const road = data.address?.road || data.name || "City Road";
        return {
          roadName: road,
          suggestedStopName: road,
          displayName: data.display_name,
        };
      } catch {
        return { roadName: "Pinned Transit Stop", suggestedStopName: "Transit Stop" };
      }
    }
    return apiClient.get(`/routes/reverse-geocode?lat=${lat}&lng=${lng}`);
  },

  // Assign or create route for a specific bus
  assignRouteToBus: async (busId, routeData) => {
    if (USE_MOCK) {
      return { message: "Route assigned successfully" };
    }
    return apiClient.post("/routes/assign-to-bus", { busId, routeData });
  },

  // Get student route bundle with live bus tracking, ordered stops, and ETAs
  getStudentView: async (busId) => {
    if (USE_MOCK) {
      const { MOCK_BUSES, MOCK_ROUTES, MOCK_STOPS } = await import("../data/mockData");
      const bus = MOCK_BUSES.find((b) => b.id === busId) || MOCK_BUSES[0];
      const route = MOCK_ROUTES.find((r) => r.id === bus?.routeId) || MOCK_ROUTES[0];
      const stopMap = new Map(MOCK_STOPS.map((s) => [s.id, s]));
      const orderedStops = (route?.stops || []).map((sid, idx) => {
        if (sid === "STP-04") {
          return {
            id: "STP-04",
            name: UNIVERSITY_LOCATION.name,
            code: UNIVERSITY_LOCATION.code,
            lat: UNIVERSITY_LOCATION.lat,
            lng: UNIVERSITY_LOCATION.lng,
            morningTime: "07:00 AM",
            eveningTime: "06:00 PM",
            status: idx === 0 ? "passed" : "upcoming",
            statusLabel: idx === 0 ? "Departed" : "Final Destination",
            etaLabel: idx === 0 ? "Departed" : "42 mins",
            distanceMeters: idx === 0 ? 0 : 12400,
            sequenceIndex: idx,
            isUniversity: true,
          };
        }
        const s = stopMap.get(sid) || { id: sid, name: `Stop ${sid}`, lat: UNIVERSITY_LOCATION.lat, lng: UNIVERSITY_LOCATION.lng };
        const isPast = idx < 2;
        const isNext = idx === 2;
        return {
          ...s,
          sequenceIndex: idx,
          isUniversity: false,
          status: isPast ? "passed" : isNext ? "next" : "upcoming",
          statusLabel: isPast ? "Departed" : isNext ? "Next Stop" : "Upcoming",
          etaLabel: isPast ? "Departed" : isNext ? "4 mins" : `${(idx - 1) * 7 + 4} mins`,
          distanceMeters: isPast ? 0 : isNext ? 850 : (idx - 1) * 2200,
        };
      });

      return {
        bus,
        route,
        nextStop: orderedStops.find((s) => s.status === "next") || orderedStops[0],
        orderedStops,
        streetsTraversed: [
          "Campus Boulevard",
          "Outer Ring Road",
          "Tech Corridor Avenue",
          "Residency Road",
          "Indiranagar 100ft Road",
          "Central Metro Highway",
        ],
      };
    }
    return apiClient.get(`/routes/bus/${busId}/student-view`);
  },
};
