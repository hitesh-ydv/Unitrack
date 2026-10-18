const fs = require("fs");
const path = require("path");
const db = require("./d1Client");

async function initDb() {
  console.log("[DB Init] Starting database schema initialization...");
  const schemaPath = path.resolve(__dirname, "../../schema.sql");
  const schemaSql = fs.readFileSync(schemaPath, "utf8");

  // Filter out SQL comments and split into individual statements
  const statements = schemaSql
    .replace(/--.*$/gm, "")
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const statement of statements) {
    try {
      await db.exec(statement);
    } catch (err) {
      console.error(`[DB Init] Failed executing statement:\n${statement.substring(0, 60)}...\nError: ${err.message}`);
      throw err;
    }
  }

  console.log(`[DB Init] Successfully processed ${statements.length} schema statements.`);
}

if (require.main === module) {
  initDb()
    .then(() => {
      console.log("[DB Init] Database schema initialization complete.");
      process.exit(0);
    })
    .catch((err) => {
      console.error("[DB Init] Database schema initialization failed:", err);
      process.exit(1);
    });
}

module.exports = initDb;
