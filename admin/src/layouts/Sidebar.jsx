import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Radio,
  Bus,
  Users2,
  GraduationCap,
  Route,
  MapPin,
  Clock,
  AlertTriangle,
  Compass,
  Flame,
  Bell,
  ShieldCheck,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export const Sidebar = ({ isCollapsed, onToggleCollapse, isMobileOpen, onCloseMobile }) => {
  const { currentUser } = useAuth();

  const navSections = [
    {
      title: "OPERATIONS",
      items: [
        {
          name: "Overview",
          path: "/overview",
          icon: LayoutDashboard,
        },
        {
          name: "Live Fleet Tracking",
          path: "/live-tracking",
          icon: Radio,
          badge: "Live",
          badgeColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
        },
        {
          name: "Trip Monitoring",
          path: "/trips",
          icon: Clock,
          badge: "4 Active",
          badgeColor: "bg-blue-500/20 text-blue-400 border-blue-500/30",
        },
        {
          name: "Alerts & Delays",
          path: "/alerts",
          icon: AlertTriangle,
          badge: "2 Alert",
          badgeColor: "bg-amber-500/20 text-amber-400 border-amber-500/30",
        },
      ],
    },
    {
      title: "FLEET & NETWORK",
      items: [
        { name: "Bus Management", path: "/buses", icon: Bus },
        { name: "Driver Management", path: "/drivers", icon: Users2 },
        { name: "Student Management", path: "/students", icon: GraduationCap },
        { name: "Route Builder", path: "/routes", icon: Route },
        { name: "Stops Management", path: "/stops", icon: MapPin },
        { name: "Geofences", path: "/geofences", icon: Compass },
      ],
    },
    {
      title: "ADMINISTRATION",
      items: [
        { name: "Notifications", path: "/notifications", icon: Bell },
        { name: "Users & Roles", path: "/users", icon: ShieldCheck },
        { name: "Settings", path: "/settings", icon: Settings },
      ],
    },
  ];

  const sidebarWidth = isCollapsed ? "w-20" : "w-64";

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 md:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Main Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 bg-slate-950 border-r border-slate-800/80 transition-all duration-300 flex flex-col ${sidebarWidth} ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800/80 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 shrink-0">
              <Bus className="w-5 h-5 text-white" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <span className="font-extrabold text-base tracking-tight text-white flex items-center gap-1">
                  Uni<span className="text-indigo-400">Track</span>
                </span>
                <p className="text-[10px] text-slate-400 tracking-wider uppercase font-semibold">
                  Transit Command
                </p>
              </div>
            )}
          </div>

          <button
            onClick={onToggleCollapse}
            className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {navSections.map((section) => (
            <div key={section.title} className="space-y-1">
              {!isCollapsed && (
                <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                  {section.title}
                </p>
              )}

              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onCloseMobile}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all group relative ${
                        isActive
                          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 font-semibold"
                          : "text-slate-400 hover:text-slate-100 hover:bg-slate-900"
                      } ${isCollapsed ? "justify-center" : ""}`
                    }
                    title={isCollapsed ? item.name : undefined}
                  >
                    <Icon className="w-4 h-4 shrink-0" />

                    {!isCollapsed && (
                      <div className="flex items-center justify-between flex-1 min-w-0">
                        <span className="truncate">{item.name}</span>
                        {item.badge && (
                          <span
                            className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold border ${item.badgeColor}`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Tooltip for collapsed view */}
                    {isCollapsed && (
                      <div className="absolute left-full ml-3 px-2.5 py-1 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-xl border border-slate-700 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                        {item.name}
                      </div>
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer info pill */}
        {!isCollapsed && (
          <div className="p-3 m-3 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400 shrink-0">
            <div className="flex items-center justify-between text-white font-semibold mb-1">
              <span>Campus Fleet</span>
              <span className="text-emerald-400 text-[10px]">● 6 Buses</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">
              Role: <span className="text-indigo-300 font-medium">{currentUser.role}</span>
            </p>
          </div>
        )}
      </aside>
    </>
  );
};
