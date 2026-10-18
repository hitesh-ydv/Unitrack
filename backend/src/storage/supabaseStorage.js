const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");
const config = require("../config/config");

class SupabaseStorageService {
  constructor() {
    this.url = config.supabase.url;
    this.key = config.supabase.key;
    this.bucketName = config.supabase.bucket || "unitrack";
    this.supabase = null;

    this.init();
  }

  isConfigured() {
    return Boolean(
      this.url &&
      this.key &&
      !this.url.includes("your-project") &&
      !this.key.includes("your_supabase")
    );
  }

  init() {
    if (this.isConfigured()) {
      try {
        this.supabase = createClient(this.url, this.key);
        console.log(`[Storage] Supabase client initialized for bucket: '${this.bucketName}'`);
      } catch (err) {
        console.error("[Storage] Failed to initialize Supabase client:", err.message);
      }
    } else {
      console.log("[Storage] Supabase credentials not provided. Using local disk uploads fallback (/uploads)...");
    }
  }

  /**
   * Upload a file buffer to Supabase Storage (or local disk fallback)
   * @param {Buffer} buffer - File buffer
   * @param {string} originalName - Original filename
   * @param {string} mimeType - File MIME type
   * @param {string} folder - Destination folder (e.g., 'avatars', 'students', 'docs')
   * @returns {Promise<{ url: string, path: string, provider: string }>}
   */
  async uploadFile(buffer, originalName, mimeType, folder = "general") {
    const timestamp = Date.now();
    const cleanName = originalName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const fileName = `${folder}/${timestamp}-${cleanName}`;

    if (this.isConfigured() && this.supabase) {
      try {
        const { data, error } = await this.supabase.storage
          .from(this.bucketName)
          .upload(fileName, buffer, {
            contentType: mimeType,
            upsert: true,
          });

        if (error) {
          throw error;
        }

        const { data: publicData } = this.supabase.storage
          .from(this.bucketName)
          .getPublicUrl(data.path);

        return {
          success: true,
          url: publicData.publicUrl,
          path: data.path,
          provider: "supabase",
        };
      } catch (err) {
        console.error(`[Storage] Supabase upload failed: ${err.message}. Falling back to local disk.`);
      }
    }

    // Local Disk Fallback
    const uploadDir = path.resolve(__dirname, `../../uploads/${folder}`);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const localFileName = `${timestamp}-${cleanName}`;
    const filePath = path.join(uploadDir, localFileName);
    fs.writeFileSync(filePath, buffer);

    const relativeUrl = `/uploads/${folder}/${localFileName}`;
    return {
      success: true,
      url: relativeUrl,
      path: filePath,
      provider: "local",
    };
  }

  /**
   * Delete a file from Supabase Storage
   * @param {string} filePath - Path in the bucket
   */
  async deleteFile(filePath) {
    if (this.isConfigured() && this.supabase) {
      const { error } = await this.supabase.storage
        .from(this.bucketName)
        .remove([filePath]);

      if (error) {
        console.error(`[Storage] Failed to delete file ${filePath}:`, error.message);
        return false;
      }
      return true;
    }

    // Local file removal
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  }
}

const storage = new SupabaseStorageService();
module.exports = storage;
