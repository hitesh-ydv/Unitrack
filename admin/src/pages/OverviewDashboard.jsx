import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bus,
  Clock,
  AlertTriangle,
  GraduationCap,
  Users2,
  Radio,
  RotateCw,
  ChevronRight,
  ArrowUpRight,
} from "lucide-react";
import { StatusBadge } from "../components/common/StatusBadge";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { busService } from "../services/busService";
import { tripService } from "../services/tripService";
import { alertService } from "../services/alertService";
import { studentService } from "../services/studentService";
import { driverService } from "../services/driverService";

export const OverviewDashboard = () => {
  const navigate = useNavigate();
  const [buses, setBuses] = useState([]);
  const [trips, setTrips] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [students, setStudents] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setIsRefreshing(true);
    try {
      const [busData, tripData, alertData, studentData, driverData] =
        await Promise.all([
          busService.getAll(),
          tripService.getAll(),
          alertService.getAll(),
          studentService.getAll(),
          driverService.getAll(),
        ]);
      setBuses(busData || []);
      setTrips(tripData || []);
      setAlerts(alertData || []);
      setStudents(studentData || []);
      setDrivers(driverData || []);
    } catch (err) {
      console.error("Failed to load overview data:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (isLoading) {
    return <LoadingSpinner message="Loading fleet overview..." />;
  }

  // Core metrics
  const totalBuses = buses.length;
  const activeBusesCount = buses.filter((b) => b.status === "active").length;
  const activeTripsList = trips.filter(
    (t) => t.status === "in_progress" || t.status === "delayed"
  );
  const activeTripsCount = activeTripsList.length;
  const delayedBusesList = buses.filter((b) => (b.delayMinutes || 0) > 5);
  const delayedBusesCount = delayedBusesList.length;
  const totalStudents = students.length;
  const boardedStudentsCount = students.filter(
    (s) => s.boardingStatusToday === "Boarded"
  ).length;
  const driversOnDuty = drivers.filter((d) => d.status === "on_duty").length;
  const totalDrivers = drivers.length;

  // 5 Main Feature Stat Cards configuration
  const statCards = [
    {
      title: "Total Buses",
      value: totalBuses,
      subtext: `${activeBusesCount} active in service`,
      icon: Bus,
      iconColor: "text-blue-400",
      iconBg: "bg-blue-500/10",
      path: "/buses",
    },
    {
      title: "Active Trips",
      value: activeTripsCount,
      subtext: "Morning schedule running",
      icon: Clock,
      iconColor: "text-emerald-400",
      iconBg: "bg-emerald-500/10",
      path: "/trips",
    },
    {
      title: "Delayed Buses",
      value: delayedBusesCount,
      subtext:
        delayedBusesCount > 0
          ? `${delayedBusesCount} running >5m late`
          : "All buses on schedule",
      icon: AlertTriangle,
      iconColor: delayedBusesCount > 0 ? "text-amber-400" : "text-emerald-400",
      iconBg: delayedBusesCount > 0 ? "bg-amber-500/10" : "bg-emerald-500/10",
      path: "/alerts",
    },
    {
      title: "Enrolled Students",
      value: totalStudents,
      subtext: `${boardedStudentsCount} boarded today`,
      icon: GraduationCap,
      iconColor: "text-cyan-400",
      iconBg: "bg-cyan-500/10",
      path: "/students",
    },
    {
      title: "Drivers on Duty",
      value: `${driversOnDuty} / ${totalDrivers}`,
      subtext: `${totalDrivers - driversOnDuty} off duty or on leave`,
      icon: Users2,
      iconColor: "text-purple-400",
      iconBg: "bg-purple-500/10",
      path: "/drivers",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-medium text-emerald-400">Live Operations</span>
            <span className="text-xs text-slate-600">&bull;</span>
            <span className="text-xs text-slate-400">Bangalore Campus</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Fleet Overview
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time status of university buses, active trips, and student transit.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => fetchData(true)}
            disabled={isRefreshing}
            title="Refresh telemetry"
            className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
          >
            <RotateCw
              className={`w-4 h-4 ${isRefreshing ? "animate-spin text-indigo-400" : ""}`}
            />
          </button>

          <Link
            to="/live-tracking"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-sm transition-all cursor-pointer"
          >
            <Radio className="w-3.5 h-3.5 text-emerald-300" />
            <span>Live Fleet Map</span>
          </Link>
        </div>
      </div>

      {/* 5 Main Feature Stat Cards (Clean & Spacious) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              onClick={() => navigate(card.path)}
              className="bg-slate-900/40 hover:bg-slate-900/70 border border-slate-800/60 hover:border-slate-700/80 rounded-2xl p-5 transition-all duration-200 cursor-pointer group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400 group-hover:text-slate-300 transition-colors">
                  {card.title}
                </span>
                <div
                  className={`w-8 h-8 rounded-xl ${card.iconBg} flex items-center justify-center shrink-0`}
                >
                  <Icon className={`w-4 h-4 ${card.iconColor}`} />
                </div>
              </div>

              <div className="mt-4">
                <div className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                  {card.value}
                </div>
                <p className="text-xs text-slate-400 mt-1 truncate">
                  {card.subtext}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Trips (Live Route Progress) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-white">Active Trips</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live transit progress, current stops, and student passenger load
            </p>
          </div>
          <Link
            to="/trips"
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium inline-flex items-center gap-1"
          >
            <span>View all trips</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeTripsList.length === 0 ? (
            <div className="col-span-full py-10 text-center text-slate-500 text-xs bg-slate-900/20 border border-slate-800/40 rounded-2xl">
              No active trips in transit at this time.
            </div>
          ) : (
            activeTripsList.map((trip) => {
              const isDelayed = trip.status === "delayed" || (trip.delayMinutes || 0) > 5;
              return (
                <div
                  key={trip.id}
                  className="bg-slate-900/40 border border-slate-800/60 hover:border-slate-700/80 rounded-2xl p-5 transition-all space-y-4 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">
                          {trip.busNumber}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">
                          &bull; {trip.driverName}
                        </span>
                      </div>
                      <StatusBadge status={trip.status} size="sm" />
                    </div>

                    <h3 className="text-xs font-semibold text-slate-200 line-clamp-1">
                      {trip.routeName}
                    </h3>
                  </div>

                  {/* Clean progress bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>
                        Stop {trip.currentStopIndex || 1} of {trip.totalStops || 4}
                      </span>
                      <span className="font-medium text-slate-300">
                        {trip.progressPercent || 50}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isDelayed ? "bg-amber-400" : "bg-emerald-500"
                        }`}
                        style={{ width: `${trip.progressPercent || 50}%` }}
                      />
                    </div>
                  </div>

                  {/* Trip footer */}
                  <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
                    <span>
                      Boarded:{" "}
                      <strong className="text-slate-200 font-semibold">
                        {trip.passengersBoarded || 0}
                      </strong>{" "}
                      students
                    </span>
                    <Link
                      to="/live-tracking"
                      className="text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1 font-medium"
                    >
                      <span>Track</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
