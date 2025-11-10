import React, { useEffect, useState, useMemo } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Helmet, HelmetProvider } from "react-helmet-async";
import { ArrowLeft, Eye, Clock, Share2, Copy, Linkedin, Twitter } from "lucide-react";
import api from "../api";

export default function PostDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [post, setPost] = useState(null);
  const [related, setRelated] = useState([]);
  const [views, setViews] = useState(0);
  const [loading, setLoading] = useState(true);
  const siteTitle = "TheLatestNews";

  // Fetch post + related
useEffect(() => {
  const fetchPost = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/${slug}`);
      setPost(res.data);

      // ✅ Correctly set this post’s real view count
      setViews(res.data.views || 0);

      // Fetch related posts
      if (res.data?.category) {
        const relatedRes = await api.get(`/?category=${res.data.category}`);
        const relatedPosts = (relatedRes.data || []).filter(
          (p) => p.slug !== slug
        );
        setRelated(relatedPosts.slice(0, 3));
      }
    } catch (err) {
      console.error("❌ Failed to fetch post:", err);
    } finally {
      setLoading(false);
    }
  };
  fetchPost();
}, [slug]);


  const readTime = useMemo(() => {
    if (!post?.content) return 2;
    const words = post.content.split(/\s+/).length;
    return Math.ceil(words / 200);
  }, [post]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500 dark:text-gray-300">
        Loading post...
      </div>
    );

  if (!post)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-gray-600 dark:text-gray-300">
        <p>Post not found.</p>
        <button
          onClick={() => navigate("/")}
          className="mt-4 px-4 py-2 bg-[var(--accent-color)] text-white rounded-lg shadow-md"
        >
          Back to Home
        </button>
      </div>
    );

  // ✅ SEO setup
  const canonical = `${window.location.origin}/${post.slug}`;
  const metaTitle = post.metaTitle || post.title;
  const metaDescription = post.metaDescription || post.excerpt || post.title;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: metaTitle,
    description: metaDescription,
    image: post.heroImage?.url || "",
    datePublished: post.createdAt,
    dateModified: post.updatedAt || post.createdAt,
    author: { "@type": "Organization", name: siteTitle },
    publisher: { "@type": "Organization", name: siteTitle },
    mainEntityOfPage: canonical,
  };

  const handleShare = (type) => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(post.title);
    if (type === "twitter")
      window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, "_blank");
    if (type === "linkedin")
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, "_blank");
    if (type === "copy") navigator.clipboard.writeText(window.location.href);
  };

  return (
    <HelmetProvider>
      <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        {/* --- SEO --- */}
        <Helmet>
          <title>{metaTitle}</title>
          <meta name="description" content={metaDescription} />
          <link rel="canonical" href={canonical} />
          <meta property="og:type" content="article" />
          <meta property="og:title" content={metaTitle} />
          <meta property="og:description" content={metaDescription} />
          {post.heroImage?.url && (
            <meta property="og:image" content={post.heroImage.url} />
          )}
          <script type="application/ld+json">
            {JSON.stringify(jsonLd)}
          </script>
        </Helmet>

        {/* --- NAVBAR --- */}
        <header className="sticky top-0 z-40 bg-white/70 dark:bg-gray-800/70 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
            <Link
              to="/"
              className="text-xl font-bold tracking-tight text-[var(--accent-color)]"
            >
              {siteTitle}
            </Link>
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-full text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          </div>
        </header>

        {/* --- MAIN ARTICLE --- */}
        <main className="flex-grow max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {/* Meta info (no category) */}
          <div className="mb-3 flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400">
            <span>{new Date(post.createdAt).toLocaleDateString()}</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" /> {readTime} min read
            </span>
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" /> {views.toLocaleString()} views
            </span>
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-extrabold mb-3 leading-tight">
            {post.title}
          </h1>

          {/* Author Info */}
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            By <span className="font-medium text-gray-700 dark:text-gray-200">FinScope Editorial Team</span>
          </div>

          {/* Article content */}
          <article
            className="prose dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Tags */}
          {post.tags?.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <Link
                  key={tag}
                  to={`/?tag=${encodeURIComponent(tag)}`}
                  className="text-xs bg-[var(--accent-color)]/10 text-[var(--accent-color)] px-3 py-1 rounded-full hover:bg-[var(--accent-color)] hover:text-white transition"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          )}

          {/* Share Bar */}
          <div className="mt-6 flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
            <Share2 className="w-4 h-4" />
            <span>Share:</span>
            <button onClick={() => handleShare("twitter")} aria-label="Share on Twitter">
              <Twitter className="w-4 h-4 hover:text-sky-500" />
            </button>
            <button onClick={() => handleShare("linkedin")} aria-label="Share on LinkedIn">
              <Linkedin className="w-4 h-4 hover:text-blue-600" />
            </button>
            <button onClick={() => handleShare("copy")} aria-label="Copy link">
              <Copy className="w-4 h-4 hover:text-green-600" />
            </button>
          </div>

          {/* Related Posts */}
          {related.length > 0 ? (
            <section className="mt-12 mb-16">
              <h2 className="text-xl font-semibold mb-4">You may also like</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {related.map((p) => (
                  <motion.article
                    key={p._id}
                    whileHover={{ scale: 1.02 }}
                    className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden transition"
                  >
                    <Link to={`/${p.slug}`} className="block">
                      {p.heroImage?.url ? (
                        <img
                          src={p.heroImage.url}
                          alt={p.heroImage.alt || p.title}
                          className="w-full h-36 object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="h-36 bg-gray-200 dark:bg-gray-700" />
                      )}
                      <div className="p-4">
                        <h3 className="text-md font-semibold text-gray-800 dark:text-gray-100 line-clamp-2">
                          {p.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mt-1">
                          {p.excerpt}
                        </p>
                        <span className="inline-block mt-2 text-[var(--accent-color)] text-sm font-medium">
                          Read →
                        </span>
                      </div>
                    </Link>
                  </motion.article>
                ))}
              </div>
            </section>
          ) : (
            <div className="h-20 sm:h-32"></div>
          )}
        </main>

        {/* --- FOOTER --- */}
        <footer className="mt-auto border-t border-gray-100 dark:border-gray-800 py-8 text-center text-sm text-gray-600 dark:text-gray-400">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 flex-col md:flex-row">
            <div>{siteTitle} © {new Date().getFullYear()}</div>
            <div className="flex gap-4">
              <a href="/rss.xml" className="hover:underline">RSS</a>
              <a href="/sitemap.xml" className="hover:underline">Sitemap</a>
              <a href="/about" className="hover:underline">About</a>
            </div>
          </div>
        </footer>

        <style>{`
          .prose img { border-radius: 0.75rem; margin: 1rem 0; }
          .prose h2 { color: var(--accent-color); margin-top: 2rem; }
          .prose a { color: var(--accent-color); text-decoration: underline; }
        `}</style>
      </div>
    </HelmetProvider>
  );
}
