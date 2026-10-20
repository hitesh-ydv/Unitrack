import React, { useState } from "react";
import {
  Bell,
  Send,
  AlertTriangle,
  Clock,
  Wrench,
  Info,
  CheckCircle,
  Filter,
  Plus,
} from "lucide-react";
import { useToast } from "../context/ToastContext";
import { Modal } from "../components/common/Modal";
import { notificationService } from "../services/notificationService";

export const NotificationCenter = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState("all");
  const [isComposeOpen, setIsComposeOpen] = useState(false);

  const [composeData, setComposeData] = useState({
    title: "",
    message: "",
    category: "info",
    target: "all_students",
  });

  const toast = useToast();

  useEffect(() => {
    notificationService
      .getAll()
      .then((data) => {
        setNotifications(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load notifications:", err);
        setNotifications([]);
        setLoading(false);
      });
  }, []);

  const handleToggleRead = async (id) => {
    try {
      await notificationService.toggleRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, unread: !n.unread } : n))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
      toast.success("Updated", "All notifications marked as read.");
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendCompose = async (e) => {
    e.preventDefault();
    if (!composeData.title || !composeData.message) {
      toast.warning("Validation Error", "Please provide title and message.");
      return;
    }

    try {
      const created = await notificationService.create(composeData);
      setNotifications((prev) => [created, ...prev]);
      toast.success("Broadcast Dispatched", `Notification sent to ${composeData.target}.`);
      setIsComposeOpen(false);
      setComposeData({
        title: "",
        message: "",
        category: "info",
        target: "all_students",
      });
    } catch (err) {
      toast.error("Failed", err.message || "Failed to dispatch notification.");
    }
  };

  const filteredNotifs = notifications.filter((n) => {
    if (filterCategory === "all") return true;
    if (filterCategory === "unread") return n.unread;
    return n.category === filterCategory;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Campus Notification & Advisory Center</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Broadcast transit alerts, route weather warnings, and schedule adjustments to students and drivers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleMarkAllRead}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 cursor-pointer"
          >
            Mark All Read
          </button>
          <button
            onClick={() => setIsComposeOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/25 transition-all cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>Compose Broadcast</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {[
          { label: "All Notices", value: "all" },
          { label: "Unread Only", value: "unread" },
          { label: "Delays", value: "delay" },
          { label: "Emergency", value: "emergency" },
          { label: "Maintenance", value: "maintenance" },
          { label: "System Info", value: "info" },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilterCategory(tab.value)}
            className={`px-3 py-1.5 rounded-xl font-medium transition-colors cursor-pointer shrink-0 ${
              filterCategory === tab.value
                ? "bg-indigo-600 text-white font-semibold shadow"
                : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-xl divide-y divide-slate-800/60">
        {filteredNotifs.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No notifications found in this category.
          </div>
        ) : (
          filteredNotifs.map((n) => {
            let Icon = Info;
            let iconBg = "bg-blue-500/10 text-blue-400 border-blue-500/20";
            if (n.category === "emergency") {
              Icon = AlertTriangle;
              iconBg = "bg-rose-500/10 text-rose-400 border-rose-500/20";
            } else if (n.category === "delay") {
              Icon = Clock;
              iconBg = "bg-amber-500/10 text-amber-400 border-amber-500/20";
            } else if (n.category === "maintenance") {
              Icon = Wrench;
              iconBg = "bg-purple-500/10 text-purple-400 border-purple-500/20";
            }

            return (
              <div
                key={n.id}
                className={`p-4 sm:p-5 flex items-start gap-4 transition-colors hover:bg-slate-800/30 ${
                  n.unread ? "bg-slate-800/20" : ""
                }`}
              >
                <div className={`p-2.5 rounded-xl border shrink-0 ${iconBg}`}>
                  <Icon className="w-5 h-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                    <h4 className="font-bold text-white text-sm flex items-center gap-2">
                      <span>{n.title}</span>
                      {n.unread && (
                        <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                      )}
                    </h4>
                    <span className="text-xs text-slate-500 shrink-0">{n.time}</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{n.message}</p>
                </div>

                <button
                  onClick={() => handleToggleRead(n.id)}
                  className="p-1 text-slate-400 hover:text-white rounded text-xs"
                  title={n.unread ? "Mark as read" : "Mark as unread"}
                >
                  <CheckCircle
                    className={`w-4 h-4 ${
                      !n.unread ? "text-indigo-400" : "text-slate-600"
                    }`}
                  />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Compose Notification Modal */}
      <Modal
        isOpen={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
        title="Compose Campus Transit Broadcast"
        subtitle="Dispatches notifications to student mobile app, SMS gateway, and driver tablets."
      >
        <form onSubmit={handleSendCompose} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Target Audience</label>
            <select
              value={composeData.target}
              onChange={(e) => setComposeData({ ...composeData, target: e.target.value })}
              className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
            >
              <option value="all_students">All University Students (Ridership Roster)</option>
              <option value="route_101_passengers">Route 101 North Suburbs Passengers Only</option>
              <option value="route_102_passengers">Route 102 South Sector Passengers Only</option>
              <option value="route_103_passengers">Route 103 West Corridor Passengers Only</option>
              <option value="all_drivers">All Bus Drivers & Conductors</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Notice Category</label>
              <select
                value={composeData.category}
                onChange={(e) => setComposeData({ ...composeData, category: e.target.value })}
                className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              >
                <option value="info">General Transit Announcement</option>
                <option value="delay">Traffic / Schedule Delay</option>
                <option value="emergency">Emergency / Bad Weather Warning</option>
                <option value="maintenance">Maintenance / Route Detour</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Broadcast Title *</label>
              <input
                type="text"
                required
                value={composeData.title}
                onChange={(e) => setComposeData({ ...composeData, title: e.target.value })}
                placeholder="e.g. Weather Alert: Heavy Rain Advisory"
                className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Message Content *</label>
            <textarea
              rows={4}
              required
              value={composeData.message}
              onChange={(e) => setComposeData({ ...composeData, message: e.target.value })}
              placeholder="Type message body for SMS and mobile app push notifications..."
              className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsComposeOpen(false)}
              className="px-4 py-2 text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg transition-all"
            >
              Dispatch Broadcast
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
