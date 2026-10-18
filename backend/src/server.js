const app = require("./app");
const config = require("./config/config");
const initDb = require("./db/initDb");
const db = require("./db/d1Client");
const storage = require("./storage/supabaseStorage");

async function startServer() {
  try {
    // Ensure DB schema exists
    await initDb();

    const server = app.listen(config.port, () => {
      console.log(`
=============================================================
  🚌 UniTrack Fleet Telematics Backend Running!
=============================================================
  🌐 URL:          http://localhost:${config.port}
  📡 API Base:     http://localhost:${config.port}/api
  🩺 Health Check: http://localhost:${config.port}/api/health

  🗄️  Database:     ${db.isCloudflareConfigured() ? "☁️ Cloudflare D1 (SQLite Cloud)" : "📁 Local SQLite fallback (Ready for Cloudflare credentials)"}
  ☁️  Storage:      ${storage.isConfigured() ? `⚡ Supabase Storage (Bucket: ${storage.bucketName})` : "📁 Local disk fallback (Ready for Supabase credentials)"}
=============================================================
`);
    });

    // Graceful Shutdown
    const shutdown = () => {
      console.log("\n[Server] Shutting down gracefully...");
      server.close(() => {
        console.log("[Server] Closed remaining connections.");
        process.exit(0);
      });
    };

    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);
  } catch (err) {
    console.error("[Server] Fatal startup error:", err);
    process.exit(1);
  }
}

startServer();
