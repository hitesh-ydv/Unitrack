require("dotenv").config();

module.exports = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || "development",
  jwtSecret: process.env.JWT_SECRET || "unitrack_super_secret_jwt_key_2026",

  // Cloudflare D1
  cloudflare: {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID || "",
    databaseId: process.env.CLOUDFLARE_DATABASE_ID || "",
    apiToken: process.env.CLOUDFLARE_API_TOKEN || "",
  },

  // Supabase Storage
  supabase: {
    url: process.env.SUPABASE_URL || "",
    key: process.env.SUPABASE_KEY || "",
    bucket: process.env.SUPABASE_BUCKET || "unitrack",
  },
};
