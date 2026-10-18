import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { DashboardLayout } from "../layouts/DashboardLayout";
import { ProtectedRoute } from "./ProtectedRoute";

// All 18 Pages
import { OverviewDashboard } from "../pages/OverviewDashboard";
import { LiveFleetTracking } from "../pages/LiveFleetTracking";
import { BusManagement } from "../pages/BusManagement";
import { DriverManagement } from "../pages/DriverManagement";
import { StudentManagement } from "../pages/StudentManagement";
import { RouteBuilder } from "../pages/RouteBuilder";
import { StopsManagement } from "../pages/StopsManagement";
import { TripMonitoring } from "../pages/TripMonitoring";
import { AlertsDelayDetection } from "../pages/AlertsDelayDetection";
import { GeofenceManagement } from "../pages/GeofenceManagement";
import { NotificationCenter } from "../pages/NotificationCenter";
import { UserRoleManagement } from "../pages/UserRoleManagement";
import { SettingsPage } from "../pages/SettingsPage";
import { LoginPage } from "../pages/LoginPage";

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />

      {/* Authenticated Application Shell */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          {/* Default redirect to overview */}
          <Route index element={<Navigate to="/overview" replace />} />

          {/* 1. Overview Dashboard */}
          <Route path="overview" element={<OverviewDashboard />} />

          {/* 2. Live Fleet Tracking */}
          <Route path="live-tracking" element={<LiveFleetTracking />} />

          {/* 3. Bus Management */}
          <Route path="buses" element={<BusManagement />} />

          {/* 4. Driver Management */}
          <Route path="drivers" element={<DriverManagement />} />

          {/* 5. Student Management */}
          <Route path="students" element={<StudentManagement />} />

          {/* 6. Route Builder */}
          <Route path="routes" element={<RouteBuilder />} />

          {/* 7. Stops Management */}
          <Route path="stops" element={<StopsManagement />} />

          {/* 8. Trip Monitoring */}
          <Route path="trips" element={<TripMonitoring />} />

          {/* 9. Alerts & Delay Detection */}
          <Route path="alerts" element={<AlertsDelayDetection />} />

          {/* 10. Geofence Management */}
          <Route path="geofences" element={<GeofenceManagement />} />

          {/* 11. Notification Center */}
          <Route path="notifications" element={<NotificationCenter />} />

          {/* 12. User & Role Management */}
          <Route path="users" element={<UserRoleManagement />} />

          {/* 13. Settings */}
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Route>

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/overview" replace />} />
    </Routes>
  );
};
