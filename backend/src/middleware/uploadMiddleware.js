const multer = require("multer");

// Use memory storage so we get Buffer directly to stream/upload to Supabase Storage
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Allow common images and documents (photos, inspection reports, CSV student rosters)
  const allowedMimeTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/svg+xml",
    "application/pdf",
    "text/csv",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ];

  if (allowedMimeTypes.includes(file.mimetype) || file.originalname.endsWith(".csv")) {
    cb(null, true);
  } else {
    cb(new Error("Unsupported file format. Please upload an image, PDF, or CSV file."));
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB limit per file
  },
  fileFilter,
});

module.exports = upload;
