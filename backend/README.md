# UniTrack Backend API

High-performance Node.js / Express backend tailored for the **UniTrack Admin** fleet & transit command center. Powered by **Cloudflare D1 (SQLite)** and **Supabase Storage (1 GB Free Tier)**.

---

## 🚀 Key Features

- **Cloudflare D1 SQLite Database**: Uses Cloudflare D1 REST API for cloud SQLite storage with zero operational overhead, and automatically falls back to local SQLite (`node:sqlite`) for offline development.
- **Supabase Storage Bucket**: Integrated file storage for student photos, driver license documents, vehicle inspection reports, and roster CSVs.
- **Full Admin Endpoints**: Complete CRUD, batch operations, real-time telemetry simulation hooks, attendance verification, emergency dispatch, and analytics.
- **Robust Architecture**: JWT authentication, role-based access control, file upload filtering, and centralized error handling matching the `admin` API client.

---

## 📁 Project Architecture

```
backend/
├── .env.example            # Environment variables template
├── .env                    # Active environment configuration
├── package.json            # Scripts & dependencies
├── schema.sql              # Cloudflare D1 SQLite Schema (16 tables)
├── src/
│   ├── config/             # Environment configuration
│   ├── db/
│   │   ├── d1Client.js     # Universal Cloudflare D1 / SQLite client
│   │   ├── initDb.js       # DDL table creation migration
│   │   └── seedDb.js       # Seeds mock data matching admin panel
│   ├── storage/
│   │   └── supabaseStorage.js # Supabase bucket upload / delete handler
│   ├── middleware/
│   │   ├── authMiddleware.js  # JWT verification & role authorization
│   │   ├── errorHandler.js    # Standardized response error formatter
│   │   └── uploadMiddleware.js# Multer memory storage & MIME filtering
│   ├── routes/             # All modular Express routes matching admin services
│   ├── app.js              # Express app definition
│   └── server.js           # Server listener on port 5000
└── README.md
```

---

## 🔑 Environment Variables & Credentials Setup

Copy `.env.example` to `.env` (or edit the existing `.env`):

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# Server
PORT=5000
NODE_ENV=development
JWT_SECRET=your_jwt_secret_key

# 1. Cloudflare D1 SQLite Database
CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id
CLOUDFLARE_DATABASE_ID=your_d1_database_uuid
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token

# 2. Supabase Storage (1 GB Free Tier)
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your_supabase_anon_or_service_role_key
SUPABASE_BUCKET=unitrack
```

### Where to get Cloudflare D1 credentials:
1. Log in to your [Cloudflare Dashboard](https://dash.cloudflare.com).
2. Go to **Workers & Pages** -> **D1 SQL Database** -> Create database (e.g. `unitrack-db`).
3. Note your **Account ID** and **Database ID** (UUID).
4. Go to **My Profile** -> **API Tokens** -> **Create Token** with `D1 Edit` permissions to obtain your **API Token**.

### Where to get Supabase Storage credentials:
1. Log in to [Supabase](https://supabase.com) and create a project.
2. Go to **Storage** -> **New Bucket** -> Name it `unitrack` (set Public if desired).
3. Go to **Project Settings** -> **API** to copy:
   - **Project URL** (`SUPABASE_URL`)
   - **anon / public** or **service_role** key (`SUPABASE_KEY`)

> 💡 **Seamless Fallback**: If you run without filling credentials, the backend automatically uses built-in local SQLite (`node:sqlite`) and local disk storage (`uploads/`). Once you paste your credentials into `.env`, it immediately switches to live Cloudflare D1 and Supabase Storage!

---

## 🛠️ Installation & Quickstart

```bash
# 1. Install dependencies
npm install

# 2. Initialize database schema
npm run db:init

# 3. Seed mock data matching the admin UI
npm run db:seed

# 4. Start backend server
npm start
# or development with auto-reload:
npm run dev
```

The server will be live at: `http://localhost:5000`

---

## 🔌 Connecting to Admin Frontend

In `admin/src/services/api.js`:
1. Change `export const USE_MOCK = true;` to `export const USE_MOCK = false;`.
2. Ensure `API_BASE_URL` points to `http://localhost:5000/api` (the default).

---

## 📡 API Endpoints Overview

| Category | Endpoint | Method | Description |
|---|---|---|---|
| **Health** | `/api/health` | GET | System status & DB / Storage connectivity |
| **Auth** | `/api/auth/login` | POST | Sign in with email, password, role |
| **Auth** | `/api/auth/register` | POST | Register new user profile |
| **Auth** | `/api/auth/me` | GET | Get authenticated user info |
| **Buses** | `/api/buses` | GET, POST | List all buses / Create new bus |
| **Buses** | `/api/buses/:id` | GET, PUT, DELETE | Bus detail, update, delete |
| **Buses** | `/api/buses/batch-location` | POST | Real-time GPS coordinates batch update |
| **Drivers** | `/api/drivers` | GET, POST | List all drivers / Create new driver |
| **Drivers** | `/api/drivers/:id` | GET, PUT, DELETE | Driver detail, update, delete |
| **Students** | `/api/students` | GET, POST | List students / Create student |
| **Students** | `/api/students/:id` | GET, PUT, DELETE | Student detail, update, delete |
| **Students** | `/api/students/batch` | POST | Bulk import students from CSV |
| **Routes** | `/api/routes` | GET, POST | List routes with waypoints / Create |
| **Routes** | `/api/routes/:id` | GET, PUT, DELETE | Route detail, update, delete |
| **Stops** | `/api/stops` | GET, POST | List stops / Create stop |
| **Stops** | `/api/stops/:id` | GET, PUT, DELETE | Stop detail, update, delete |
| **Trips** | `/api/trips` | GET, POST | List trips / Create trip |
| **Trips** | `/api/trips/:id/status` | PATCH | Update trip status and delay |
| **Geofences** | `/api/geofences` | GET, POST, PUT, DELETE | Campus and speed perimeter zones |
| **Alerts** | `/api/alerts` | GET, POST | Telematics alerts & speed breaches |
| **Alerts** | `/api/alerts/:id/acknowledge`| POST | Acknowledge alert |
| **Alerts** | `/api/alerts/:id/resolve`| POST | Resolve alert |
| **Users** | `/api/users` | GET, POST, PUT, DELETE | Admin user management |
| **Users** | `/api/users/roles` | GET | Roles and permissions definitions |
| **Notifications** | `/api/notifications` | GET, POST | In-app notification center |
| **Settings** | `/api/settings` | GET, PUT | Transit system configurations |
| **Storage** | `/api/upload` | POST | Upload file to Supabase Storage bucket |
