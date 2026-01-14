// backend/routes/media.js
const express = require("express");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");
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

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "currentnews365",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    public_id: (req, file) =>
      Date.now() + "-" + file.originalname.replace(/\s+/g, "_"),
  },
});


const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

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

      const fileUrl = req.file.path;
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
