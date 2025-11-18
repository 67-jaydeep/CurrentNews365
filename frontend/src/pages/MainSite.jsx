// src/pages/MainSite.jsx
import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Sun,
  Moon,
  X,
  TrendingUp,
  Megaphone,
  Menu,
} from "lucide-react";
import { Helmet, HelmetProvider } from "react-helmet-async";
import api from "../api";

const PAGE_SIZE = 9;
const SLIDE_INTERVAL = 5000; // ms

// --- Utility: format category (remove hyphens and Title Case)
const formatCategory = (name = "") =>
  String(name)
    .replace(/-/g, " ")
    .split(" ")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : ""))
    .join(" ");

export default function MainSite() {
  // --- core state ---
  const [posts, setPosts] = useState([]);
  const [featured, setFeatured] = useState(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [activeCat, setActiveCat] = useState("all");
  const [page, setPage] = useState(1);
  const [dark, setDark] = useState(
    typeof document !== "undefined" && document.documentElement.classList.contains("dark")
  );
  const [showSearch, setShowSearch] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // slider state (Top Stories Hero Slider)
  const [slideIndex, setSlideIndex] = useState(0);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const [resPosts, resSummary] = await Promise.all([api.get("/"), api.get("/auth/summary")]);

        const items = Array.isArray(resPosts.data) ? resPosts.data : [];
        setPosts(items);

        // prefer summary topPost match in items -> fallback to first published or first item
        let featuredPost = null;
        const top = resSummary?.data?.topPost;
        if (top && top.title) {
          featuredPost =
            items.find((p) => p.title === top.title) ||
            items.find(
              (p) => (p.category || "").toLowerCase() === (top.category || "").toLowerCase()
            ) ||
            null;
        }
        setFeatured(featuredPost || items.find((p) => p.status === "published") || items[0] || null);
      } catch (err) {
        console.error("Error fetching posts:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // --- derived lists ---
  const categories = useMemo(() => {
    const map = new Map();
    posts.forEach((p) => {
      const c = p.category || "Uncategorized";
      map.set(c, (map.get(c) || 0) + 1);
    });
    return [{ name: "All", key: "all", count: posts.length }].concat(
      Array.from(map.entries()).map(([name, count]) => ({ name, key: name, count }))
    );
  }, [posts]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    let arr = posts.filter((p) => p.status === "published" || !p.status);
    if (activeCat !== "all") arr = arr.filter((p) => (p.category || "Uncategorized") === activeCat);
    if (s) {
      const words = s.split(/\s+/).filter(Boolean);
      arr = arr.filter((p) => {
        const fields = [
          p.title || "",
          p.excerpt || "",
          p.category || "",
          p.metaTitle || "",
          p.metaDescription || "",
          (p.tags || []).join(" "),
        ]
          .join(" ")
          .toLowerCase();
        return words.every((w) => fields.includes(w));
      });
    }
    return arr;
  }, [posts, q, activeCat]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [totalPages]);
  const visible = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  const latestPosts = useMemo(() => {
    return [...posts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [posts]);

  const popularPosts = useMemo(() => {
    return [...posts].sort((a, b) => (b.views || 0) - (a.views || 0));
  }, [posts]);

  // --- slider autoplay ---
  useEffect(() => {
    if (!posts || posts.length === 0) return;
    const slides = getSliderItems();
    setSlideIndex(0);
    const id = setInterval(() => {
      setSlideIndex((s) => (s + 1) % Math.max(1, slides.length));
    }, SLIDE_INTERVAL);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [posts, featured]);

  const getSliderItems = useCallback(() => {
    const items = [];
    if (featured) items.push(featured);
    const rest = popularPosts.filter((p) => p._id !== featured?._id).slice(0, 4);
    return items.concat(rest);
  }, [featured, popularPosts]);

  // --- theme toggle ---
  const toggleTheme = () => {
    const isDark = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", isDark);
    setDark(isDark);
    localStorage.setItem("theme", isDark ? "dark" : "light");
  };

  // ------------------------
  // Memoized Desktop SearchBar
  // ------------------------
  const DesktopSearchBar = React.memo(function DesktopSearchBar({ value, onChange, onClear }) {
    const inputRef = useRef(null);

    // stop propagation on mousedown so parent clicks (like closing mobile menu) don't steal focus
    const handleMouseDown = (e) => {
      e.stopPropagation();
    };

    return (
      <div
        onMouseDown={handleMouseDown}
        className="flex items-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-full px-3 py-1 shadow-sm"
      >
        <Search className="w-4 h-4 text-gray-400" />
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search posts, tags..."
          className="ml-2 w-44 md:w-64 bg-transparent outline-none text-sm placeholder-gray-400"
          aria-label="Search posts and tags"
        />
        {value && (
          <button
            onClick={() => {
              onClear();
              inputRef.current?.focus();
            }}
            aria-label="Clear search"
            className="ml-2 text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-800"
          >
            Clear
          </button>
        )}
      </div>
    );
  });

  // --- small component for post card ---
  const PostCard = ({ p }) => (
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
            <span className="text-xs text-[var(--accent-color)] font-semibold">{formatCategory(p.category || "News")}</span>
            <time className="text-xs text-gray-400">{new Date(p.createdAt).toLocaleDateString()}</time>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 line-clamp-2">{p.title}</h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{p.excerpt}</p>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm text-[var(--accent-color)] font-medium">Read →</span>
            <div className="text-sm text-gray-400">{(p.tags || []).slice(0, 2).join(", ")}</div>
          </div>
        </div>
      </Link>
    </motion.article>
  );

  // --- SEO ---
  const siteTitle = "TheLatestNews";
  const siteDesc = featured?.metaDescription || featured?.excerpt || "TheLatestNews — latest news and updates.";
  const canonical = typeof window !== "undefined" ? window.location.origin + window.location.pathname : "/";
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${typeof window !== "undefined" ? window.location.origin : ""}#website`,
        url: typeof window !== "undefined" ? window.location.origin : "",
        name: siteTitle,
        description: siteDesc || "",
      },
    ],
  };

  return (
    <HelmetProvider>
      <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <Helmet>
          <title>{featured?.metaTitle || `${siteTitle} — Latest news`}</title>
          <meta name="description" content={siteDesc} />
          <link rel="canonical" href={canonical} />
          <meta property="og:type" content="website" />
          <meta property="og:title" content={featured?.metaTitle || siteTitle} />
          <meta property="og:description" content={siteDesc} />
          <meta property="og:url" content={canonical} />
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        </Helmet>

        {/* NAVBAR */}
        <header className="sticky top-0 z-50 bg-white/70 dark:bg-gray-800/70 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-4">
                <Link to="/" className="text-xl font-bold tracking-tight text-[var(--accent-color)]">
                  {siteTitle}
                </Link>
                {/* removed Top stories text as requested */}
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden md:block">
                  <DesktopSearchBar
                    value={q}
                    onChange={(v) => {
                      setQ(v);
                      setPage(1);
                    }}
                    onClear={() => {
                      setQ("");
                      setPage(1);
                    }}
                  />
                </div>

                <div className="hidden md:flex items-center gap-2">
                  <button
                    onClick={toggleTheme}
                    aria-label="toggle theme"
                    className="p-2 rounded-full transition hover:scale-95 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                  >
                    {dark ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4 text-gray-700" />}
                  </button>
                </div>

                <div className="flex md:hidden items-center gap-2">
                  <button
                    onClick={toggleTheme}
                    aria-label="toggle theme"
                    className="p-2 rounded-full transition hover:scale-95 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                  >
                    {dark ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4 text-gray-700" />}
                  </button>
                  <button
                    onClick={() => setShowSearch((s) => !s)}
                    aria-label="toggle search"
                    className="p-2 rounded-full transition hover:scale-95 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                  >
                    {showSearch ? <X className="w-4 h-4 text-gray-700 dark:text-gray-300" /> : <Search className="w-4 h-4 text-gray-700 dark:text-gray-300" />}
                  </button>
                  <button
                    onClick={() => setMobileMenuOpen((m) => !m)}
                    aria-label="open mobile menu"
                    className="p-2 rounded-full transition hover:scale-95 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                  >
                    <Menu className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* mobile search animated */}
          <AnimatePresence>
            {showSearch && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="md:hidden border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2"
              >
                <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-full px-3 py-2 shadow-sm">
                  <Search className="w-4 h-4 text-gray-400" />
                  <input
                    value={q}
                    onChange={(e) => {
                      setQ(e.target.value);
                      setPage(1);
                    }}
                    placeholder="Search posts, tags..."
                    className="ml-2 w-full bg-transparent outline-none text-sm placeholder-gray-400"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* breaking ticker - improved: duplicated content for smooth loop */}
          <div className="border-t border-gray-100 dark:border-gray-800 bg-white/60 dark:bg-gray-800/60">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-4 overflow-hidden py-2">
                <div className="flex items-center gap-2 text-xs text-[var(--accent-color)] font-semibold">
                  <Megaphone className="w-4 h-4" /> <span>Breaking</span>
                </div>

                <div className="flex-1">
                  <div className="relative overflow-hidden">
                    {/* two copies for seamless marquee */}
                    <div
                      aria-hidden="true"
                      className="whitespace-nowrap will-change-transform marquee-content"
                    >
                      {latestPosts.slice(0, 20).map((p, i) => (
                        <Link key={`m1-${p._id || i}`} to={`/${p.slug || ""}`} className="inline-block mr-6 text-sm text-gray-700 dark:text-gray-300 hover:underline">
                          {p.title}
                        </Link>
                      ))}
                      {/* duplicate */}
                      {latestPosts.slice(0, 20).map((p, i) => (
                        <Link key={`m1b-${p._id || i}`} to={`/${p.slug || ""}`} className="inline-block mr-6 text-sm text-gray-700 dark:text-gray-300 hover:underline">
                          {p.title}
                        </Link>
                      ))}
                    </div>
                    <style>{`
                      .marquee-content { display: inline-block; animation: marquee 36s linear infinite; }
                      @keyframes marquee { 0% { transform: translateX(0%); } 100% { transform: translateX(-50%); } }
                      @media (prefers-reduced-motion: reduce) { .marquee-content { animation: none; } }
                    `}</style>
                  </div>
                </div>

                <div className="hidden sm:flex items-center gap-3">
                  <Link to="/rss.xml" className="text-xs text-gray-500 hover:underline">RSS</Link>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* MAIN (hero + content + sidebar) */}
        <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              {/* Top Stories Slider */}
              <div className="mb-6">
                <div className="relative rounded-2xl overflow-hidden shadow-lg">
                  <div className="relative h-72 sm:h-96 w-full">
                    {getSliderItems().length === 0 ? (
                      <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-gradient-start)] to-[var(--accent-gradient-end)]" />
                    ) : (
                      getSliderItems().map((sItem, idx) => (
                        <motion.div
                          key={sItem._id || idx}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: idx === slideIndex ? 1 : 0, x: idx === slideIndex ? 0 : 20 }}
                          transition={{ duration: 0.45 }}
                          className={`${idx === slideIndex ? "absolute inset-0" : "absolute inset-0 pointer-events-none"}`}
                        >
                          {sItem.heroImage?.url ? (
                            <img src={sItem.heroImage.url} alt={sItem.title} className="absolute inset-0 w-full h-full object-cover" loading="lazy" decoding="async" />
                          ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-gradient-start)] to-[var(--accent-gradient-end)]" />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                          <div className="absolute inset-0 flex items-end p-6 md:p-10">
                            <div className="max-w-2xl">
                              <div className="inline-flex items-center gap-2 mb-2">
                                <span className="bg-[var(--accent-color)]/90 text-white text-xs px-2 py-1 rounded-full">{formatCategory(sItem.category || "News")}</span>
                                <span className="text-xs text-white/80">{new Date(sItem.createdAt).toLocaleDateString()}</span>
                              </div>
                              <h2 className="text-2xl md:text-4xl font-extrabold text-white leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">{sItem.title}</h2>
                              <p className="mt-3 text-sm text-white/90 hidden md:block line-clamp-2">{sItem.excerpt}</p>
                              <div className="mt-4">
                                <Link to={`/${sItem.slug || ""}`} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium shadow-md bg-gradient-to-r from-[var(--accent-gradient-start)] to-[var(--accent-gradient-end)] text-white">
                                  Read Story
                                </Link>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    )}

                    {/* slider controls */}
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex gap-2 z-10">
                      {getSliderItems().map((_, i) => (
                        <button key={i} onClick={() => setSlideIndex(i)} aria-label={`Go to slide ${i + 1}`} className={`w-2 h-2 rounded-full ${i === slideIndex ? "bg-white" : "bg-white/40"}`} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Trending strip (keep as requested) */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-[var(--accent-color)]" />
                    <h3 className="text-lg font-semibold">Trending Now</h3>
                  </div>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
                  {popularPosts.slice(0, 8).map((p) => (
                    <Link key={p._id} to={`/${p.slug || ""}`} className="flex-shrink-0 px-3 py-2 rounded-md bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:scale-[1.01] transition">
                      <div className="text-sm font-medium line-clamp-2">{p.title}</div>
                      <div className="text-xs text-gray-500">{(p.views || 0).toLocaleString()} views</div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* categories preview (top categories) */}
              <div className="space-y-6">
                {categories.slice(1, 4).map((c) => (
                  <section key={c.key} className="bg-transparent">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xl font-semibold">{formatCategory(c.name)}</h3>
                      <Link to={`/?category=${encodeURIComponent(c.name)}`} className="text-sm text-[var(--accent-color)]">
                        See all
                      </Link>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {posts
                        .filter((p) => (p.category || "Uncategorized") === c.name)
                        .slice(0, 4)
                        .map((p) => (
                          <article key={p._id} className="rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700 bg-white/90 dark:bg-gray-800/90 shadow-sm">
                            <Link to={`/${p.slug || ""}`} className="block sm:flex">
                              {p.heroImage?.url ? (
                                <img src={p.heroImage.url} alt={p.title} className="w-full sm:w-40 h-32 object-cover" loading="lazy" />
                              ) : (
                                <div className="w-full sm:w-40 h-32 bg-gray-200 dark:bg-gray-700" />
                              )}
                              <div className="p-3">
                                <h4 className="font-semibold line-clamp-2 text-gray-900 dark:text-gray-100">{p.title}</h4>
                                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{p.excerpt}</p>
                              </div>
                            </Link>
                          </article>
                        ))}
                    </div>
                  </section>
                ))}
              </div>
            </div>

            {/* SIDEBAR */}
            <aside className="lg:col-span-1">
              <div className="mb-6 p-4 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 text-center">
                <div className="text-sm font-semibold text-gray-700 dark:text-gray-200">Sponsored</div>
                <div className="mt-3 text-xs text-gray-500">Ad placeholder — replace with your ad code</div>
                <div className="mt-4 h-24 bg-gray-100 dark:bg-gray-800 rounded" />
              </div>

              <div className="mb-6 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 bg-white/90 dark:bg-gray-800/90">
                <h4 className="text-lg font-semibold mb-3">Latest</h4>
                <ul className="space-y-3 text-sm">
                  {latestPosts.slice(0, 6).map((p) => (
                    <li key={p._id} className="flex items-start gap-3">
                      <div className="flex-1">
                        <Link to={`/${p.slug || ""}`} className="font-medium line-clamp-2 text-gray-900 dark:text-gray-100">
                          {p.title}
                        </Link>
                        <div className="text-xs text-gray-500">{new Date(p.createdAt).toLocaleDateString()}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mb-6 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 bg-white/90 dark:bg-gray-800/90">
                <h4 className="text-lg font-semibold mb-3">Popular</h4>
                <ul className="space-y-3 text-sm">
                  {popularPosts.slice(0, 6).map((p) => (
                    <li key={p._id} className="flex items-start gap-3">
                      <div className="flex-1">
                        <Link to={`/${p.slug || ""}`} className="font-medium line-clamp-2 text-gray-900 dark:text-gray-100">
                          {p.title}
                        </Link>
                        <div className="text-xs text-gray-500">{(p.views || 0).toLocaleString()} views</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mb-6 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 bg-white/90 dark:bg-gray-800/90">
                <h4 className="text-lg font-semibold mb-3">Hot Topics</h4>
                <div className="flex flex-wrap gap-2">
                  {[...new Set(posts.flatMap((p) => p.tags || []))].slice(0, 12).map((t) => (
                    <Link key={t} to={`/?tag=${encodeURIComponent(t)}`} className="text-xs px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:opacity-95">
                      #{t}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-gray-100 dark:border-gray-700 bg-white/90 dark:bg-gray-800/90 text-center">
                <div className="text-sm font-semibold">Get top stories in your inbox</div>
                <div className="mt-3">
                  <input placeholder="Email address" className="w-full px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm" />
                  <button className="mt-3 w-full px-3 py-2 rounded-md bg-[var(--accent-color)] text-white">Subscribe</button>
                </div>
              </div>
            </aside>
          </section>

          {/* main grid */}
          <section className="mt-8">
            {loading ? (
              <div className="py-20 text-center text-gray-600 dark:text-gray-300">Loading latest posts…</div>
            ) : filtered.length === 0 ? (
              <div className="py-20 text-center text-gray-600 dark:text-gray-300">No posts found.</div>
            ) : (
              <>
                <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {visible.map((p) => (
                    <PostCard key={p._id} p={p} />
                  ))}
                </motion.div>

                <div className="mt-8 flex justify-center items-center gap-3">
                  <button onClick={() => setPage((s) => Math.max(1, s - 1))} disabled={page === 1} className="px-3 py-1 rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                    Prev
                  </button>
                  <div className="text-sm text-gray-600 dark:text-gray-300">Page {page} / {totalPages}</div>
                  <button onClick={() => setPage((s) => Math.min(totalPages, s + 1))} disabled={page === totalPages} className="px-3 py-1 rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                    Next
                  </button>
                </div>
              </>
            )}
          </section>
        </main>

        {/* FOOTER — Clean Minimal (Version A) */}
        <footer className="bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 py-10">
  <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

    <div>
      <h3 className="text-xl font-bold  text-gray-600 dark:text-gray-300">TheLatestNews</h3>
      <p className="text-sm opacity-80">
        Your trusted source for breaking stories, trending topics and real-time updates.
      </p>
    </div>

    <div>
      <h4 className="font-semibold text-gray-600 dark:text-gray-300">Quick Links</h4>
      <ul className="space-y-2 text-sm">
        <li><Link to="/about" className="hover:text-gray-400">About Us</Link></li>
        <li><a href="/sitemap.xml" className="hover:text-gray-400">Sitemap</a></li>
        <li><a href="/rss.xml" className="hover:text-gray-400">RSS Feed</a></li>
      </ul>
    </div>

    <div>
      <h4 className="font-semibold text-gray-600 dark:text-gray-300">Categories</h4>
      <ul className="space-y-2 text-sm">
        {categories.slice(1, 6).map((c) => (
          <li key={c.key}>
            <Link
              to={`/?category=${c.name}`}
              className="hover:text-gray-300"
            >
              {c.name.replace(/-/g, " ").replace(/\b\w/g, (x) => x.toUpperCase())}
            </Link>
          </li>
        ))}
      </ul>
    </div>

    <div>
      <h4 className="font-semibold text-white mb-3">Subscribe</h4>
      <input
        type="email"
        placeholder="Your email"
        className="w-full px-3 py-2 rounded-md bg-gray-100 border dark:bg-gray-800 border-gray-700 text-sm"
      />
      <button className="mt-3 w-full py-2 rounded-md bg-[var(--accent-color)] text-white text-sm">
        Join Newsletter
      </button>
    </div>

  </div>

  <div className="border-t border-gray-700 py-4 text-center text-sm text-gray-400">
    © {new Date().getFullYear()} TheLatestNews — All rights reserved.
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
