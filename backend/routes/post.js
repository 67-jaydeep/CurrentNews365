// backend/routes/post.js
const express = require("express");
const jwt = require("jsonwebtoken");
const sanitizeHtml = require("sanitize-html");
const { body, validationResult } = require("express-validator");
const Post = require("../models/Post");
const Summary = require("../models/Summary"); // optional
const Audit = require("../models/Audit"); // optional

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "replace-me";

function today() {
  return new Date().toISOString().split("T")[0];
}


function auth(req, res, next) {
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

// CREATE
router.post(
  "/admin/posts",
  auth,
  body("title").isString().notEmpty(),
  body("content").isString().notEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const baseSlug = (req.body.slug || req.body.title).toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      let slug = baseSlug;
      let counter = 1;
      while (await Post.findOne({ slug })) slug = `${baseSlug}-${counter++}`;

      const clean = sanitizeHtml(req.body.content || "", {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img", "table", "thead", "tbody", "tr", "td", "th", "iframe"]),
        allowedAttributes: {
          ...sanitizeHtml.defaults.allowedAttributes,
          iframe: ["src", "width", "height", "frameborder", "allow", "allowfullscreen"],
          img: ["src", "alt", "style", "width", "height"],
        },
      });

      const post = await Post.create({
        title: req.body.title,
        slug,
        content: clean,
        excerpt: req.body.excerpt || undefined,
        heroImage: req.body.heroImage || {},
        category: req.body.category || "finance-news",
        subCategory: req.body.subCategory || "stocks",
        source: req.body.source || "",
        referenceLinks: req.body.referenceLinks || [],
        tags: req.body.tags || [],
        keywords: req.body.keywords || [],
        relatedTickers: req.body.relatedTickers || [],
        status: req.body.status || "draft",
        scheduledFor: req.body.scheduledFor || null,
        createdBy: req.user.id,
      });

      if (Summary) await Summary.findOneAndUpdate({ date: today() }, { $inc: { postsCreated: 1 } }, { upsert: true });
      if (Audit) await Audit.create({ action: "create_post", userId: req.user.id, targetId: post._id });

      res.status(201).json(post);
    } catch (err) {
      console.error("Create Post Error:", err);
      res.status(500).json({ msg: "Failed to create post" });
    }
  }
);

// GET all admin posts
router.get("/admin/posts", auth, async (req, res) => {
  const posts = await Post.find().sort({ createdAt: -1 });
  res.json(posts);
});

// UPDATE
router.put("/admin/posts/:id", auth, async (req, res) => {
  try {
    const clean = sanitizeHtml(req.body.content || "", {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img", "table", "thead", "tbody", "tr", "td", "th", "iframe"]),
      allowedAttributes: {
        ...sanitizeHtml.defaults.allowedAttributes,
        iframe: ["src", "width", "height", "frameborder", "allow", "allowfullscreen"],
        img: ["src", "alt", "style", "width", "height"],
      },
    });

    const updated = await Post.findByIdAndUpdate(req.params.id, { ...req.body, content: clean }, { new: true });
    if (Audit) await Audit.create({ action: "update_post", userId: req.user.id, targetId: updated._id });
    res.json(updated);
  } catch (err) {
    console.error("Update Post Error:", err);
    res.status(500).json({ msg: "Failed to update" });
  }
});

// DELETE
router.delete("/admin/posts/:id", auth, async (req, res) => {
  await Post.findByIdAndDelete(req.params.id);
  if (Audit) await Audit.create({ action: "delete_post", userId: req.user.id, targetId: req.params.id });
  res.json({ msg: "Deleted successfully" });
});

// PUBLIC list with optional filters
router.get("/", async (req, res) => {
  const { category, tag, page = 1, limit = 10 } = req.query;
  const query = { status: "published" };
  if (category) query.category = category;
  if (tag) query.tags = tag;
  const posts = await Post.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit));
  res.json(posts);
});

// PUBLIC single by slug
// routes/post.js
const viewTimestamps = new Map(); // in-memory cache per IP/slugs

router.get("/:slug", async (req, res) => {
  const ip = req.ip;
  const key = `${ip}_${req.params.slug}`;
  const now = Date.now();

  // if same IP views same post within 3 seconds, ignore
  if (viewTimestamps.has(key) && now - viewTimestamps.get(key) < 3000) {
    return res.json(await Post.findOne({ slug: req.params.slug }));
  }

  viewTimestamps.set(key, now);

  const post = await Post.findOneAndUpdate(
    { slug: req.params.slug },
    { $inc: { views: 1 } },
    { new: true }
  );

  if (!post) return res.status(404).json({ msg: "Not found" });
  if (Summary)
    await Summary.findOneAndUpdate(
      { date: today() },
      { $inc: { views: 1 }, $set: { topPostSlug: post.slug } },
      { upsert: true }
    );

  res.json(post);
});



module.exports = router;
