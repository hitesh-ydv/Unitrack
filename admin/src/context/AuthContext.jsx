import React, { createContext, useContext, useState, useEffect } from "react";
import apiClient from "../services/api";

const AuthContext = createContext();

const DEFAULT_SYSTEM_ROLES = [
  {
    role: "Super Admin",
    description: "Complete unconstrained access across all transit settings, users, hardware, and logs.",
    permissions: [
      "Manage All Buses & Drivers",
      "Edit Geofences & Routes",
      "Trigger Emergency Broadcasts",
      "User & Role Administration",
      "System Configuration",
      "Purge & Export Audit Logs",
    ],
  },
  {
    role: "Fleet Manager",
    description: "Oversees vehicle health, maintenance schedules, fuel records, and hardware telematics.",
    permissions: [
      "Manage All Buses & Drivers",
      "Log Maintenance & Servicing",
      "View Fleet Tracking & Diagnostics",
      "View Reports & Analytics",
    ],
  },
  {
    role: "Dispatcher",
    description: "Monitors active morning & evening trips, handles delays, assigns relief buses, and triggers SOS.",
    permissions: [
      "Live Trip Monitoring & Rescheduling",
      "Trigger Route Alerts & SOS Actions",
      "Manage Real-time Bus Assignments",
      "Send Push Notifications",
    ],
  },
  {
    role: "Conductor",
    description: "Assigned onboard tablet access for QR/RFID student attendance and stop verifications.",
    permissions: [
      "QR / RFID Student Scan Console",
      "Mark Passenger Attendance",
      "Report Onboard Incident",
    ],
  },
  {
    role: "Viewer",
    description: "Read-only situational awareness for security guards, faculty coordinators, and dean's office.",
    permissions: [
      "View Live Map & Fleet Locations",
      "View Trip Schedules & Delays",
      "View Public Student Rosters",
    ],
  },
];

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = localStorage.getItem("unitrack_user");
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch (e) {
        // ignore parse error
      }
    }
    return {
      id: "USR-001",
      name: "System Administrator",
      email: "admin@apex.edu",
      role: "Super Admin",
      department: "Transit Administration",
      status: "active",
      lastLogin: "Just now",
    };
  });

  const [rolesConfig, setRolesConfig] = useState(DEFAULT_SYSTEM_ROLES);
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return Boolean(localStorage.getItem("unitrack_token") || localStorage.getItem("unitrack_user"));
  });

  // Hydrate session & permissions on mount from backend
  useEffect(() => {
    const token = localStorage.getItem("unitrack_token");
    if (token) {
      apiClient
        .get("/auth/me")
        .then((userData) => {
          if (userData && userData.id) {
            setCurrentUser(userData);
            localStorage.setItem("unitrack_user", JSON.stringify(userData));
            setIsAuthenticated(true);
          }
        })
        .catch(() => {
          // Token invalid or expired
          logout();
        });
    }

    // Load dynamic roles & permissions from backend
    apiClient
      .get("/users/roles")
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setRolesConfig(data);
        }
      })
      .catch(() => {});
  }, []);

  const currentRoleConfig =
    rolesConfig.find((r) => r.role === currentUser?.role) || {
      role: currentUser?.role || "Viewer",
      permissions: [],
    };

  const hasPermission = (permissionName) => {
    if (!currentUser) return false;
    if (currentUser.role === "Super Admin") return true;
    const permissions = Array.isArray(currentRoleConfig.permissions)
      ? currentRoleConfig.permissions
      : [];
    return permissions.some((p) =>
      p.toLowerCase().includes(permissionName.toLowerCase())
    );
  };

  const switchRole = (newRoleName) => {
    const updated = {
      ...currentUser,
      role: newRoleName,
    };
    setCurrentUser(updated);
    localStorage.setItem("unitrack_user", JSON.stringify(updated));
  };

  const login = async (email, role = "Super Admin", password = "password123") => {
    const res = await apiClient.post("/auth/login", { email, role, password });
    if (res.token && res.user) {
      localStorage.setItem("unitrack_token", res.token);
      localStorage.setItem("unitrack_user", JSON.stringify(res.user));
      setCurrentUser(res.user);
      setIsAuthenticated(true);
      return res.user;
    }
    throw new Error(res.message || "Failed to log in.");
  };

  const logout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    localStorage.removeItem("unitrack_token");
    localStorage.removeItem("unitrack_user");
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        currentRoleConfig,
        hasPermission,
        switchRole,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
