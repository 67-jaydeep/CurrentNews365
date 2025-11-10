const mongoose = require('mongoose');
const crypto = require('crypto');
const bcrypt = require('bcrypt');

const refreshTokenSchema = new mongoose.Schema({
  tokenId: { type: String, required: true },
  ip: String,
  userAgent: String,
  createdAt: { type: Date, default: Date.now },
  revokedAt: Date
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: { type: String, default: 'Admin' },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['admin'], default: 'admin' },
  resetTokenHash: String,
  resetTokenExpire: Date,
  twoFA: { enabled: { type: Boolean, default: false }, secret: String },
  failedLoginAttempts: { type: Number, default: 0 },
  lockedUntil: { type: Date, default: null },
  refreshTokens: { type: [refreshTokenSchema], default: [] },
}, { timestamps: true });

// Hash password helper
userSchema.methods.setPassword = async function (password) {
  this.passwordHash = await bcrypt.hash(password, 12);
};

// Compare password
userSchema.methods.verifyPassword = async function (password) {
  return bcrypt.compare(password, this.passwordHash);
};

// Reset token generator
userSchema.methods.createPasswordResetToken = function () {
  const raw = crypto.randomBytes(24).toString('hex');
  this.resetTokenHash = crypto.createHash('sha256').update(raw).digest('hex');
  this.resetTokenExpire = Date.now() + 60 * 60 * 1000;
  return raw;
};

module.exports = mongoose.model('User', userSchema);
