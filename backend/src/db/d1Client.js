const path = require("path");
const fs = require("fs");
const config = require("../config/config");

class D1Client {
  constructor() {
    this.accountId = config.cloudflare.accountId;
    this.databaseId = config.cloudflare.databaseId;
    this.apiToken = config.cloudflare.apiToken;
    this.localDb = null;

    this.init();
  }

  isCloudflareConfigured() {
    return Boolean(
      this.accountId &&
      this.databaseId &&
      this.apiToken &&
      !this.accountId.includes("your_") &&
      !this.databaseId.includes("your_") &&
      !this.apiToken.includes("your_")
    );
  }

  init() {
    if (this.isCloudflareConfigured()) {
      console.log(`[Database] Connected to Remote Cloudflare D1 Database (${this.databaseId.substring(0, 8)}...)`);
    } else {
      console.log("[Database] Cloudflare D1 credentials not provided. Using local SQLite database (node:sqlite)...");
      try {
        const { DatabaseSync } = require("node:sqlite");
        const dataDir = path.resolve(__dirname, "../../data");
        if (!fs.existsSync(dataDir)) {
          fs.mkdirSync(dataDir, { recursive: true });
        }
        const dbPath = path.join(dataDir, "unitrack.db");
        this.localDb = new DatabaseSync(dbPath);
        console.log(`[Database] Local SQLite initialized at: ${dbPath}`);
        try {
          this.localDb.exec("ALTER TABLE routes ADD COLUMN streetsTraversed TEXT;");
        } catch (_) {}
        try {
          this.localDb.exec("ALTER TABLE routes ADD COLUMN outAndBack INTEGER DEFAULT 1;");
        } catch (_) {}
      } catch (err) {
        console.error("[Database] Failed to initialize local SQLite database:", err);
      }
    }

    setTimeout(() => this.ensureSchema(), 1500);
  }

  async ensureSchema() {
    try {
      await this.execute("ALTER TABLE routes ADD COLUMN streetsTraversed TEXT");
    } catch (_) {}
    try {
      await this.execute("ALTER TABLE routes ADD COLUMN outAndBack INTEGER DEFAULT 1");
    } catch (_) {}
  }

  /**
   * Execute raw query on Cloudflare D1 REST API
   */
  async _queryCloudflareD1(sql, params = []) {
    const url = `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/d1/database/${this.databaseId}/query`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sql, params }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      const errorMsg = data.errors?.map((e) => e.message).join(", ") || res.statusText || "D1 Query Failed";
      throw new Error(`Cloudflare D1 Error: ${errorMsg}`);
    }

    const firstResult = data.result?.[0] || {};
    return {
      results: firstResult.results || [],
      meta: firstResult.meta || {},
    };
  }

  /**
   * Run a SELECT query and return rows
   */
  async query(sql, params = []) {
    if (this.isCloudflareConfigured()) {
      const { results } = await this._queryCloudflareD1(sql, params);
      return results;
    }

    if (this.localDb) {
      try {
        const stmt = this.localDb.prepare(sql);
        return stmt.all(...params);
      } catch (err) {
        throw new Error(`Local SQLite Query Error: ${err.message}`);
      }
    }

    throw new Error("No database connection available.");
  }

  /**
   * Run a SELECT query and return first row or null
   */
  async queryFirst(sql, params = []) {
    const rows = await this.query(sql, params);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Run an INSERT / UPDATE / DELETE statement
   */
  async execute(sql, params = []) {
    if (this.isCloudflareConfigured()) {
      const { meta } = await this._queryCloudflareD1(sql, params);
      return {
        changes: meta.changes || 0,
        lastInsertRowid: meta.last_row_id || null,
      };
    }

    if (this.localDb) {
      try {
        const stmt = this.localDb.prepare(sql);
        const result = stmt.run(...params);
        return {
          changes: result.changes,
          lastInsertRowid: result.lastInsertRowid,
        };
      } catch (err) {
        throw new Error(`Local SQLite Execute Error: ${err.message}`);
      }
    }

    throw new Error("No database connection available.");
  }

  /**
   * Run multi-statement SQL script (DDL / migrations)
   */
  async exec(sqlStatements) {
    if (this.isCloudflareConfigured()) {
      // Split statements or run directly
      const url = `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/d1/database/${this.databaseId}/query`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sql: sqlStatements }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        const errorMsg = data.errors?.map((e) => e.message).join(", ") || res.statusText;
        throw new Error(`Cloudflare D1 Exec Error: ${errorMsg}`);
      }
      return data.result;
    }

    if (this.localDb) {
      try {
        this.localDb.exec(sqlStatements);
        return;
      } catch (err) {
        throw new Error(`Local SQLite Exec Error: ${err.message}`);
      }
    }

    throw new Error("No database connection available.");
  }
}

const db = new D1Client();
module.exports = db;
