// backend/models/Post.js
const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, index: true, trim: true },
    excerpt: { type: String, trim: true },
    content: { type: String, required: true },
    heroImage: {
      url: { type: String, trim: true },
      alt: { type: String, trim: true },
    },
    category: { type: String, trim: true },
    subCategory: { type: String, trim: true },
    tags: [{ type: String, trim: true }],
    keywords: [{ type: String, trim: true }],
    relatedTickers: [{ type: String, trim: true }],
    source: { type: String, trim: true },
    referenceLinks: [{ type: String, trim: true }],
    status: {
      type: String,
      enum: ["draft", "scheduled", "published"],
      default: "draft",
    },
    scheduledFor: { type: Date, default: null },
    views: { type: Number, default: 0 },
    viewLogs: [
    {
      date: { type: Date },
      count: { type: Number, default: 0 },
    },
  ],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // 🆕 SEO Fields
    metaTitle: { type: String, trim: true },
    metaDescription: { type: String, trim: true },
  },
  { timestamps: true }
);

// Auto-generate excerpt
postSchema.pre("save", function (next) {
  if (!this.excerpt && this.content) {
    const plain = this.content.replace(/<[^>]*>?/gm, "");
    this.excerpt = plain.substring(0, 180) + (plain.length > 180 ? "..." : "");
  }
  next();
});

module.exports = mongoose.model("Post", postSchema);
