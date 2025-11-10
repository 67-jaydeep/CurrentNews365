const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const { User, Audit } = require('../models');
const Post = require('../models/Post');
const Summary = require('../models/Summary');  // ✅ Added for summary stats
const router = express.Router();

// ✅ ADD THIS BLOCK (CORS FIX)
const cors = require('cors');
const FRONTEND_ORIGIN = process.env.FRONTEND_URL || 'http://localhost:5173';
router.use(
  cors({
    origin: FRONTEND_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  })
);
// ✅ END FIX

const JWT_SECRET = process.env.JWT_SECRET;
const REFRESH_EXP =
  parseInt(process.env.REFRESH_TOKEN_EXPIRES_DAYS || '7') * 86400000;

function signAccessToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, {
    expiresIn: '15m',
  });
}
function signRefreshToken(user, tokenId) {
  return jwt.sign({ id: user._id, tokenId }, JWT_SECRET, { expiresIn: '7d' });
}

// --- LOGIN ---
router.post(
  '/login',
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  async (req, res) => {
    const { email, password } = req.body;
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'Invalid credentials' });

    if (user.lockedUntil && user.lockedUntil > Date.now()) {
      return res.status(403).json({ msg: 'Account locked. Try later.' });
    }

    const valid = await user.verifyPassword(password);
    if (!valid) {
      user.failedLoginAttempts++;
      if (user.failedLoginAttempts >= 5) {
        user.lockedUntil = new Date(Date.now() + 10 * 60 * 1000);
      }
      await user.save();
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    user.failedLoginAttempts = 0;
    user.lockedUntil = null;

    const tokenId = crypto.randomBytes(16).toString('hex');
    const refresh = signRefreshToken(user, tokenId);
    user.refreshTokens.push({
      tokenId,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
    await user.save();

    const access = signAccessToken(user);

    res.cookie('refreshToken', refresh, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: REFRESH_EXP,
    });

    await Audit.create({
      userId: user._id,
      userEmail: user.email,
      action: 'login',
      ip: req.ip,
    });

    res.json({
      accessToken: access,
      user: { id: user._id, name: user.name, email: user.email },
    });
  }
);

// --- REFRESH ---
router.post('/refresh', async (req, res) => {
  const cookie = req.cookies.refreshToken;
  if (!cookie) return res.status(401).json({ msg: 'Missing refresh token' });
  try {
    const payload = jwt.verify(cookie, JWT_SECRET);
    const user = await User.findById(payload.id);
    const valid =
      user &&
      user.refreshTokens.find(
        (t) => t.tokenId === payload.tokenId && !t.revokedAt
      );
    if (!valid) return res.status(401).json({ msg: 'Invalid refresh token' });

    const newTokenId = crypto.randomBytes(16).toString('hex');
    const newRefresh = signRefreshToken(user, newTokenId);
    valid.revokedAt = new Date();
    user.refreshTokens.push({
      tokenId: newTokenId,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
    await user.save();

    const access = signAccessToken(user);
    res.cookie('refreshToken', newRefresh, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: REFRESH_EXP,
    });
    res.json({ accessToken: access });
  } catch (e) {
    res.status(401).json({ msg: 'Expired or invalid refresh token' });
  }
});

// --- LOGOUT ---
router.post('/logout', async (req, res) => {
  const cookie = req.cookies.refreshToken;
  if (cookie) {
    try {
      const payload = jwt.verify(cookie, JWT_SECRET);
      const user = await User.findById(payload.id);
      if (user) {
        const token = user.refreshTokens.find(
          (t) => t.tokenId === payload.tokenId
        );
        if (token) token.revokedAt = new Date();
        await user.save();
      }
    } catch {}
  }
  res.clearCookie('refreshToken');
  res.json({ msg: 'Logged out' });
});

// --- PASSWORD RESET REQUEST ---
router.post('/request-password-reset', body('email').isEmail(), async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(200).json({ msg: 'If exists, an email will be sent' });
  const token = user.createPasswordResetToken();
  await user.save();
  res.json({ msg: 'Reset link created', token });
});

