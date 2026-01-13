// server.js
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
const seoRoutes = require("./routes/seo");
const bcrypt = require('bcrypt');
const { User } = require('./models');

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/blogapp';
const FRONTEND_ORIGIN = process.env.FRONTEND_URL || 'http://localhost:5173';
const NODE_ENV = process.env.NODE_ENV || 'development';

//Basic sanity checks
if (!process.env.JWT_SECRET) {
  console.warn('⚠️  WARNING: JWT_SECRET not set. Set a long random string in .env for production.');
}

//Connect to MongoDB
(async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB connected');

    await createDefaultAdmin();
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
})();

//Auto-admin creation
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
  } catch (err) {
    console.error('❌ Error creating default admin:', err.message);
  }
}

//App & Security Middlewares
const app = express();
app.set("trust proxy", 1);
app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

const allowedOrigins = [
  "http://localhost:5173",
  "https://currentnews365.com",
  "https://www.currentnews365.com",
  "https://current-news365.vercel.app",
  "https://current-news365-sadhujaydeeps-projects.vercel.app"
];

app.use(cors({
  origin: function (origin, callback) {
    // allow Postman / server calls
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  },
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
      connectSrc: [
          "'self'",
          "https://currentnews365.com",
          "https://www.currentnews365.com",
          "https://current-news365.vercel.app",
          "https://current-news365-sadhujaydeeps-projects.vercel.app",
          "https://currentnews365-backend.onrender.com"
        ],
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

//Serve uploaded media files
const path = require("path");
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

app.use(
  "/uploads",
  (req, res, next) => {
    const origin = req.headers.origin;

    const allowedOrigins = [
      "http://localhost:5173",
      "https://currentnews365.com",
      "https://www.currentnews365.com",
      "https://current-news365.vercel.app",
      "https://current-news365-sadhujaydeeps-projects.vercel.app"
    ];

    if (allowedOrigins.includes(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Credentials", "true");
    }

    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    res.setHeader("Cross-Origin-Embedder-Policy", "unsafe-none");
    next();
  },
  express.static(path.join(__dirname, "uploads"))
);

//Rate Limiting
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
    sameSite: NODE_ENV === 'production' ? 'none' : 'lax'
  }
});

const refreshCookieOpts = {
  httpOnly: true,
  secure: NODE_ENV === 'production',
  sameSite: NODE_ENV === 'production' ? 'none' : 'lax',
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

//Enhanced Security Block

const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const morgan = require('morgan');
const permissionsPolicy = require('permissions-policy');

app.use(morgan('combined'));
app.use((req, res, next) => {
  try {
    const q = req.query;
    if (q && typeof q === 'object') {
      const cloned = Object.fromEntries(Object.entries(q));
      Object.defineProperty(req, 'query', {
        value: cloned,
        writable: true,
        enumerable: true,
        configurable: true,
      });
    }
  } catch (err) {
    console.warn('Query immutability patch skipped:', err.message);
  }
  next();
});

//Safe sanitization
app.use((req, res, next) => {
  try {
    require('express-mongo-sanitize')()(req, res, next);
  } catch (err) {
    console.warn('mongo-sanitize skipped due to query error:', err.message);
    next();
  }
});
app.use(require('xss-clean')());

//Enforce HTTPS in production
if (NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect(`https://${req.headers.host}${req.url}`);
    }
    next();
  });
}

//Extend Helmet with additional security headers
app.use(helmet.noSniff());
app.use(helmet.referrerPolicy({ policy: 'strict-origin-when-cross-origin' }));
app.use(
  permissionsPolicy({
    features: {
      geolocation: ['none'],
      camera: ['none'],
      microphone: ['none'],
      fullscreen: ['self'],
    },
  })
);

//Cache & cross-origin hardening
app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
  res.setHeader("Cross-Origin-Resource-Policy", "same-origin");
  res.setHeader("Cross-Origin-Embedder-Policy", "unsafe-none");
  next();
});

//End Enhanced Security Block
app.use('/api', require('./routes/media'));
app.use('/api', routes);
app.use("/", seoRoutes);
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

//Auto-publish scheduled posts every minute
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
