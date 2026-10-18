const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");
const db = require("./db/d1Client");
const storage = require("./storage/supabaseStorage");
const errorHandler = require("./middleware/errorHandler");

// Route imports
const authRoutes = require("./routes/authRoutes");
const busRoutes = require("./routes/busRoutes");
const driverRoutes = require("./routes/driverRoutes");
const studentRoutes = require("./routes/studentRoutes");
const routeRoutes = require("./routes/routeRoutes");
const stopRoutes = require("./routes/stopRoutes");
const tripRoutes = require("./routes/tripRoutes");
const geofenceRoutes = require("./routes/geofenceRoutes");
const alertRoutes = require("./routes/alertRoutes");
const userRoutes = require("./routes/userRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const uploadRoutes = require("./routes/uploadRoutes");

const app = express();

// Global Middleware
app.use(cors());
app.use(morgan("dev"));
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

// Static files for local uploads fallback
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// System Health & Diagnostics endpoint
app.get(["/", "/api/health"], (req, res) => {
  res.json({
    status: "online",
    system: "UniTrack Central Fleet Backend",
    timestamp: new Date().toISOString(),
    database: {
      type: "Cloudflare D1 (SQLite)",
      connected: true,
      mode: db.isCloudflareConfigured() ? "Cloudflare D1 Cloud Database" : "Local SQLite (Ready for Cloudflare Credentials)",
    },
    storage: {
      type: "Supabase Storage (1 GB Free Tier)",
      connected: storage.isConfigured(),
      bucket: storage.bucketName,
      mode: storage.isConfigured() ? "Supabase Storage Bucket" : "Local Disk Fallback (Ready for Supabase Credentials)",
    },
    endpoints: [
      "/api/auth",
      "/api/buses",
      "/api/drivers",
      "/api/students",
      "/api/routes",
      "/api/stops",
      "/api/trips",
      "/api/geofences",
      "/api/alerts",
      "/api/users",
      "/api/notifications",
      "/api/settings",
      "/api/upload",
    ],
  });
});

// API Routes Mounting
app.use("/api/auth", authRoutes);
app.use("/api/buses", busRoutes);
app.use("/api/drivers", driverRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/routes", routeRoutes);
app.use("/api/stops", stopRoutes);
app.use("/api/trips", tripRoutes);
app.use("/api/geofences", geofenceRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/users", userRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/upload", uploadRoutes);

// 404 Handler for undefined routes
app.use((req, res) => {
  res.status(404).json({
    message: `Endpoint '${req.method} ${req.originalUrl}' not found.`,
  });
});

// Central Error Handler
app.use(errorHandler);

module.exports = app;
