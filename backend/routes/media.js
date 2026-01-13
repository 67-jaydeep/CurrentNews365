// backend/routes/media.js
const express = require("express");
const multer = require("multer");
const path = require("path");
const Media = require("../models/Media");
const jwt = require("jsonwebtoken");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "replace-me";

function auth(req, res, next) {
  if (req.method === "OPTIONS") return next(); 

  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ msg: "No token" });
  try {
    const token = header.split(" ")[1];
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ msg: "Invalid token" });
  }
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

const allowed = ["image/jpeg", "image/png", "image/webp", "video/mp4", "application/pdf"];
const fileFilter = (req, file, cb) => {
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Invalid file type"));
};

const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 }, fileFilter });

router.post(
  "/admin/uploads",
  auth,
  (req, res, next) => {
    upload.single("file")(req, res, (err) => {
      if (err instanceof multer.MulterError) return res.status(400).json({ msg: err.message });
      if (err) return res.status(400).json({ msg: err.message });
      next();
    });
  },
  async (req, res) => {
    if (!req.file) return res.status(400).json({ msg: "No file uploaded" });
    try {
      const backendUrl = process.env.BACKEND_URL || "https://currentnews365-backend.onrender.com";  
      const fileUrl = `${backendUrl}/uploads/${req.file.filename}`;
      const media = await Media.create({
        filename: req.file.filename,
        url: fileUrl,
        mimetype: req.file.mimetype,
        size: req.file.size,
        uploadedBy: req.user.id,
        associatedPost: req.body.postId || null,
      });
      res.json({ msg: "Upload successful", url: fileUrl, media });
    } catch (err) {
      console.error("Upload error:", err);
      res.status(500).json({ msg: "Upload failed" });
    }
  }
);

// list media (admin)
router.get("/admin/media", auth, async (req, res) => {
  const list = await Media.find({ uploadedBy: req.user.id }).sort({ createdAt: -1 }).limit(200);
  res.json(list);
});

module.exports = router;
