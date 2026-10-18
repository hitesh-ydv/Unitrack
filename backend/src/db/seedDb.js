const bcrypt = require("bcryptjs");
const db = require("./d1Client");
const initDb = require("./initDb");

async function seedDb() {
  console.log("[DB Seed] Ensuring schema exists...");
  await initDb();

  console.log("[DB Seed] Seeding initial data from UniTrack Admin datasets...");

  // 1. Roles and Permissions
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
      permissions: [
        "QR / RFID Student Scan Console",
        "Mark Passenger Attendance",
        "Report Onboard Incident",
      ],
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
      `INSERT OR REPLACE INTO roles_permissions (role, description, permissions) VALUES (?, ?, ?)`,
      [r.role, r.description, typeof r.permissions === "string" ? r.permissions : JSON.stringify(r.permissions)]
    );
  }

  // 2. Users (Default password: password123)
  const defaultPasswordHash = bcrypt.hashSync("password123", 10);
  const users = [
    {
      id: "USR-001",
      name: "Dr. Arvind Chawla",
      email: "arvind.chawla@apex.edu",
      role: "Super Admin",
      department: "Transport & Logistics Directorate",
      phone: "+91 98100 11223",
      status: "active",
      lastLogin: "Today, 08:12 AM",
    },
    {
      id: "USR-002",
      name: "Sarah Jenkins",
      email: "s.jenkins@apex.edu",
      role: "Dispatcher",
      department: "Control Room Operations",
      phone: "+91 98100 22334",
      status: "active",
      lastLogin: "Today, 06:45 AM",
    },
    {
      id: "USR-003",
      name: "Vikram Sengupta",
      email: "v.sengupta@apex.edu",
      role: "Fleet Manager",
      department: "Depot & Maintenance Ops",
      phone: "+91 98100 33445",
      status: "active",
      lastLogin: "Yesterday, 04:20 PM",
    },
    {
      id: "USR-004",
      name: "Deepa Raman",
      email: "d.raman@apex.edu",
      role: "Conductor",
      department: "Onboard Operations",
      phone: "+91 98100 44556",
      status: "active",
      lastLogin: "Today, 07:10 AM",
    },
    {
      id: "USR-005",
      name: "Campus Security Desk",
      email: "security.transit@apex.edu",
      role: "Viewer",
      department: "University Safety & Surveillance",
      phone: "+91 98100 55667",
      status: "active",
      lastLogin: "Today, 07:00 AM",
    },
  ];

  for (const u of users) {
    await db.execute(
      `INSERT OR REPLACE INTO users (id, name, email, password_hash, role, department, phone, status, lastLogin) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [u.id, u.name, u.email, defaultPasswordHash, u.role, u.department, u.phone, u.status, u.lastLogin]
    );
  }

  // 3. Stops
  const stops = [
    {
      id: "STP-01",
      name: "Central Metro Interchange",
      code: "S-101",
      lat: 12.9750,
      lng: 77.6050,
      geofenceRadiusMeters: 80,
      hasShelter: 1,
      hasCctv: 1,
      morningTime: "07:20 AM",
      eveningTime: "05:45 PM",
      studentCount: 48,
      zone: "Metro City Core",
    },
    {
      id: "STP-02",
      name: "Tech Park Boulevard East",
      code: "S-102",
      lat: 12.9820,
      lng: 77.6180,
      geofenceRadiusMeters: 75,
      hasShelter: 1,
      hasCctv: 1,
      morningTime: "07:35 AM",
      eveningTime: "05:30 PM",
      studentCount: 35,
      zone: "North Suburbs",
    },
    {
      id: "STP-03",
      name: "Greenwood Residency Circle",
      code: "S-103",
      lat: 12.9910,
      lng: 77.6250,
      geofenceRadiusMeters: 60,
      hasShelter: 0,
      hasCctv: 1,
      morningTime: "07:48 AM",
      eveningTime: "05:15 PM",
      studentCount: 29,
      zone: "North Suburbs",
    },
    {
      id: "STP-04",
      name: "University Gate 1 (Terminal)",
      code: "S-001",
      lat: 12.9716,
      lng: 77.5946,
      geofenceRadiusMeters: 120,
      hasShelter: 1,
      hasCctv: 1,
      morningTime: "08:15 AM",
      eveningTime: "05:00 PM",
      studentCount: 160,
      zone: "University Campus",
    },
    {
      id: "STP-05",
      name: "South Hills Residential Junction",
      code: "S-201",
      lat: 12.9450,
      lng: 77.5850,
      geofenceRadiusMeters: 70,
      hasShelter: 1,
      hasCctv: 0,
      morningTime: "07:15 AM",
      eveningTime: "05:50 PM",
      studentCount: 52,
      zone: "South Sector",
    },
    {
      id: "STP-06",
      name: "Botanical Garden Cross",
      code: "S-202",
      lat: 12.9550,
      lng: 77.5900,
      geofenceRadiusMeters: 80,
      hasShelter: 1,
      hasCctv: 1,
      morningTime: "07:32 AM",
      eveningTime: "05:35 PM",
      studentCount: 38,
      zone: "South Sector",
    },
    {
      id: "STP-07",
      name: "Sports Complex Gate 3",
      code: "S-003",
      lat: 12.9680,
      lng: 77.5910,
      geofenceRadiusMeters: 90,
      hasShelter: 1,
      hasCctv: 1,
      morningTime: "08:05 AM",
      eveningTime: "05:10 PM",
      studentCount: 75,
      zone: "University Campus",
    },
    {
      id: "STP-08",
      name: "West Cyber Valley Point",
      code: "S-301",
      lat: 12.9650,
      lng: 77.5600,
      geofenceRadiusMeters: 65,
      hasShelter: 1,
      hasCctv: 1,
      morningTime: "07:25 AM",
      eveningTime: "05:40 PM",
      studentCount: 44,
      zone: "West Corridor",
    },
    {
      id: "STP-09",
      name: "Heritage Lake Link Road",
      code: "S-302",
      lat: 12.9680,
      lng: 77.5780,
      geofenceRadiusMeters: 60,
      hasShelter: 0,
      hasCctv: 0,
      morningTime: "07:45 AM",
      eveningTime: "05:20 PM",
      studentCount: 31,
      zone: "West Corridor",
    },
  ];

  for (const s of stops) {
    await db.execute(
      `INSERT OR REPLACE INTO stops (id, name, code, lat, lng, geofenceRadiusMeters, hasShelter, hasCctv, morningTime, eveningTime, studentCount, zone)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [s.id, s.name, s.code, s.lat, s.lng, s.geofenceRadiusMeters, s.hasShelter, s.hasCctv, s.morningTime, s.eveningTime, s.studentCount, s.zone]
    );
  }

  // 4. Routes - Starting and Ending points are locked to University Campus Terminal (STP-04)
  const routes = [
    {
      id: "RT-01",
      name: "Route 101 - North Suburbs Express",
      code: "R-101",
      color: "#3b82f6",
      status: "active",
      distanceKm: 18.4,
      estimatedDurationMin: 45,
      operatingHours: "07:00 AM - 06:30 PM",
      stops: JSON.stringify(["STP-04", "STP-01", "STP-02", "STP-03", "STP-04"]),
      waypoints: JSON.stringify([
        [12.9716, 77.5946], // Start: University Campus Terminal
        [12.9730, 77.5990],
        [12.9750, 77.6050], // Central Metro
        [12.9780, 77.6110],
        [12.9820, 77.6180], // Tech Park
        [12.9860, 77.6210],
        [12.9910, 77.6250], // Greenwood Circle
        [12.9860, 77.6210],
        [12.9780, 77.6110],
        [12.9716, 77.5946], // End: University Campus Terminal
      ]),
      studentAssignedCount: 112,
      activeBusId: "BUS-01",
    },
    {
      id: "RT-02",
      name: "Route 102 - South Sector Metro Link",
      code: "R-102",
      color: "#10b981",
      status: "active",
      distanceKm: 14.8,
      estimatedDurationMin: 38,
      operatingHours: "07:10 AM - 06:15 PM",
      stops: JSON.stringify(["STP-04", "STP-07", "STP-06", "STP-05", "STP-04"]),
      waypoints: JSON.stringify([
        [12.9716, 77.5946], // Start: University Campus Terminal
        [12.9680, 77.5910], // Sports Complex
        [12.9620, 77.5905],
        [12.9550, 77.5900], // Botanical Garden
        [12.9500, 77.5880],
        [12.9450, 77.5850], // South Hills
        [12.9520, 77.5870],
        [12.9640, 77.5920],
        [12.9716, 77.5946], // End: University Campus Terminal
      ]),
      studentAssignedCount: 95,
      activeBusId: "BUS-02",
    },
    {
      id: "RT-03",
      name: "Route 103 - West Corridor Tech Shuttle",
      code: "R-103",
      color: "#f59e0b",
      status: "active",
      distanceKm: 16.2,
      estimatedDurationMin: 42,
      operatingHours: "07:15 AM - 06:00 PM",
      stops: JSON.stringify(["STP-04", "STP-07", "STP-09", "STP-08", "STP-04"]),
      waypoints: JSON.stringify([
        [12.9716, 77.5946], // Start: University Campus Terminal
        [12.9680, 77.5910], // Sports Complex
        [12.9680, 77.5780], // Heritage Lake Link
        [12.9665, 77.5700],
        [12.9650, 77.5600], // West Cyber Valley
        [12.9665, 77.5700],
        [12.9700, 77.5820],
        [12.9716, 77.5946], // End: University Campus Terminal
      ]),
      studentAssignedCount: 88,
      activeBusId: "BUS-03",
    },
    {
      id: "RT-04",
      name: "Route 104 - Eastern Township Feeder",
      code: "R-104",
      color: "#8b5cf6",
      status: "active",
      distanceKm: 19.5,
      estimatedDurationMin: 48,
      operatingHours: "06:45 AM - 07:00 PM",
      stops: JSON.stringify(["STP-04", "STP-01", "STP-02", "STP-04"]),
      waypoints: JSON.stringify([
        [12.9716, 77.5946], // Start: University Campus Terminal
        [12.9750, 77.6050], // Central Metro
        [12.9820, 77.6180], // Tech Park
        [12.9770, 77.6100],
        [12.9716, 77.5946], // End: University Campus Terminal
      ]),
      studentAssignedCount: 64,
      activeBusId: "BUS-04",
    },
    {
      id: "RT-05",
      name: "Route 105 - Central Rapid Ring",
      code: "R-105",
      color: "#06b6d4",
      status: "active",
      distanceKm: 13.0,
      estimatedDurationMin: 32,
      operatingHours: "07:30 AM - 08:00 PM",
      stops: JSON.stringify(["STP-04", "STP-01", "STP-06", "STP-04"]),
      waypoints: JSON.stringify([
        [12.9716, 77.5946], // Start: University
        [12.9750, 77.6050], // Central Metro
        [12.9620, 77.5980],
        [12.9550, 77.5900], // Botanical Garden
        [12.9680, 77.5910],
        [12.9716, 77.5946], // End: University
      ]),
      studentAssignedCount: 72,
      activeBusId: "BUS-05",
    },
    {
      id: "RT-06",
      name: "Route 106 - Campus Perimeter Shuttle",
      code: "R-106",
      color: "#ec4899",
      status: "active",
      distanceKm: 11.5,
      estimatedDurationMin: 28,
      operatingHours: "07:00 AM - 08:30 PM",
      stops: JSON.stringify(["STP-04", "STP-07", "STP-09", "STP-04"]),
      waypoints: JSON.stringify([
        [12.9716, 77.5946], // Start: University
        [12.9680, 77.5910], // Sports Complex
        [12.9680, 77.5780], // Heritage Lake
        [12.9700, 77.5850],
        [12.9716, 77.5946], // End: University
      ]),
      studentAssignedCount: 55,
      activeBusId: "BUS-06",
    },
  ];

  for (const rt of routes) {
    await db.execute(
      `INSERT OR REPLACE INTO routes (id, name, code, color, status, distanceKm, estimatedDurationMin, operatingHours, stops, waypoints, studentAssignedCount, activeBusId)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [rt.id, rt.name, rt.code, rt.color, rt.status, rt.distanceKm, rt.estimatedDurationMin, rt.operatingHours, rt.stops, rt.waypoints, rt.studentAssignedCount, rt.activeBusId]
    );
  }

  // 5. Drivers
  const drivers = [
    {
      id: "DRV-01",
      name: "Rajesh Kumar",
      licenseNumber: "DL-042014002819",
      phone: "+91 98451 22310",
      email: "rajesh.k@unitrack-drivers.edu",
      assignedBusId: "BUS-01",
      assignedBusNumber: "Bus 101",
      status: "on_duty",
      rating: 4.9,
      shift: "Morning & Evening",
      shiftHoursToday: 5.2,
      incidentCount: 0,
      experienceYears: 12,
      bloodGroup: "O+",
      joinedDate: "2021-04-12",
    },
    {
      id: "DRV-02",
      name: "Prakash Deshmukh",
      licenseNumber: "DL-042016009823",
      phone: "+91 98452 44521",
      email: "prakash.d@unitrack-drivers.edu",
      assignedBusId: "BUS-02",
      assignedBusNumber: "Bus 102",
      status: "on_duty",
      rating: 4.8,
      shift: "Morning & Evening",
      shiftHoursToday: 4.8,
      incidentCount: 0,
      experienceYears: 9,
      bloodGroup: "B+",
      joinedDate: "2022-07-19",
    },
    {
      id: "DRV-03",
      name: "Gurpreet Singh",
      licenseNumber: "DL-042012001182",
      phone: "+91 98453 66732",
      email: "gurpreet.s@unitrack-drivers.edu",
      assignedBusId: "BUS-03",
      assignedBusNumber: "Bus 103",
      status: "on_duty",
      rating: 4.6,
      shift: "Morning Shift",
      shiftHoursToday: 6.1,
      incidentCount: 2,
      experienceYears: 15,
      bloodGroup: "A+",
      joinedDate: "2020-01-10",
    },
    {
      id: "DRV-04",
      name: "Mohammad Farooq",
      licenseNumber: "DL-042018005421",
      phone: "+91 98454 88943",
      email: "m.farooq@unitrack-drivers.edu",
      assignedBusId: "BUS-04",
      assignedBusNumber: "Bus 104",
      status: "off_duty",
      rating: 4.7,
      shift: "Depot Standby",
      shiftHoursToday: 2.0,
      incidentCount: 0,
      experienceYears: 7,
      bloodGroup: "AB+",
      joinedDate: "2023-02-14",
    },
    {
      id: "DRV-05",
      name: "Anand Shettigar",
      licenseNumber: "DL-042015003319",
      phone: "+91 98455 11254",
      email: "anand.s@unitrack-drivers.edu",
      assignedBusId: "BUS-06",
      assignedBusNumber: "Bus 106",
      status: "on_duty",
      rating: 4.9,
      shift: "Morning & Evening",
      shiftHoursToday: 4.5,
      incidentCount: 0,
      experienceYears: 11,
      bloodGroup: "O-",
      joinedDate: "2021-08-01",
    },
    {
      id: "DRV-06",
      name: "Venkatesh Rao",
      licenseNumber: "DL-042017006734",
      phone: "+91 98456 77890",
      email: "venkatesh.r@unitrack-drivers.edu",
      assignedBusId: null,
      assignedBusNumber: "Unassigned",
      status: "on_leave",
      rating: 4.5,
      shift: "Sick Leave",
      shiftHoursToday: 0,
      incidentCount: 1,
      experienceYears: 8,
      bloodGroup: "B-",
      joinedDate: "2022-11-20",
    },
  ];

  for (const d of drivers) {
    await db.execute(
      `INSERT OR REPLACE INTO drivers (id, name, licenseNumber, phone, email, assignedBusId, assignedBusNumber, status, rating, shift, shiftHoursToday, incidentCount, experienceYears, bloodGroup, joinedDate)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [d.id, d.name, d.licenseNumber, d.phone, d.email, d.assignedBusId, d.assignedBusNumber, d.status, d.rating, d.shift, d.shiftHoursToday, d.incidentCount, d.experienceYears, d.bloodGroup, d.joinedDate]
    );
  }

  // 6. Buses
  const buses = [
    {
      id: "BUS-01",
      busNumber: "Bus 101",
      plateNumber: "KA-05-EB-4102",
      model: "Tata Marcopolo CityRide",
      capacity: 52,
      currentOccupancy: 41,
      fuelType: "CNG",
      fuelLevelPercent: 78,
      status: "active",
      gpsStatus: "live",
      assignedDriverId: "DRV-01",
      assignedDriverName: "Rajesh Kumar",
      assignedDriverPhone: "+91 98451 22310",
      routeId: "RT-01",
      routeName: "Route 101 - North Suburbs Express",
      odometerKm: 42560,
      speedKmh: 36,
      headingDeg: 45,
      currentLat: 12.9835,
      currentLng: 77.6190,
      lastPing: new Date(Date.now() - 4000).toISOString(),
      delayMinutes: 2,
      nextStopName: "Tech Park Boulevard East",
      lastMaintenanceDate: "2026-08-10",
      nextMaintenanceDate: "2026-11-15",
    },
    {
      id: "BUS-02",
      busNumber: "Bus 102",
      plateNumber: "KA-04-MK-9821",
      model: "Eicher Skyline Pro EV",
      capacity: 45,
      currentOccupancy: 39,
      fuelType: "Electric (EV)",
      fuelLevelPercent: 64,
      status: "active",
      gpsStatus: "live",
      assignedDriverId: "DRV-02",
      assignedDriverName: "Prakash Deshmukh",
      assignedDriverPhone: "+91 98452 44521",
      routeId: "RT-02",
      routeName: "Route 102 - South Sector Metro Link",
      odometerKm: 28410,
      speedKmh: 24,
      headingDeg: 350,
      currentLat: 12.9565,
      currentLng: 77.5902,
      lastPing: new Date(Date.now() - 12000).toISOString(),
      delayMinutes: 0,
      nextStopName: "Botanical Garden Cross",
      lastMaintenanceDate: "2026-09-02",
      nextMaintenanceDate: "2026-12-05",
    },
    {
      id: "BUS-03",
      busNumber: "Bus 103",
      plateNumber: "KA-03-TR-7734",
      model: "Ashok Leyland Viking",
      capacity: 55,
      currentOccupancy: 48,
      fuelType: "Diesel",
      fuelLevelPercent: 42,
      status: "active",
      gpsStatus: "live",
      assignedDriverId: "DRV-03",
      assignedDriverName: "Gurpreet Singh",
      assignedDriverPhone: "+91 98453 66732",
      routeId: "RT-03",
      routeName: "Route 103 - West Corridor Tech Shuttle",
      odometerKm: 61890,
      speedKmh: 58,
      headingDeg: 110,
      currentLat: 12.9672,
      currentLng: 77.5730,
      lastPing: new Date(Date.now() - 8000).toISOString(),
      delayMinutes: 14,
      nextStopName: "Heritage Lake Link Road",
      lastMaintenanceDate: "2026-07-18",
      nextMaintenanceDate: "2026-10-25",
    },
    {
      id: "BUS-04",
      busNumber: "Bus 104",
      plateNumber: "KA-01-AF-3329",
      model: "Volvo 9400 B8R Ultra",
      capacity: 58,
      currentOccupancy: 28,
      fuelType: "Diesel",
      fuelLevelPercent: 91,
      status: "active",
      gpsStatus: "live",
      assignedDriverId: "DRV-04",
      assignedDriverName: "Mohammad Farooq",
      assignedDriverPhone: "+91 98454 88943",
      routeId: "RT-04",
      routeName: "Route 104 - Eastern Township Feeder",
      odometerKm: 89400,
      speedKmh: 34,
      headingDeg: 80,
      currentLat: 12.9775,
      currentLng: 77.6090,
      lastPing: new Date(Date.now() - 5000).toISOString(),
      delayMinutes: 0,
      nextStopName: "Tech Park Boulevard East",
      lastMaintenanceDate: "2026-10-14",
      nextMaintenanceDate: "2026-10-18",
    },
    {
      id: "BUS-05",
      busNumber: "Bus 105",
      plateNumber: "KA-51-MM-6120",
      model: "Tata Starbus EV",
      capacity: 40,
      currentOccupancy: 22,
      fuelType: "Electric (EV)",
      fuelLevelPercent: 88,
      status: "active",
      gpsStatus: "live",
      assignedDriverId: "DRV-06",
      assignedDriverName: "Venkatesh Rao",
      assignedDriverPhone: "+91 98456 77890",
      routeId: "RT-05",
      routeName: "Route 105 - Central Rapid Ring",
      odometerKm: 19400,
      speedKmh: 28,
      headingDeg: 190,
      currentLat: 12.9640,
      currentLng: 77.5950,
      lastPing: new Date(Date.now() - 4000).toISOString(),
      delayMinutes: 0,
      nextStopName: "Botanical Garden Cross",
      lastMaintenanceDate: "2026-08-28",
      nextMaintenanceDate: "2026-11-30",
    },
    {
      id: "BUS-06",
      busNumber: "Bus 106",
      plateNumber: "KA-05-ZZ-9912",
      model: "Eicher Skyline Pro EV",
      capacity: 48,
      currentOccupancy: 36,
      fuelType: "Electric (EV)",
      fuelLevelPercent: 82,
      status: "active",
      gpsStatus: "live",
      assignedDriverId: "DRV-05",
      assignedDriverName: "Anand Shettigar",
      assignedDriverPhone: "+91 98455 11254",
      routeId: "RT-06",
      routeName: "Route 106 - Campus Perimeter Shuttle",
      odometerKm: 34100,
      speedKmh: 31,
      headingDeg: 270,
      currentLat: 12.9690,
      currentLng: 77.5840,
      lastPing: new Date(Date.now() - 3000).toISOString(),
      delayMinutes: 1,
      nextStopName: "Sports Complex Gate 3",
      lastMaintenanceDate: "2026-09-15",
      nextMaintenanceDate: "2026-12-15",
    },
  ];

  for (const b of buses) {
    await db.execute(
      `INSERT OR REPLACE INTO buses (
        id, busNumber, plateNumber, model, capacity, currentOccupancy, fuelType, fuelLevelPercent,
        status, gpsStatus, assignedDriverId, assignedDriverName, assignedDriverPhone, routeId,
        routeName, odometerKm, speedKmh, headingDeg, currentLat, currentLng, lastPing, delayMinutes,
        nextStopName, lastMaintenanceDate, nextMaintenanceDate
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        b.id, b.busNumber, b.plateNumber, b.model, b.capacity, b.currentOccupancy, b.fuelType, b.fuelLevelPercent,
        b.status, b.gpsStatus, b.assignedDriverId, b.assignedDriverName, b.assignedDriverPhone, b.routeId,
        b.routeName, b.odometerKm, b.speedKmh, b.headingDeg, b.currentLat, b.currentLng, b.lastPing, b.delayMinutes,
        b.nextStopName, b.lastMaintenanceDate, b.nextMaintenanceDate
      ]
    );
  }

  // 7. Students
  const students = [
    {
      id: "STU-2026-101",
      name: "Aarav Sharma",
      rollNumber: "CS-2023-042",
      department: "Computer Science & Eng.",
      year: "3rd Year",
      email: "aarav.sharma@uni.edu",
      phone: "+91 98765 43210",
      assignedBusId: "BUS-01",
      assignedBusNumber: "Bus 101",
      assignedStopId: "STP-01",
      assignedStopName: "Central Metro Interchange",
      rfidCode: "RFID-7721-X9",
      qrPassCode: "PASS-QR-90218-AARAV",
      guardianName: "Sanjay Sharma",
      guardianPhone: "+91 98111 22334",
      boardingStatusToday: "Boarded",
      boardingTime: "07:22 AM",
      status: "active",
    },
    {
      id: "STU-2026-102",
      name: "Sneha Mukherjee",
      rollNumber: "EC-2024-018",
      department: "Electronics & Comm.",
      year: "2nd Year",
      email: "sneha.m@uni.edu",
      phone: "+91 98765 43211",
      assignedBusId: "BUS-01",
      assignedBusNumber: "Bus 101",
      assignedStopId: "STP-02",
      assignedStopName: "Tech Park Boulevard East",
      rfidCode: "RFID-8812-Y4",
      qrPassCode: "PASS-QR-90219-SNEHA",
      guardianName: "Amitabh Mukherjee",
      guardianPhone: "+91 98111 33445",
      boardingStatusToday: "Boarded",
      boardingTime: "07:37 AM",
      status: "active",
    },
    {
      id: "STU-2026-103",
      name: "Rohan Varma",
      rollNumber: "ME-2022-091",
      department: "Mechanical Engineering",
      year: "4th Year",
      email: "rohan.v@uni.edu",
      phone: "+91 98765 43212",
      assignedBusId: "BUS-02",
      assignedBusNumber: "Bus 102",
      assignedStopId: "STP-05",
      assignedStopName: "South Hills Residential Junction",
      rfidCode: "RFID-3341-Z1",
      qrPassCode: "PASS-QR-90220-ROHAN",
      guardianName: "Sunita Varma",
      guardianPhone: "+91 98111 44556",
      boardingStatusToday: "Boarded",
      boardingTime: "07:18 AM",
      status: "active",
    },
    {
      id: "STU-2026-104",
      name: "Ananya Iyer",
      rollNumber: "BT-2025-009",
      department: "Biotechnology",
      year: "1st Year",
      email: "ananya.i@uni.edu",
      phone: "+91 98765 43213",
      assignedBusId: "BUS-02",
      assignedBusNumber: "Bus 102",
      assignedStopId: "STP-06",
      assignedStopName: "Botanical Garden Cross",
      rfidCode: "RFID-9901-B2",
      qrPassCode: "PASS-QR-90221-ANANYA",
      guardianName: "K. Iyer",
      guardianPhone: "+91 98111 55667",
      boardingStatusToday: "Boarded",
      boardingTime: "07:34 AM",
      status: "active",
    },
    {
      id: "STU-2026-105",
      name: "Zaid Khan",
      rollNumber: "CS-2024-114",
      department: "Computer Science & Eng.",
      year: "2nd Year",
      email: "zaid.k@uni.edu",
      phone: "+91 98765 43214",
      assignedBusId: "BUS-03",
      assignedBusNumber: "Bus 103",
      assignedStopId: "STP-08",
      assignedStopName: "West Cyber Valley Point",
      rfidCode: "RFID-5542-C7",
      qrPassCode: "PASS-QR-90222-ZAID",
      guardianName: "Tariq Khan",
      guardianPhone: "+91 98111 66778",
      boardingStatusToday: "Missed",
      boardingTime: null,
      status: "active",
    },
    {
      id: "STU-2026-106",
      name: "Meera Nambiar",
      rollNumber: "MB-2025-055",
      department: "Business School (MBA)",
      year: "1st Year",
      email: "meera.n@uni.edu",
      phone: "+91 98765 43215",
      assignedBusId: "BUS-03",
      assignedBusNumber: "Bus 103",
      assignedStopId: "STP-09",
      assignedStopName: "Heritage Lake Link Road",
      rfidCode: "RFID-6619-D9",
      qrPassCode: "PASS-QR-90223-MEERA",
      guardianName: "S. Nambiar",
      guardianPhone: "+91 98111 77889",
      boardingStatusToday: "Pending",
      boardingTime: null,
      status: "active",
    },
    {
      id: "STU-2026-107",
      name: "Devendra Patel",
      rollNumber: "CE-2023-031",
      department: "Civil Engineering",
      year: "3rd Year",
      email: "devendra.p@uni.edu",
      phone: "+91 98765 43216",
      assignedBusId: "BUS-01",
      assignedBusNumber: "Bus 101",
      assignedStopId: "STP-03",
      assignedStopName: "Greenwood Residency Circle",
      rfidCode: "RFID-4421-E3",
      qrPassCode: "PASS-QR-90224-DEV",
      guardianName: "Mahesh Patel",
      guardianPhone: "+91 98111 88990",
      boardingStatusToday: "Boarded",
      boardingTime: "07:50 AM",
      status: "active",
    },
    {
      id: "STU-2026-108",
      name: "Kavya Menon",
      rollNumber: "DS-2024-004",
      department: "Data Science & AI",
      year: "2nd Year",
      email: "kavya.m@uni.edu",
      phone: "+91 98765 43217",
      assignedBusId: "BUS-06",
      assignedBusNumber: "Bus 106",
      assignedStopId: "STP-01",
      assignedStopName: "Central Metro Interchange",
      rfidCode: "RFID-1102-K8",
      qrPassCode: "PASS-QR-90225-KAVYA",
      guardianName: "Radha Menon",
      guardianPhone: "+91 98111 99001",
      boardingStatusToday: "Boarded",
      boardingTime: "07:25 AM",
      status: "active",
    },
  ];

  for (const stu of students) {
    await db.execute(
      `INSERT OR REPLACE INTO students (
        id, name, rollNumber, department, year, email, phone, assignedBusId, assignedBusNumber,
        assignedStopId, assignedStopName, rfidCode, qrPassCode, guardianName, guardianPhone,
        boardingStatusToday, boardingTime, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        stu.id, stu.name, stu.rollNumber, stu.department, stu.year, stu.email, stu.phone,
        stu.assignedBusId, stu.assignedBusNumber, stu.assignedStopId, stu.assignedStopName,
        stu.rfidCode, stu.qrPassCode, stu.guardianName, stu.guardianPhone, stu.boardingStatusToday,
        stu.boardingTime, stu.status
      ]
    );
  }

  // 8. Trips
  const trips = [
    {
      id: "TRP-9021",
      busId: "BUS-01",
      busNumber: "Bus 101",
      driverId: "DRV-01",
      driverName: "Rajesh Kumar",
      routeId: "RT-01",
      routeName: "Route 101 - North Suburbs Express",
      direction: "Morning Pickup",
      scheduledStart: "07:15 AM",
      actualStart: "07:18 AM",
      scheduledEnd: "08:15 AM",
      status: "in_progress",
      currentStopIndex: 2,
      totalStops: 4,
      progressPercent: 70,
      delayMinutes: 2,
      passengersBoarded: 41,
      expectedPassengers: 48,
    },
    {
      id: "TRP-9022",
      busId: "BUS-02",
      busNumber: "Bus 102",
      driverId: "DRV-02",
      driverName: "Prakash Deshmukh",
      routeId: "RT-02",
      routeName: "Route 102 - South Sector Metro Link",
      direction: "Morning Pickup",
      scheduledStart: "07:10 AM",
      actualStart: "07:10 AM",
      scheduledEnd: "08:05 AM",
      status: "in_progress",
      currentStopIndex: 2,
      totalStops: 4,
      progressPercent: 65,
      delayMinutes: 0,
      passengersBoarded: 39,
      expectedPassengers: 42,
    },
    {
      id: "TRP-9023",
      busId: "BUS-03",
      busNumber: "Bus 103",
      driverId: "DRV-03",
      driverName: "Gurpreet Singh",
      routeId: "RT-03",
      routeName: "Route 103 - West Corridor Tech Shuttle",
      direction: "Morning Pickup",
      scheduledStart: "07:15 AM",
      actualStart: "07:22 AM",
      scheduledEnd: "08:10 AM",
      status: "delayed",
      currentStopIndex: 1,
      totalStops: 4,
      progressPercent: 35,
      delayMinutes: 14,
      passengersBoarded: 48,
      expectedPassengers: 52,
    },
    {
      id: "TRP-9024",
      busId: "BUS-06",
      busNumber: "Bus 106",
      driverId: "DRV-05",
      driverName: "Anand Shettigar",
      routeId: "RT-01",
      routeName: "Route 101 - North Suburbs Relief",
      direction: "Morning Pickup",
      scheduledStart: "07:20 AM",
      actualStart: "07:21 AM",
      scheduledEnd: "08:20 AM",
      status: "in_progress",
      currentStopIndex: 1,
      totalStops: 4,
      progressPercent: 45,
      delayMinutes: 1,
      passengersBoarded: 36,
      expectedPassengers: 40,
    },
    {
      id: "TRP-9019",
      busId: "BUS-01",
      busNumber: "Bus 101",
      driverId: "DRV-01",
      driverName: "Rajesh Kumar",
      routeId: "RT-01",
      routeName: "Route 101 - North Suburbs Express",
      direction: "Early Faculty Run",
      scheduledStart: "06:15 AM",
      actualStart: "06:15 AM",
      scheduledEnd: "07:05 AM",
      status: "completed",
      currentStopIndex: 4,
      totalStops: 4,
      progressPercent: 100,
      delayMinutes: 0,
      passengersBoarded: 24,
      expectedPassengers: 24,
    },
    {
      id: "TRP-9018",
      busId: "BUS-04",
      busNumber: "Bus 104",
      driverId: "DRV-04",
      driverName: "Mohammad Farooq",
      routeId: "RT-04",
      routeName: "Route 104 - Eastern Township Feeder",
      direction: "Morning Pickup",
      scheduledStart: "07:00 AM",
      actualStart: "N/A",
      scheduledEnd: "08:00 AM",
      status: "cancelled",
      currentStopIndex: 0,
      totalStops: 3,
      progressPercent: 0,
      delayMinutes: 0,
      passengersBoarded: 0,
      expectedPassengers: 35,
    },
  ];

  for (const t of trips) {
    await db.execute(
      `INSERT OR REPLACE INTO trips (
        id, busId, busNumber, driverId, driverName, routeId, routeName, direction,
        scheduledStart, actualStart, scheduledEnd, status, currentStopIndex, totalStops,
        progressPercent, delayMinutes, passengersBoarded, expectedPassengers
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        t.id, t.busId, t.busNumber, t.driverId, t.driverName, t.routeId, t.routeName, t.direction,
        t.scheduledStart, t.actualStart, t.scheduledEnd, t.status, t.currentStopIndex, t.totalStops,
        t.progressPercent, t.delayMinutes, t.passengersBoarded, t.expectedPassengers
      ]
    );
  }


  // 10. Geofences
  const geofences = [
    {
      id: "GEO-01",
      name: "Apex University Main Campus Perimeter",
      type: "circle",
      lat: 12.9716,
      lng: 77.5946,
      radiusMeters: 650,
      speedLimitKmh: 20,
      triggerType: "enter_and_exit",
      status: "active",
      description: "Strict 20 km/h campus pedestrian safety perimeter with entry/exit push alerts.",
      color: "#3b82f6",
    },
    {
      id: "GEO-02",
      name: "Central Maintenance Depots & Fuel Yard",
      type: "circle",
      lat: 12.9712,
      lng: 77.5930,
      radiusMeters: 250,
      speedLimitKmh: 15,
      triggerType: "dwell_time",
      status: "active",
      description: "Depot bay tracking dwell time for refueling, battery swaps, and night parking.",
      color: "#f59e0b",
    },
    {
      id: "GEO-03",
      name: "North Tech Park Corridor Buffer",
      type: "circle",
      lat: 12.9820,
      lng: 77.6180,
      radiusMeters: 400,
      speedLimitKmh: 45,
      triggerType: "exit_only",
      status: "active",
      description: "High traffic corridor monitoring exit delays toward university campus.",
      color: "#10b981",
    },
    {
      id: "GEO-04",
      name: "Heritage Lake Sensitive Eco-Zone",
      type: "circle",
      lat: 12.9680,
      lng: 77.5780,
      radiusMeters: 300,
      speedLimitKmh: 30,
      triggerType: "speed_breach",
      status: "active",
      description: "School and hospital quiet zone with strict 30 km/h maximum speed constraint.",
      color: "#ef4444",
    },
  ];

  for (const g of geofences) {
    await db.execute(
      `INSERT OR REPLACE INTO geofences (id, name, type, lat, lng, radiusMeters, speedLimitKmh, triggerType, status, description, color)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [g.id, g.name, g.type, g.lat, g.lng, g.radiusMeters, g.speedLimitKmh, g.triggerType, g.status, g.description, g.color]
    );
  }

  // 12. Alerts
  const alerts = [
    {
      id: "ALT-501",
      type: "overspeed",
      severity: "critical",
      title: "Excessive Speed Detected",
      description: "Bus 103 recorded 58 km/h in a 40 km/h suburban zone near Heritage Lake Link Road.",
      busId: "BUS-03",
      busNumber: "Bus 103",
      driverName: "Gurpreet Singh",
      timestamp: "8 minutes ago",
      acknowledged: 0,
      resolved: 0,
    },
    {
      id: "ALT-502",
      type: "critical_delay",
      severity: "warning",
      title: "Significant Schedule Delay (+14 min)",
      description: "Bus 103 on Route 103 is running 14 minutes behind schedule due to heavy flyover congestion.",
      busId: "BUS-03",
      busNumber: "Bus 103",
      driverName: "Gurpreet Singh",
      timestamp: "12 minutes ago",
      acknowledged: 1,
      resolved: 0,
    },
    {
      id: "ALT-503",
      type: "stale_gps",
      severity: "warning",
      title: "Stale GPS Telebeat",
      description: "Bus 104 has not emitted a GPS ping for over 8 minutes. Last known position: Central Yard.",
      busId: "BUS-04",
      busNumber: "Bus 104",
      driverName: "Mohammad Farooq",
      timestamp: "18 minutes ago",
      acknowledged: 0,
      resolved: 0,
    },
    {
      id: "ALT-504",
      type: "geofence_breach",
      severity: "info",
      title: "Campus Geofence Entry Logged",
      description: "Bus 101 successfully crossed into University Main Gate 1 perimeter geofence.",
      busId: "BUS-01",
      busNumber: "Bus 101",
      driverName: "Rajesh Kumar",
      timestamp: "25 minutes ago",
      acknowledged: 1,
      resolved: 1,
    },
    {
      id: "ALT-505",
      type: "low_fuel",
      severity: "info",
      title: "EV Battery Warning",
      description: "Standby Bus 105 battery state of charge dropped to 12%. Immediate charging required.",
      busId: "BUS-05",
      busNumber: "Bus 105",
      driverName: "None",
      timestamp: "1 hour ago",
      acknowledged: 1,
      resolved: 0,
    },
  ];

  for (const a of alerts) {
    await db.execute(
      `INSERT OR REPLACE INTO alerts (id, type, severity, title, description, busId, busNumber, driverName, timestamp, acknowledged, resolved)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [a.id, a.type, a.severity, a.title, a.description, a.busId, a.busNumber, a.driverName, a.timestamp, a.acknowledged, a.resolved]
    );
  }


  // 14. Notifications
  const notifications = [
    {
      id: "NOTIF-1",
      title: "Heavy Flyover Congestion",
      message: "Route 103 experiencing a 14-minute delay due to roadworks near Metro Junction. Parents notified.",
      time: "10 mins ago",
      category: "delay",
      unread: 1,
    },
    {
      id: "NOTIF-2",
      title: "Over-speeding Alert: Bus 103",
      message: "Bus 103 recorded 58 km/h in restricted 40 km/h corridor near Heritage Lake.",
      time: "15 mins ago",
      category: "emergency",
      unread: 1,
    },
    {
      id: "NOTIF-3",
      title: "Morning Shift Trip 9021 Departed",
      message: "Bus 101 commenced Route 101 North Suburbs on schedule with 41 students checked in.",
      time: "45 mins ago",
      category: "info",
      unread: 0,
    },
    {
      id: "NOTIF-4",
      title: "Scheduled Maintenance Due: Bus 105",
      message: "Tata Starbus EV high-voltage battery diagnostic check overdue by 6 days.",
      time: "2 hours ago",
      category: "maintenance",
      unread: 0,
    },
  ];

  for (const n of notifications) {
    await db.execute(
      `INSERT OR REPLACE INTO notifications (id, title, message, time, category, unread)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [n.id, n.title, n.message, n.time, n.category, n.unread]
    );
  }


  // 16. Default Settings
  const defaultSettings = {
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
  };

  await db.execute(
    `INSERT OR REPLACE INTO settings (key, value) VALUES ('general_settings', ?)`,
    [JSON.stringify(defaultSettings)]
  );

  console.log("[DB Seed] Database successfully seeded with all initial data!");
}

if (require.main === module) {
  seedDb()
    .then(() => {
      console.log("[DB Seed] Completed successfully.");
      process.exit(0);
    })
    .catch((err) => {
      console.error("[DB Seed] Error seeding database:", err);
      process.exit(1);
    });
}

module.exports = seedDb;