// --- RESET PASSWORD ---
router.post(
  '/reset-password',
  body('email').isEmail(),
  body('token').isString(),
  body('password').isLength({ min: 6 }),
  async (req, res) => {
    const { email, token, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'Invalid token' });

    const hash = crypto.createHash('sha256').update(token).digest('hex');
    if (user.resetTokenHash !== hash || user.resetTokenExpire < Date.now()) {
      return res.status(400).json({ msg: 'Expired or invalid token' });
    }

    await user.setPassword(password);
    user.resetTokenHash = undefined;
    user.resetTokenExpire = undefined;
    user.refreshTokens = [];
    await user.save();

    await Audit.create({
      userId: user._id,
      userEmail: user.email,
      action: 'password_reset',
      ip: req.ip,
    });

    res.json({ msg: 'Password reset successful' });
  }
);

router.get('/me', async (req, res) => {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ msg: 'No token' });

  const token = header.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-passwordHash');
    if (!user) return res.status(404).json({ msg: 'User not found' });
    res.json({ user });
  } catch {
    res.status(401).json({ msg: 'Invalid token' });
  }
});

// --- 🧮 DASHBOARD SUMMARY ---
// <-- add at top if not already

router.get('/summary', async (req, res) => {
  try {
    const now = new Date();

    // === BASIC COUNTS ===
    const total = await Post.countDocuments();
    const published = await Post.countDocuments({ status: 'published' });
    const drafts = await Post.countDocuments({ status: 'draft' });
    const scheduled = await Post.countDocuments({ status: 'scheduled' });

    // === TOP POST ===
    const topPost = await Post.findOne()
      .sort({ views: -1 })
      .select('title views category');

    // === TOTAL VIEWS TODAY (SUM OF ALL POSTS) ===
    const todayViewsAgg = await Post.aggregate([
      { $group: { _id: null, totalViews: { $sum: '$views' } } },
    ]);
    const today = { views: todayViewsAgg[0]?.totalViews || 0 };

    // === CATEGORIES BREAKDOWN ===
    const categories = await Post.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $project: { _id: 0, name: '$_id', count: 1 } },
      { $sort: { count: -1 } },
    ]);

    // === REAL LAST 7 DAYS VIEWS ===
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateKey = d.toISOString().split('T')[0];
      const summary = await Summary.findOne({ date: dateKey });
      last7Days.push({
        day: d.toLocaleDateString('en-US', { weekday: 'short' }),
        views: summary?.views || 0,
      });
    }

    res.json({
      total,
      published,
      drafts,
      scheduled,
      today,
      topPost,
      last7Days,
      categories,
    });
  } catch (err) {
    console.error('Error in /auth/summary:', err);
    res.status(500).json({ msg: 'Failed to load summary' });
  }
});
router.get("/notifications", async (req, res) => {
  try {
    const { Audit, Post, User } = require("../models");

    // Fetch latest 15 audit logs
    const logs = await Audit.find({})
      .sort({ createdAt: -1 })
      .limit(15)
      .lean();

    // Map into formatted notifications
    const notifications = await Promise.all(
      logs.map(async (log) => {
        let message = "";
        let type = "info";

        switch (log.action) {
          case "create_post":
            type = "success";
            message = "A new post was created.";
            break;
          case "update_post":
            type = "info";
            message = "A post was updated.";
            break;
          case "delete_post":
            type = "alert";
            message = "A post was deleted.";
            break;
          case "login":
            type = "info";
            message = `${log.userEmail || "Admin"} logged in.`;
            break;
          default:
            message = log.action.replace(/_/g, " ");
        }

        // try to fetch post title if exists
        if (log.targetId) {
          const post = await Post.findById(log.targetId).select("title").lean();
          if (post?.title) message += ` (${post.title})`;
        }

        return {
          id: log._id,
          type,
          message,
          time: new Date(log.createdAt).toLocaleString(),
        };
      })
    );

    res.json(notifications);
  } catch (err) {
    console.error("Error fetching notifications:", err);
    res.status(500).json({ msg: "Failed to fetch notifications" });
  }
});
module.exports = router;
