import React, { createContext, useContext, useState, useEffect } from "react";
import apiClient, { USE_MOCK } from "../services/api";
import { MOCK_USERS, MOCK_ROLES_PERMISSIONS } from "../data/mockData";

const AuthContext = createContext();

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
    return MOCK_USERS[0];
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return Boolean(localStorage.getItem("unitrack_token")) || true;
  });

  // Verify / hydrate session on mount when not mocking
  useEffect(() => {
    const token = localStorage.getItem("unitrack_token");
    if (token && !USE_MOCK) {
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
  }, []);

  const currentRoleConfig = MOCK_ROLES_PERMISSIONS.find((r) => r.role === currentUser?.role) || {
    role: currentUser?.role || "Viewer",
    permissions: [],
  };

  const hasPermission = (permissionName) => {
    if (!currentUser) return false;
    if (currentUser.role === "Super Admin") return true;
    return currentRoleConfig.permissions.some((p) =>
      p.toLowerCase().includes(permissionName.toLowerCase())
    );
  };

  const switchRole = (newRoleName) => {
    const matchedUser = MOCK_USERS.find((u) => u.role === newRoleName) || {
      ...currentUser,
      role: newRoleName,
      name: `${newRoleName} User`,
    };
    setCurrentUser(matchedUser);
    localStorage.setItem("unitrack_user", JSON.stringify(matchedUser));
  };

  const login = async (email, role = "Super Admin", password = "password123") => {
    if (!USE_MOCK) {
      try {
        const res = await apiClient.post("/auth/login", { email, role, password });
        if (res.token && res.user) {
          localStorage.setItem("unitrack_token", res.token);
          localStorage.setItem("unitrack_user", JSON.stringify(res.user));
          setCurrentUser(res.user);
          setIsAuthenticated(true);
          return res.user;
        }
      } catch (err) {
        console.warn("Backend auth failed, falling back to client session:", err.message);
      }
    }

    // Fallback / mock login
    const user = MOCK_USERS.find((u) => u.email === email) || {
      id: "USR-CUSTOM",
      name: email.split("@")[0],
      email,
      role,
      status: "active",
      lastLogin: "Just now",
    };
    setCurrentUser(user);
    setIsAuthenticated(true);
    localStorage.setItem("unitrack_token", "demo-jwt-token-xyz");
    localStorage.setItem("unitrack_user", JSON.stringify(user));
    return user;
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
