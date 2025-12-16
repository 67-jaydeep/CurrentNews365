import React, { useEffect, useState, useMemo } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Helmet, HelmetProvider } from "react-helmet-async";
import {
  ArrowLeft,
  Eye,
  Clock,
  Share2,
  Copy,
  Linkedin,
  Twitter,
} from "lucide-react";
import api from "../api";

export default function PostDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [post, setPost] = useState(null);
  const [related, setRelated] = useState([]);
  const [views, setViews] = useState(0);
  const [loading, setLoading] = useState(true);
  const siteTitle = "CurrentNews365";

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

  // ✅ Share Handler Updated
  const handleShare = (type) => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(post.title);
    const image = encodeURIComponent(post.heroImage?.url || "");
    if (type === "twitter")
      window.open(
        `https://twitter.com/intent/tweet?url=${url}&text=${text}`,
        "_blank"
      );
    if (type === "linkedin")
      window.open(
        `https://www.linkedin.com/shareArticle?mini=true&url=${url}&title=${text}&summary=${metaDescription}&source=${siteTitle}`,
        "_blank"
      );
    if (type === "facebook")
      window.open(
        `https://www.facebook.com/sharer/sharer.php?u=${url}`,
        "_blank"
      );
    if (type === "whatsapp")
      window.open(`https://wa.me/?text=${text}%20${url}`, "_blank");
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

  {/* --- Open Graph Meta Tags --- */}
  <meta property="og:type" content="article" />
  <meta property="og:title" content={metaTitle} />
  <meta property="og:description" content={metaDescription} />
  {post.heroImage?.url && (
    <>
      <meta property="og:image" content={post.heroImage.url} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="twitter:image" content={post.heroImage.url} />
    </>
  )}

  {/* --- Twitter Card --- */}
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={metaTitle} />
  <meta name="twitter:description" content={metaDescription} />
  {post.heroImage?.url && (
    <meta name="twitter:image" content={post.heroImage.url} />
  )}

  {/* --- Schema.org JSON-LD --- */}
  <script type="application/ld+json">
    {JSON.stringify(jsonLd)}
  </script>
</Helmet>

        {/* --- NAVBAR --- */}
        <header className="sticky top-0 z-40 bg-white/70 dark:bg-gray-800/70 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
          <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
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
          <div className="mb-3 flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400">
            <span>{new Date(post.createdAt).toLocaleDateString()}</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" /> {readTime} min read
            </span>
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" /> {views.toLocaleString()} views
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold mb-3 leading-tight">
            {post.title}
          </h1>

          {/* ✅ Author Info Updated */}
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            By{" "}
            <span className="font-medium text-gray-700 dark:text-gray-200">
              CurrentNews365
            </span>
          </div>

          <article
            className="prose dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
          {(post.source || (post.referenceLinks && post.referenceLinks.length > 0)) && (
  <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-4 text-sm text-gray-600 dark:text-gray-400 space-y-2">
    {post.source && (
      <p>
        <strong>Source:</strong> {post.source}
      </p>
    )}

    {post.referenceLinks && post.referenceLinks.length > 0 && (
      <div>
        <strong>References:</strong>
        <ul className="list-disc list-inside mt-1 space-y-1">
          {post.referenceLinks.map((link, i) => (
            <li key={i}>
              <a
                href={link}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="text-[var(--accent-color)] hover:underline break-all"
              >
                {link}
              </a>
            </li>
          ))}
        </ul>
      </div>
    )}
  </div>
)}
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

          {/* ✅ Updated Share Bar */}
          <div className="mt-6 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-800 pt-4">
  <strong>Disclaimer:</strong> This article is based on publicly available
  information and independent editorial analysis. References to third-party
  sources, if any, are used solely for informational purposes.
</div>
          <div className="mt-6 flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
            
            <Share2 className="w-4 h-4" />
            <span>Share:</span>
            <button
              onClick={() => handleShare("twitter")}
              aria-label="Share on Twitter"
            >
              <Twitter className="w-4 h-4 hover:text-sky-500" />
            </button>
            <button
              onClick={() => handleShare("linkedin")}
              aria-label="Share on LinkedIn"
            >
              <Linkedin className="w-4 h-4 hover:text-blue-600" />
            </button>
            <button
              onClick={() => handleShare("facebook")}
              aria-label="Share on Facebook"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4 hover:text-blue-500"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M22 12.07C22 6.48 17.52 2 11.93 2S1.86 6.48 1.86 12.07c0 5.05 3.66 9.23 8.44 9.93v-7.03H7.9v-2.9h2.4V9.41c0-2.37 1.42-3.68 3.58-3.68 1.04 0 2.12.19 2.12.19v2.34h-1.2c-1.18 0-1.55.73-1.55 1.47v1.76h2.64l-.42 2.9h-2.22V22c4.78-.7 8.44-4.88 8.44-9.93z" />
              </svg>
            </button>
            <button
              onClick={() => handleShare("whatsapp")}
              aria-label="Share on WhatsApp"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4 hover:text-green-500"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M20.52 3.48A11.89 11.89 0 0012.05 0C5.42 0 .11 5.31.11 11.89c0 2.09.55 4.11 1.6 5.91L0 24l6.38-1.65a11.8 11.8 0 005.67 1.46h.01c6.63 0 11.94-5.31 11.94-11.89 0-3.18-1.25-6.17-3.48-8.44zM12.06 21.2a9.5 9.5 0 01-4.83-1.33l-.35-.21-3.78.98 1.01-3.67-.23-.38a9.4 9.4 0 01-1.46-5.08c0-5.22 4.26-9.47 9.5-9.47 2.54 0 4.93.99 6.72 2.78a9.44 9.44 0 012.78 6.69c0 5.22-4.26 9.47-9.48 9.47zm5.52-7.2c-.3-.15-1.78-.88-2.06-.98-.28-.1-.48-.15-.67.15-.2.3-.77.98-.94 1.18-.17.2-.35.22-.65.07-.3-.15-1.25-.46-2.38-1.47-.88-.79-1.47-1.76-1.64-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.38-.02-.53-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.5h-.57c-.2 0-.53.07-.8.38-.27.3-1.05 1.02-1.05 2.47s1.08 2.87 1.24 3.06c.15.2 2.13 3.23 5.15 4.53.72.31 1.28.49 1.72.63.72.23 1.38.2 1.9.12.58-.09 1.78-.73 2.03-1.44.25-.71.25-1.32.17-1.44-.07-.13-.27-.2-.57-.35z" />
              </svg>
            </button>
            <button
              onClick={() => handleShare("copy")}
              aria-label="Copy link"
            >
              <Copy className="w-4 h-4 hover:text-green-600" />
            </button>
          </div>

          {/* Related Posts Section — untouched */}
          {related.length > 0 ? (
            <section className="mt-12 mb-16">
              <h2 className="text-xl font-semibold mb-4">
                You may also like
              </h2>
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
            <div>
              {siteTitle} © {new Date().getFullYear()}
            </div>
            <div className="flex gap-4">
              <a href="/rss.xml" className="hover:underline">
                RSS
              </a>
              <a href="/sitemap.xml" className="hover:underline">
                Sitemap
              </a>
              <a href="/about" className="hover:underline">
                About
              </a>
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
