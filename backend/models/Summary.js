const mongoose = require("mongoose");

const summarySchema = new mongoose.Schema({
  date: { type: String, unique: true }, // e.g., "2025-11-06"
  views: { type: Number, default: 0 },
  postsCreated: { type: Number, default: 0 },
  topPostSlug: { type: String, default: null },
});

module.exports = mongoose.model("Summary", summarySchema);
