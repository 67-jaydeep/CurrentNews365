// server.js (CommonJS) — Secure Express app with httpOnly refresh cookie flow
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const csurf = require('csurf');
const routes = require('./routes');
const fs = require('fs');

// 🧩 NEW: import model + bcrypt for admin creation
const bcrypt = require('bcrypt');
const { User } = require('./models');

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/blogapp';
const FRONTEND_ORIGIN = process.env.FRONTEND_URL || 'http://localhost:5173';
const NODE_ENV = process.env.NODE_ENV || 'development';

// ------------------ Basic sanity checks ------------------
if (!process.env.JWT_SECRET) {
  console.warn('⚠️  WARNING: JWT_SECRET not set. Set a long random string in .env for production.');
}

// ------------------ Connect to MongoDB ------------------
(async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ MongoDB connected');

    await createDefaultAdmin();
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
})();

// ------------------ Auto-admin creation ------------------
async function createDefaultAdmin() {
  try {
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASS;
    if (!email || !password) {
      console.warn('⚠️  ADMIN_EMAIL or ADMIN_PASS missing in .env; skipping admin seed');
      return;
    }

    const existing = await User.findOne({ email });
    if (existing) {
      console.log(`✅ Default admin already exists: ${email}`);
      return;
    }

    const hash = await bcrypt.hash(password, 12);
    await User.create({
      name: 'Default Admin',
      email,
      passwordHash: hash,
      role: 'admin'
    });

    console.log('🎉 Default admin created successfully');
    console.log('👉 Email:', email);
    console.log('🔑 Password:', password);
  } catch (err) {
    console.error('❌ Error creating default admin:', err.message);
  }
}

// ------------------ App & Security Middlewares ------------------
const app = express();
app.use(cookieParser());

// ✅ FIX: move body parsers *before* mounting routes
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

app.use(cors({
  origin: FRONTEND_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token']
}));

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", 'https:'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https:'],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", FRONTEND_ORIGIN, 'https:'],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

if (NODE_ENV === 'production') {
  app.use(helmet.hsts({ maxAge: 31536000, includeSubDomains: true, preload: true }));
}

app.use(compression());

// ✅ NEW: Serve uploaded media files
const path = require("path");
app.use(
  "/uploads",
  (req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", FRONTEND_ORIGIN);
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    res.setHeader("Cross-Origin-Embedder-Policy", "unsafe-none");
    next();
  },
  express.static(path.join(__dirname, "uploads"))
);

// ------------------ Rate Limiting ------------------
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  skip: (req) => {
    const p = req.path || req.originalUrl || '';
    return p === '/api/auth/refresh' || p.startsWith('/api/auth/refresh');
  },
  standardHeaders: true,
  legacyHeaders: false
});
app.use(generalLimiter);

const createLoginLimiter = () => rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 30,
  message: { msg: 'Too many login attempts. Try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

const csrfProtection = csurf({
  cookie: {
    httpOnly: true,
    secure: NODE_ENV === 'production',
    sameSite: 'lax'
  }
});

const refreshCookieOpts = {
  httpOnly: true,
  secure: NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/api/auth/refresh'
};

app.use((req, res, next) => {
  const now = new Date().toISOString();
  console.log(`[${now}] ${req.method} ${req.originalUrl} ip=${req.ip}`);
  next();
});

app.get('/healthz', (req, res) => res.json({ ok: true }));

app.get('/api/csrf-token', csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

app.locals.refreshCookieOpts = refreshCookieOpts;
app.locals.createLoginLimiter = createLoginLimiter;
app.locals.csrfProtection = csrfProtection;

// ✅ Mount routes *after* all middleware
app.use('/api', require('./routes/media'));
app.use('/api', routes);

app.use((req, res) => res.status(404).json({ msg: 'Not found' }));

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack || err);
  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).json({ msg: 'Invalid CSRF token' });
  }
  const status = err.status || 500;
  const message =
    NODE_ENV === 'production' ? 'Internal server error' : (err.message || 'Internal server error');
  res.status(status).json({ msg: message });
});

// 🕒 Auto-publish scheduled posts every minute
const { Post } = require("./models");
setInterval(async () => {
  try {
    const now = new Date();
    const duePosts = await Post.find({
      status: "scheduled",
      scheduledFor: { $lte: now },
    });
    for (const post of duePosts) {
      post.status = "published";
      post.scheduledFor = null;
      await post.save();
      console.log(`✅ Auto-published scheduled post: ${post.title}`);
    }
  } catch (err) {
    console.error("Scheduler error:", err.message);
  }
}, 60 * 1000);

const listEndpoints = require('express-list-endpoints');
console.log("📍 Listing endpoints after mount...");
console.table(listEndpoints(app));

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} (NODE_ENV=${NODE_ENV})`);
  console.log(`🔒 Frontend origin allowed: ${FRONTEND_ORIGIN}`);
});
