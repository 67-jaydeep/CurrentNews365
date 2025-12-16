const express = require("express");
const router = express.Router();
const Post = require("../models/Post");

/**
 * ============================
 * SITEMAP.XML
 * ============================
 */
router.get("/sitemap.xml", async (req, res) => {
  try {
    const posts = await Post.find({ status: "published" })
      .select("slug updatedAt")
      .sort({ updatedAt: -1 });

    const baseUrl = "https://currentnews365.com";

    let xml = `<?xml version="1.0" encoding="UTF-8"?>`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

    // Homepage
    xml += `
      <url>
        <loc>${baseUrl}/</loc>
        <changefreq>hourly</changefreq>
        <priority>1.0</priority>
      </url>
    `;

    // Static pages
    const staticPages = [
      "about",
      "contact",
      "editorial-policy",
      "privacy",
      "terms"
    ];

    staticPages.forEach((page) => {
      xml += `
        <url>
          <loc>${baseUrl}/${page}</loc>
          <changefreq>monthly</changefreq>
          <priority>0.6</priority>
        </url>
      `;
    });

    // Articles
    posts.forEach((post) => {
      xml += `
        <url>
          <loc>${baseUrl}/${post.slug}</loc>
          <lastmod>${post.updatedAt.toISOString()}</lastmod>
          <changefreq>daily</changefreq>
          <priority>0.8</priority>
        </url>
      `;
    });

    xml += `</urlset>`;

    res.header("Content-Type", "application/xml");
    res.send(xml);
  } catch (err) {
    console.error("Sitemap error:", err);
    res.status(500).send("Unable to generate sitemap");
  }
});

/**
 * ============================
 * RSS.XML
 * ============================
 */
router.get("/rss.xml", async (req, res) => {
  try {
    const posts = await Post.find({ status: "published" })
      .sort({ createdAt: -1 })
      .limit(20);

    const baseUrl = "https://currentnews365.com";

    let rss = `<?xml version="1.0" encoding="UTF-8"?>`;
    rss += `
      <rss version="2.0">
        <channel>
          <title>CurrentNews365</title>
          <link>${baseUrl}</link>
          <description>Latest breaking news and updates from CurrentNews365</description>
          <language>en-IN</language>
          <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    `;

    posts.forEach((post) => {
      rss += `
        <item>
          <title><![CDATA[${post.title}]]></title>
          <link>${baseUrl}/${post.slug}</link>
          <guid>${baseUrl}/${post.slug}</guid>
          <pubDate>${new Date(post.createdAt).toUTCString()}</pubDate>
          <description><![CDATA[${post.excerpt || ""}]]></description>
        </item>
      `;
    });

    rss += `
        </channel>
      </rss>
    `;

    res.header("Content-Type", "application/rss+xml");
    res.send(rss);
  } catch (err) {
    console.error("RSS error:", err);
    res.status(500).send("Unable to generate RSS");
  }
});

module.exports = router;
