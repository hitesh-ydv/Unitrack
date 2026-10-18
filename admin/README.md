# UniTrack — University Bus Tracking & Fleet Telematics Admin Panel

A comprehensive, responsive enterprise Transit Operations & Fleet Telematics dashboard built for universities, colleges, and educational campus networks. Built with **React 19 + Vite + plain JavaScript (ES6+)**, **Tailwind CSS**, **React Router v7**, **Lucide React**, **Axios**, **Leaflet & React Leaflet**, and **Recharts**.

---

## 🚀 Quick Start

### 1. Installation
Navigate into the `admin` directory and install dependencies:
```bash
cd admin
npm install
```

### 2. Run Development Server
```bash
npm run dev
```
Open your browser at `http://localhost:5173`.

### 3. Production Build
```bash
npm run build
npm run preview
```

---

## 🏛️ System Architecture & Project Organization

The codebase is organized into modular layers with clean separation of UI from API / service logic:

```
admin/
├── public/
├── src/
│   ├── components/
│   │   ├── common/             # Reusable UI primitives
│   │   │   ├── DataTable.jsx   # Search, multi-field filters, sorting, pagination, CSV export
│   │   │   ├── StatCard.jsx    # Metric KPI cards with trends & theme accents
│   │   │   ├── StatusBadge.jsx # Standardized status chips (live, delayed, active, etc.)
│   │   │   ├── Modal.jsx       # Accessible backdrop modal dialogs
│   │   │   ├── ConfirmDialog.jsx # Destructive / warning action confirmations
│   │   │   ├── LoadingSpinner.jsx # Polished animated loading state
│   │   │   └── EmptyState.jsx  # Zero-state placeholder illustration
│   │   └── map/                # Leaflet Map components
│   │       ├── MapContainerView.jsx # Leaflet map wrapper with configurable tile provider
│   │       ├── BusMarkerLayer.jsx   # Custom rotating bus markers with radar pulses
│   │       ├── RoutePolylineLayer.jsx # Polyline paths & numbered stop markers
│   │       └── GeofenceLayer.jsx    # Circle / polygon campus perimeters & speed rings
│   ├── context/
│   │   ├── AuthContext.jsx     # Current user, demo role switcher & permission checks
│   │   ├── SettingsContext.jsx # Global tile provider & GPS telemetry settings
│   │   └── ToastContext.jsx    # Floating notification toast queue
│   ├── data/
│   │   └── mockData.js         # Realistic campus bus fleet, routes, stops, and students
│   ├── hooks/
│   │   ├── useFleetSimulation.js # Live GPS telemetry simulator with coordinate drift
│   │   └── useDebounce.js        # Search input debouncer
│   ├── layouts/
│   │   ├── DashboardLayout.jsx # Collapsible navy sidebar + top navigation header
│   │   ├── Header.jsx          # Search, telemetry status, notifications, profile menu
│   │   ├── Sidebar.jsx         # Collapsible sidebar with active badges & tooltips
│   │   └── Breadcrumbs.jsx     # Dynamic path breadcrumbs
│   ├── pages/
│   │   ├── OverviewDashboard.jsx      # 8 KPI cards, Recharts, live heartbeat ticker
│   │   ├── LiveFleetTracking.jsx      # Interactive Leaflet map with filters & diagnostics
│   │   ├── BusManagement.jsx          # Fleet roster, Add/Edit modal, CSV import/export
│   │   ├── DriverManagement.jsx       # Driver roster, licenses, ratings, shift hours
│   │   ├── StudentManagement.jsx      # Students, route assignments, RFID/QR generator
│   │   ├── RouteBuilder.jsx           # Waypoint sequencer, distance & run calculations
│   │   ├── StopsManagement.jsx        # GPS coords, morning/evening arrival windows
│   │   ├── TripMonitoring.jsx         # Real-time scheduled vs actual trips, relief dispatch
│   │   ├── AlertsDelayDetection.jsx   # Over-speeding, route deviations, stale GPS alerts
│   │   ├── GeofenceManagement.jsx     # Campus perimeters, depots, speed limit constraints
│   │   ├── EmergencyConsole.jsx       # Red/amber panic command center, parent SMS broadcast
│   │   ├── QRBoardingAttendance.jsx   # Conductor tablet boarding scanner & scan logs
│   │   ├── MaintenanceTracking.jsx    # Servicing logs, brake/EV checks, next due dates
│   │   ├── ReportsAnalytics.jsx       # On-time trend, peak boarding, fuel benchmarking
│   │   ├── NotificationCenter.jsx     # Advisory dispatcher, student & driver broadcasts
│   │   ├── UserRoleManagement.jsx     # RBAC matrix, admin accounts, permission matrix
│   │   ├── SettingsPage.jsx           # Open-source tile selector, ping intervals, hotline
│   │   ├── AuditLogsPage.jsx          # Immutable action audit trail with origin IPs
│   │   └── LoginPage.jsx              # Session login with role selector
│   ├── routes/
│   │   ├── AppRoutes.jsx       # Central React Router v7 configuration
│   │   └── ProtectedRoute.jsx  # Client-side permission guard & security documentation
│   ├── services/
│   │   ├── api.js              # Central Axios client with mock toggle
│   │   ├── busService.js       # Bus CRUD & location updates
│   │   ├── driverService.js    # Driver management service
│   │   ├── studentService.js   # Student transit roster service
│   │   ├── routeService.js     # Route builder service
│   │   ├── stopService.js      # Stop catalog service
│   │   ├── tripService.js      # Trip schedule & milestone service
│   │   ├── alertService.js     # Alert acknowledgment & incident service
│   │   ├── geofenceService.js  # Geofence boundary service
│   │   ├── emergencyService.js # SOS triggers & broadcast service
│   │   ├── attendanceService.js # Contactless scan service
│   │   ├── maintenanceService.js # Fleet servicing service
│   │   ├── analyticsService.js # Chart metrics service
│   │   ├── userService.js      # User accounts & RBAC service
│   │   ├── auditService.js     # Security audit logging service
│   │   └── settingsService.js  # Map tile & system settings service
│   ├── utils/
│   │   ├── csvUtils.js         # RFC-compliant CSV export & import parser
│   │   ├── formatters.js       # Date, time, delay, and currency formatters
│   │   └── mapUtils.js         # Leaflet DivIcon generators for buses and stops
│   ├── App.jsx
│   ├── index.css               # Tailwind CSS & Leaflet custom radar pulses
│   └── main.jsx
├── index.html
├── package.json
└── vite.config.js
```

