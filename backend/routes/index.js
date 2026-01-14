const express = require('express');
const router = express.Router();

console.log("🧭 index.js loaded");

try {
  router.use('/auth', require('./auth'));
  console.log("✅ auth routes loaded");
} catch (err) {
  console.error("❌ auth route error:", err);
}

try {
  router.use('/', require('./post'));
  console.log("✅ post routes loaded");
} catch (err) {
  console.error("❌ post route error:", err);
}


module.exports = router;
