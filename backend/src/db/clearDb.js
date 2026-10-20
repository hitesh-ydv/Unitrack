const db = require("./d1Client");
const bcrypt = require("bcryptjs");

async function clearDb() {
  console.log("[DB Clear] Removing all previous data from Cloudflare D1 database...");

  const tables = [
    "buses",
    "routes",
    "stops",
    "drivers",
    "students",
    "trips",
    "attendance",
    "geofences",
    "maintenance_records",
    "alerts",
    "emergencies",
    "notifications",
    "audit_logs",
    "settings",
    "users",
    "roles_permissions"
  ];

  for (const table of tables) {
    try {
      await db.execute(`DELETE FROM ${table}`);
      console.log(`[DB Clear] Cleared table: ${table}`);
    } catch (err) {
      console.warn(`[DB Clear] Warning clearing ${table}:`, err.message);
    }
  }

  // Insert standard system roles
  const roles = [
    {
      role: "Super Admin",
      description: "Complete unconstrained access across all transit settings, users, hardware, and logs.",
      permissions: JSON.stringify([
        "Manage All Buses & Drivers",
        "Edit Geofences & Routes",
        "Trigger Emergency Broadcasts",
        "User & Role Administration",
        "System Configuration",
        "Purge & Export Audit Logs",
      ]),
    },
    {
      role: "Fleet Manager",
      description: "Oversees vehicle health, maintenance schedules, fuel records, and hardware telematics.",
      permissions: JSON.stringify([
        "Manage All Buses & Drivers",
        "Log Maintenance & Servicing",
        "View Fleet Tracking & Diagnostics",
        "View Reports & Analytics",
      ]),
    },
    {
      role: "Dispatcher",
      description: "Monitors active morning & evening trips, handles delays, assigns relief buses, and triggers SOS.",
      permissions: JSON.stringify([
        "Live Trip Monitoring & Rescheduling",
        "Trigger Route Alerts & SOS Actions",
        "Manage Real-time Bus Assignments",
        "Send Push Notifications",
      ]),
    },
    {
      role: "Conductor",
      description: "Assigned onboard tablet access for QR/RFID student attendance and stop verifications.",
      permissions: JSON.stringify([
        "QR / RFID Student Scan Console",
        "Mark Passenger Attendance",
        "Report Onboard Incident",
      ]),
    },
    {
      role: "Viewer",
      description: "Read-only situational awareness for security guards, faculty coordinators, and dean's office.",
      permissions: JSON.stringify([
        "View Live Map & Fleet Locations",
        "View Trip Schedules & Delays",
        "View Public Student Rosters",
      ]),
    },
  ];

  for (const r of roles) {
    await db.execute(
      `INSERT INTO roles_permissions (role, description, permissions) VALUES (?, ?, ?)`,
      [r.role, r.description, r.permissions]
    );
  }
  console.log("[DB Clear] Re-seeded 5 system roles in roles_permissions.");

  // Insert default Super Admin user for immediate login
  const defaultPasswordHash = bcrypt.hashSync("password123", 10);
  await db.execute(
    `INSERT INTO users (id, name, email, password_hash, role, department, phone, status, lastLogin)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      "USR-001",
      "System Administrator",
      "admin@apex.edu",
      defaultPasswordHash,
      "Super Admin",
      "Transit Administration",
      "+91 98000 00000",
      "active",
      "Just now"
    ]
  );
  console.log("[DB Clear] Created default admin user: admin@apex.edu / password123");

  // Re-initialize default settings
  const defaultSettings = JSON.stringify({
    universityName: "Apex University of Science & Technology",
    campusBranch: "Main Technology Campus (East Hub)",
    emergencyHotline: "+91 (080) 2841-9999",
    transportEmail: "transport-desk@apex.edu",
    selectedTileProviderId: "osm",
    gpsPingIntervalSec: 5,
    delayThresholdMin: 10,
    overspeedLimitKmh: 50,
    geofenceBufferMeters: 50,
    enableAutoAlerts: true,
    enableSmsNotifications: true,
    enableParentPortalSync: true,
  });

  await db.execute(
    "INSERT OR REPLACE INTO settings (key, value) VALUES ('general_settings', ?)",
    [defaultSettings]
  );
  console.log("[DB Clear] Cleared and initialized general settings.");

  console.log("[DB Clear] Cloudflare D1 cleanup successfully completed!");
}

if (require.main === module) {
  clearDb()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("[DB Clear] Error:", err);
      process.exit(1);
    });
}

module.exports = clearDb;
