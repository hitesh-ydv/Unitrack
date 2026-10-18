-- UniTrack Database Schema for Cloudflare D1 (SQLite)

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  role TEXT NOT NULL DEFAULT 'Viewer',
  department TEXT,
  phone TEXT,
  status TEXT DEFAULT 'active',
  lastLogin TEXT,
  avatarUrl TEXT,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS roles_permissions (
  role TEXT PRIMARY KEY,
  description TEXT,
  permissions TEXT -- JSON string array
);

CREATE TABLE IF NOT EXISTS stops (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  geofenceRadiusMeters REAL DEFAULT 80,
  hasShelter INTEGER DEFAULT 0,
  hasCctv INTEGER DEFAULT 0,
  morningTime TEXT,
  eveningTime TEXT,
  studentCount INTEGER DEFAULT 0,
  zone TEXT,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS routes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  color TEXT DEFAULT '#3b82f6',
  status TEXT DEFAULT 'active',
  distanceKm REAL DEFAULT 0,
  estimatedDurationMin INTEGER DEFAULT 0,
  operatingHours TEXT,
  stops TEXT, -- JSON string array of stop IDs
  waypoints TEXT, -- JSON string array of [lat, lng]
  studentAssignedCount INTEGER DEFAULT 0,
  activeBusId TEXT,
  streetsTraversed TEXT,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS drivers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  licenseNumber TEXT,
  phone TEXT,
  email TEXT,
  assignedBusId TEXT,
  assignedBusNumber TEXT,
  status TEXT DEFAULT 'on_duty',
  rating REAL DEFAULT 5.0,
  shift TEXT,
  shiftHoursToday REAL DEFAULT 0,
  incidentCount INTEGER DEFAULT 0,
  experienceYears INTEGER DEFAULT 0,
  bloodGroup TEXT,
  joinedDate TEXT,
  photoUrl TEXT,
  licenseDocUrl TEXT,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS buses (
  id TEXT PRIMARY KEY,
  busNumber TEXT NOT NULL,
  plateNumber TEXT NOT NULL,
  model TEXT,
  capacity INTEGER DEFAULT 45,
  currentOccupancy INTEGER DEFAULT 0,
  fuelType TEXT DEFAULT 'Diesel',
  fuelLevelPercent REAL DEFAULT 100,
  status TEXT DEFAULT 'active',
  gpsStatus TEXT DEFAULT 'live',
  assignedDriverId TEXT,
  assignedDriverName TEXT,
  assignedDriverPhone TEXT,
  routeId TEXT,
  routeName TEXT,
  odometerKm REAL DEFAULT 0,
  speedKmh REAL DEFAULT 0,
  headingDeg REAL DEFAULT 0,
  currentLat REAL,
  currentLng REAL,
  lastPing TEXT,
  delayMinutes INTEGER DEFAULT 0,
  nextStopName TEXT,
  lastMaintenanceDate TEXT,
  nextMaintenanceDate TEXT,
  imageUrl TEXT,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  rollNumber TEXT,
  department TEXT,
  year TEXT,
  email TEXT,
  phone TEXT,
  assignedBusId TEXT,
  assignedBusNumber TEXT,
  assignedStopId TEXT,
  assignedStopName TEXT,
  rfidCode TEXT,
  qrPassCode TEXT,
  guardianName TEXT,
  guardianPhone TEXT,
  boardingStatusToday TEXT DEFAULT 'Pending',
  boardingTime TEXT,
  status TEXT DEFAULT 'active',
  photoUrl TEXT,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS trips (
  id TEXT PRIMARY KEY,
  busId TEXT,
  busNumber TEXT,
  driverId TEXT,
  driverName TEXT,
  routeId TEXT,
  routeName TEXT,
  direction TEXT,
  scheduledStart TEXT,
  actualStart TEXT,
  scheduledEnd TEXT,
  status TEXT DEFAULT 'scheduled',
  currentStopIndex INTEGER DEFAULT 0,
  totalStops INTEGER DEFAULT 0,
  progressPercent REAL DEFAULT 0,
  delayMinutes INTEGER DEFAULT 0,
  passengersBoarded INTEGER DEFAULT 0,
  expectedPassengers INTEGER DEFAULT 0,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS geofences (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'circle',
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  radiusMeters REAL DEFAULT 500,
  speedLimitKmh REAL DEFAULT 20,
  triggerType TEXT DEFAULT 'enter_and_exit',
  status TEXT DEFAULT 'active',
  description TEXT,
  color TEXT DEFAULT '#3b82f6',
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS alerts (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  severity TEXT DEFAULT 'info',
  title TEXT NOT NULL,
  description TEXT,
  busId TEXT,
  busNumber TEXT,
  driverName TEXT,
  timestamp TEXT,
  acknowledged INTEGER DEFAULT 0,
  resolved INTEGER DEFAULT 0,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  time TEXT,
  category TEXT DEFAULT 'info',
  target TEXT DEFAULT 'all',
  unread INTEGER DEFAULT 1,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT
);
