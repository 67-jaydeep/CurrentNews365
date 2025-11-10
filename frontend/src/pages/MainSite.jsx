// src/pages/MainSite.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Sun, Moon, Menu } from "lucide-react";
import { Helmet, HelmetProvider } from "react-helmet-async";
import api from "../api";

const PAGE_SIZE = 9;

export default function MainSite() {
  const [posts, setPosts] = useState([]);
  const [featured, setFeatured] = useState(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [activeCat, setActiveCat] = useState("all");
  const [page, setPage] = useState(1);
  const [dark, setDark] = useState(document.documentElement.classList.contains("dark"));
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // ✅ Fetch posts + most viewed featured post
  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const [resPosts, resSummary] = await Promise.all([
          api.get("/"),
          api.get("/auth/summary"),
        ]);

        const items = Array.isArray(resPosts.data) ? resPosts.data : [];
        setPosts(items);
        let featuredPost = null;
        const top = resSummary?.data?.topPost;

        // If we have a title match in our fetched posts list
        if (top && top.title) {
          featuredPost =
            items.find((p) => p.title === top.title) ||
            items.find((p) => (p.category || "").toLowerCase() === (top.category || "").toLowerCase()) ||
            null;
        }

        // Fallback: first published post
        setFeatured(featuredPost || items.find((p) => p.status === "published") || items[0] || null);
      } catch (err) {
        console.error("Error fetching posts:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // ✅ Build categories
  const categories = useMemo(() => {
    const map = new Map();
    posts.forEach((p) => {
      const c = p.category || "Uncategorized";
      map.set(c, (map.get(c) || 0) + 1);
    });
    return [{ name: "All", key: "all", count: posts.length }, ...Array.from(map.entries()).map(([name, count]) => ({ name, key: name, count }))];
  }, [posts]);

  // ✅ Smart search — matches title, tags, category, metaTitle, metaDescription
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    let arr = posts.filter((p) => p.status === "published" || !p.status);
    if (activeCat !== "all") arr = arr.filter((p) => (p.category || "Uncategorized") === activeCat);
    if (s) {
      arr = arr.filter((p) => {
        const fields = [
          p.title || "",
          p.excerpt || "",
          p.category || "",
          p.metaTitle || "",
          p.metaDescription || "",
          (p.tags || []).join(", "),
        ].join(" ").toLowerCase();
        return fields.includes(s);
      });
    }
    return arr;
  }, [posts, q, activeCat]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [totalPages]);
  const visible = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  // Theme toggle
  const toggleTheme = () => {
    const isDark = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", isDark);
    setDark(isDark);
    localStorage.setItem("theme", isDark ? "dark" : "light");
  };

  // ✅ SEO data (dynamic from featured)
  const siteTitle = "TheLatestNews";
  const siteDesc =
    featured?.metaDescription ||
    featured?.excerpt ||
    "TheLatestNews — latest finance news, analysis and market updates.";
  const canonical = window.location.origin + window.location.pathname;

  // ✅ Clean SEO-safe JSON-LD
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${window.location.origin}#website`,
        url: window.location.origin,
        name: siteTitle,
        description: siteDesc || "",
      },
      {
        "@type": "NewsArticle",
        headline: featured?.title || siteTitle,
        description: siteDesc || "",
        image: featured?.heroImage?.url || "",
        datePublished: featured?.createdAt
          ? new Date(featured.createdAt).toISOString()
          : new Date().toISOString(),
        dateModified: featured?.updatedAt
          ? new Date(featured.updatedAt).toISOString()
          : new Date().toISOString(),
        url: `${window.location.origin}/${featured?.slug || ""}`,
        author: { "@type": "Organization", name: siteTitle },
        publisher: {
          "@type": "Organization",
          name: siteTitle,
          logo: {
            "@type": "ImageObject",
            url: `${window.location.origin}/logo.png`,
          },
        },
      },
      {
        "@type": "ItemList",
        itemListElement: (visible || [])
          .filter(Boolean)
          .slice(0, 10)
          .map((p, i) => ({
            "@type": "ListItem",
            position: i + 1,
            url: `${window.location.origin}/${p.slug || ""}`,
            name: p.title || "",
          })),
      },
    ].filter(Boolean),
  };

  return (
    <HelmetProvider>
      <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        {/* --- SEO --- */}
        <Helmet>
          <title>{featured?.metaTitle || `${siteTitle} — Latest finance news`}</title>
          <meta name="description" content={siteDesc} />
          <meta name="last-modified" content={featured?.updatedAt || new Date().toISOString()} />
          <link rel="canonical" href={canonical} />
          <meta property="og:type" content="website" />
          <meta property="og:title" content={featured?.metaTitle || siteTitle} />
          <meta property="og:description" content={siteDesc} />
          <meta property="og:url" content={canonical} />
          <script type="application/ld+json"dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}/>
        </Helmet>

        {/* ===== NAVBAR ===== */}
        <header className="sticky top-0 z-40 bg-white/70 dark:bg-gray-800/70 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center flex-1">
                <Link to="/" className="text-xl font-bold tracking-tight mr-6 text-[var(--accent-color)]">
                  {siteTitle}
                </Link>

              </div>

              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-full px-3 py-1 shadow-sm">
                  <Search className="w-4 h-4 text-gray-400" />
                  <input
                    value={q}
                    onChange={(e) => {
                      setQ(e.target.value);
                      setPage(1);
                    }}
                    placeholder="Search posts, tags..."
                    className="ml-2 w-44 bg-transparent outline-none text-sm placeholder-gray-400"
                  />
                </div>

                <button
                  onClick={toggleTheme}
                  aria-label="toggle theme"
                  className="p-2 rounded-full transition hover:scale-95 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                >
                  {dark ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4 text-gray-700" />}
                </button>

                <button
                  onClick={() => setMobileMenuOpen((s) => !s)}
                  className="sm:hidden p-2 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                >
                  <Menu className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {mobileMenuOpen && (
            <div className="sm:hidden border-t border-gray-100 dark:border-gray-800 bg-white/60 dark:bg-gray-800/60 backdrop-blur">
              <div className="px-4 py-3 flex gap-2 overflow-x-auto">
                {categories.map((c) => (
                  <button
                    key={c.key}
                    onClick={() => {
                      setActiveCat(c.key === "all" ? "all" : c.name);
                      setMobileMenuOpen(false);
                    }}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition whitespace-nowrap ${
                      activeCat === (c.key === "all" ? "all" : c.name)
                        ? "bg-[var(--accent-color)] text-white"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200"
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </header>

        {/* ===== MAIN CONTENT ===== */}
        <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* HERO FEATURED POST */}
          {featured && (
            <motion.section
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="relative rounded-2xl overflow-hidden shadow-lg mb-8"
              aria-labelledby="featured-title"
            >
              <Link to={`/${featured.slug || ""}`} className="block">
                <div className="relative h-64 sm:h-80 md:h-96 w-full">
                  {featured.heroImage?.url ? (
                    <img
                      src={featured.heroImage.url}
                      alt={featured.heroImage.alt || featured.title}
                      className="absolute inset-0 w-full h-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-gradient-start)] to-[var(--accent-gradient-end)]" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  <div className="absolute inset-0 flex items-end p-6 md:p-10">
                    <div className="max-w-2xl">
                      <div className="inline-flex items-center gap-2 mb-2">
                        <span className="bg-[var(--accent-color)]/90 text-white text-xs px-2 py-1 rounded-full">
                          {featured.category || "News"}
                        </span>
                        <span className="text-xs text-white/80">
                          {new Date(featured.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <h1
                        id="featured-title"
                        className="text-2xl md:text-4xl font-extrabold text-white leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]"
                      >
                        {featured.title}
                      </h1>
                      <p className="mt-3 text-sm text-white/90 hidden md:block line-clamp-2">
                        {featured.excerpt}
                      </p>
                      <div className="mt-4">
                        <Link
                          to={`/${featured.slug || ""}`}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium shadow-md bg-gradient-to-r from-[var(--accent-gradient-start)] to-[var(--accent-gradient-end)] text-white"
                        >
                          Read Story
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.section>
          )}

          {/* Category strip */}
          <section className="mb-6">
            <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
              {categories.map((c) => (
                <button
                  key={c.key}
                  onClick={() => {
                    setActiveCat(c.key === "all" ? "all" : c.name);
                    setPage(1);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className={`flex-shrink-0 px-3 py-1 rounded-full text-sm font-medium transition ${
                    activeCat === (c.key === "all" ? "all" : c.name)
                      ? "bg-gradient-to-r from-[var(--accent-gradient-start)] to-[var(--accent-gradient-end)] text-white shadow-sm"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:opacity-95"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </section>

          {/* Grid + Pagination */}
          <section>
            {loading ? (
              <div className="py-20 text-center text-gray-600 dark:text-gray-300">
                Loading latest posts…
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-20 text-center text-gray-600 dark:text-gray-300">
                No posts found.
              </div>
            ) : (
              <>
                <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {visible.map((p) => (
                    <motion.article
                      key={p._id}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.35 }}
                      className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700"
                    >
                      <Link to={`/${p.slug || ""}`} className="block">
                        <div className="h-44 w-full overflow-hidden">
                          {p.heroImage?.url ? (
                            <img
                              src={p.heroImage.url}
                              alt={p.heroImage.alt || p.title}
                              className="w-full h-full object-cover transform transition-transform duration-300 hover:scale-105"
                              loading="lazy"
                              decoding="async"
                            />
                          ) : (
                            <div className="h-full w-full bg-gray-200 dark:bg-gray-700" />
                          )}
                        </div>

                        <div className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-[var(--accent-color)] font-semibold">
                              {p.category || "News"}
                            </span>
                            <time className="text-xs text-gray-400">
                              {new Date(p.createdAt).toLocaleDateString()}
                            </time>
                          </div>
                          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 line-clamp-2">
                            {p.title}
                          </h3>
                          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                            {p.excerpt}
                          </p>
                          <div className="mt-4 flex items-center justify-between">
                            <span className="text-sm text-[var(--accent-color)] font-medium">
                              Read →
                            </span>
                            <div className="text-sm text-gray-400">
                              {(p.tags || []).slice(0, 2).join(", ")}
                            </div>
                          </div>
                        </div>
                      </Link>
                    </motion.article>
                  ))}
                </motion.div>

                <div className="mt-8 flex justify-center items-center gap-3">
                  <button
                    onClick={() => setPage((s) => Math.max(1, s - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                  >
                    Prev
                  </button>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    Page {page} / {totalPages}
                  </div>
                  <button
                    onClick={() => setPage((s) => Math.min(totalPages, s + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1 rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                  >
                    Next
                  </button>
                </div>
              </>
            )}
          </section>
        </main>

        {/* FOOTER */}
        <footer className="border-t border-gray-100 dark:border-gray-800 py-8 text-center text-sm text-gray-600 dark:text-gray-400 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-4 flex-col md:flex-row">
              <div>TheLatestNews © {new Date().getFullYear()}</div>
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
          </div>
        </footer>

        <style>{`
          .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
          .hide-scrollbar::-webkit-scrollbar { display: none; }
          a:focus, button:focus, input:focus {
            outline: 3px solid color-mix(in srgb, var(--accent-color) 30%, transparent);
            outline-offset: 2px;
          }
        `}</style>
      </div>
    </HelmetProvider>
  );
}