---

## 🗺️ Leaflet Map & Tile Providers

The map integration uses **Leaflet** and **React Leaflet** without requiring any paid API keys (such as Google Maps or Mapbox). Users can configure tile providers directly from the **Settings Page**:

1. **OpenStreetMap Standard (Default)**: `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`
2. **CartoDB Positron (Enterprise Clean Light)**: `https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png`
3. **CartoDB Dark Matter (High Contrast Dark)**: `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png`

Legal attribution strings are preserved and automatically displayed in the bottom-right corner of all maps.

---

## 🔌 Connecting to a Live Backend & Live GPS Stream

The UI is decoupled from the data layer via `src/services/api.js`.

### 1. Connecting a REST / Node.js Backend:
In `src/services/api.js`:
1. Change `export const USE_MOCK = true;` to `false`.
2. Configure your environment variable in `.env`:
   ```env
   VITE_API_BASE_URL=https://api.youruniversity.edu/api/v1
   ```
3. Axios automatically attaches `Authorization: Bearer <token>` from `localStorage.getItem("unitrack_token")` on all outgoing requests.

### 2. Ingesting Real GPS Telemetry Streams:
In a live production environment, university buses report telemetry via onboard OBD-II / GPS hardware devices transmitting over MQTT or cellular HTTP/WebSocket.
- **WebSocket / SSE Feed**: Replace the client-side simulator in `src/hooks/useFleetSimulation.js` with a WebSocket listener (`ws.onmessage`) or Socket.io connection (`socket.on('bus:telemetry')`) that calls `busService.updateLocationBatch(data)`.
- **Stale Telemetry Threshold**: A backend cron job checks for buses whose `lastPing` exceeds the configured threshold (e.g. 5 minutes) and fires a `stale_gps` alert into the alerts collection.

---

## 🔒 Security & Permission-Aware Navigation

- **Role Switcher**: Click on your profile in the top-right header to instantaneously switch between **Super Admin**, **Fleet Manager**, **Dispatcher**, **Conductor**, and **Viewer** to evaluate UI permission views.
- **Backend Zero-Trust Note**: Frontend route guards (`ProtectedRoute.jsx`) provide UX-level authorization by hiding and disabling controls. In production, **all security must be strictly validated on the backend API server** by inspecting the verified JWT signature and checking user role scopes against the target endpoint.

---

## 📄 License & Ownership
Created for university transit logistics command centers. Distributed under the MIT License.
