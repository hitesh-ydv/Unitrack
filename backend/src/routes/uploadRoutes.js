const express = require("express");
const router = express.Router();
const upload = require("../middleware/uploadMiddleware");
const storage = require("../storage/supabaseStorage");

// POST /api/upload - Single file upload to Supabase Storage bucket
router.post("/", upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file provided. Field 'file' is required." });
    }

    const folder = req.body.folder || req.query.folder || "general";
    const result = await storage.uploadFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      folder
    );

    res.status(201).json({
      success: true,
      url: result.url,
      path: result.path,
      provider: result.provider,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/upload/multiple - Multiple files upload to Supabase Storage bucket
router.post("/multiple", upload.array("files", 10), async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files provided. Field 'files' is required." });
    }

    const folder = req.body.folder || req.query.folder || "general";
    const uploadPromises = req.files.map((file) =>
      storage.uploadFile(file.buffer, file.originalname, file.mimetype, folder).then((res) => ({
        url: res.url,
        path: res.path,
        provider: res.provider,
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
      }))
    );

    const uploadedFiles = await Promise.all(uploadPromises);

    res.status(201).json({
      success: true,
      files: uploadedFiles,
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/upload - Delete file from Supabase Storage bucket
router.delete("/", async (req, res, next) => {
  try {
    const { path: filePath } = req.body;
    if (!filePath) {
      return res.status(400).json({ message: "Field 'path' is required to delete a file." });
    }

    const success = await storage.deleteFile(filePath);
    res.json({ success, path: filePath });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
