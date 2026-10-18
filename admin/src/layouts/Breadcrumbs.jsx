import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";

export const Breadcrumbs = () => {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter((x) => x);

  const routeNameMap = {
    overview: "Overview",
    "live-tracking": "Live Fleet Tracking",
    buses: "Bus Management",
    drivers: "Driver Management",
    students: "Student Management",
    routes: "Route Builder",
    stops: "Stops Management",
    trips: "Trip Monitoring",
    alerts: "Alerts & Delay Detection",
    geofences: "Geofence Management",
    notifications: "Notification Center",
    users: "User & Role Management",
    settings: "Settings",
  };

  return (
    <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-6 py-1">
      <Link
        to="/"
        className="flex items-center gap-1 hover:text-white transition-colors"
      >
        <Home className="w-3.5 h-3.5" />
        <span>Dashboard</span>
      </Link>

      {pathnames.map((segment, index) => {
        const url = `/${pathnames.slice(0, index + 1).join("/")}`;
        const isLast = index === pathnames.length - 1;
        const displayName = routeNameMap[segment] || segment.replace(/-/g, " ");

        return (
          <React.Fragment key={url}>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
            {isLast ? (
              <span className="font-semibold text-slate-200 capitalize">
                {displayName}
              </span>
            ) : (
              <Link
                to={url}
                className="hover:text-white transition-colors capitalize"
              >
                {displayName}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
