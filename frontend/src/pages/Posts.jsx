// src/pages/Posts.jsx — Accent color integrated (no layout changes)
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PlusCircle,
  Pencil,
  Trash2,
  Eye,
  FileText,
  Loader2,
  X,
  Search,
} from "lucide-react";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import AppLoader from "../components/AppLoader";
const Posts = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [previewPost, setPreviewPost] = useState(null);

  // Fetch posts
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await api.get("/admin/posts");
        setPosts(res.data);
        setFilteredPosts(res.data);
      } catch (err) {
        console.error("Error fetching posts:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  // Search filter
  useEffect(() => {
    if (!search.trim()) setFilteredPosts(posts);
    else {
      const q = search.toLowerCase();
      setFilteredPosts(
        posts.filter(
          (p) =>
            p.title.toLowerCase().includes(q) ||
            (p.tags && p.tags.join(",").toLowerCase().includes(q)) ||
            (p.keywords && p.keywords.join(",").toLowerCase().includes(q))
        )
      );
    }
  }, [search, posts]);

  // Delete
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    setDeleting(id);
    try {
      await api.delete(`/admin/posts/${id}`);
      setPosts((prev) => prev.filter((p) => p._id !== id));
      setFilteredPosts((prev) => prev.filter((p) => p._id !== id));
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="p-6 space-y-6 min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <FileText className="w-7 h-7 text-[var(--accent-color)]" /> All Posts
        </h2>

        {/* Search + Add */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search posts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 
                         bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 
                         placeholder-gray-400 focus:ring-2 focus:ring-[var(--accent-color)] 
                         outline-none transition"
            />
          </div>
          <Link
            to="/admin/editor"
            className="flex items-center justify-center gap-2 
                       bg-[var(--accent-color)] hover:opacity-90 
                       text-white px-5 py-2 rounded-lg shadow-md transition"
          >
            <PlusCircle className="w-5 h-5" /> New Post
          </Link>
        </div>
      </div>

      {/* Loader */}
      {loading ? (
        <AppLoader />
      ) : filteredPosts.length === 0 ? (
        <p className="text-gray-600 dark:text-gray-400 text-center py-10">
          No posts found.
        </p>
      ) : (
        <motion.div
          layout
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
        >
          {filteredPosts.map((post) => (
            <motion.div
              key={post._id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md 
                         rounded-2xl shadow-lg p-5 hover:shadow-xl 
                         border border-gray-100 dark:border-gray-700 transition relative"
            >
              {/* Title */}
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2 line-clamp-2">
                {post.title}
              </h3>

              {/* Excerpt */}
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                {post.excerpt ||
                  post.content?.replace(/<[^>]+>/g, "").slice(0, 120) + "..." ||
                  "No excerpt available."}
              </p>

              {/* Info */}
              <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400 mb-3">
                <span>
                  Status:{" "}
                  <span
                    className={`font-medium ${
                      post.status === "published"
                        ? "text-[var(--accent-color)]"
                        : "text-yellow-500"
                    }`}
                  >
                    {post.status}
                  </span>
                </span>
                <span>{new Date(post.createdAt).toLocaleDateString()}</span>
              </div>

              {/* Actions */}
              <div className="flex justify-between items-center">
                <div className="flex gap-3">
                  <Link
                    to={`/admin/editor/${post._id}`}
                    className="text-[var(--accent-color)] hover:opacity-90 transition"
                    title="Edit"
                  >
                    <Pencil className="w-5 h-5" />
                  </Link>
                  <button
                    onClick={() => handleDelete(post._id)}
                    disabled={deleting === post._id}
                    className="text-red-500 hover:text-red-600 transition"
                    title="Delete"
                  >
                    {deleting === post._id ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Trash2 className="w-5 h-5" />
                    )}
                  </button>
                </div>

                <button
                  onClick={() => setPreviewPost(post)}
                  className="text-gray-500 hover:text-[var(--accent-color)] transition"
                  title="Preview"
                >
                  <Eye className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Preview Modal */}
      <AnimatePresence>
        {previewPost && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl 
                         max-w-3xl w-full max-h-[90vh] overflow-y-auto 
                         border border-gray-200 dark:border-gray-700 p-6 custom-scroll"
            >
              <div className="flex justify-between items-center mb-5 border-b border-gray-200 dark:border-gray-700 pb-3">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                  {previewPost.title}
                </h2>
                <button
                  onClick={() => setPreviewPost(null)}
                  className="text-gray-500 hover:text-[var(--accent-color)]"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {previewPost.heroImage?.url && (
                <img
                  src={previewPost.heroImage.url}
                  alt={previewPost.heroImage.alt || ""}
                  className="rounded-lg mb-4 w-full shadow-sm"
                />
              )}

              <div
                className="prose dark:prose-invert max-w-none text-gray-800 dark:text-gray-200"
                dangerouslySetInnerHTML={{ __html: previewPost.content }}
              />

              <div className="mt-6 text-sm text-gray-600 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-4 space-y-1">
                <p>
                  <strong>Category:</strong> {previewPost.category}
                </p>
                <p>
                  <strong>Subcategory:</strong> {previewPost.subCategory}
                </p>
                <p>
                  <strong>Status:</strong>{" "}
                  <span className="text-[var(--accent-color)]">
                    {previewPost.status}
                  </span>
                </p>
                {previewPost.tags?.length > 0 && (
                  <p>
                    <strong>Tags:</strong> {previewPost.tags.join(", ")}
                  </p>
                )}
                {previewPost.keywords?.length > 0 && (
                  <p>
                    <strong>Keywords:</strong>{" "}
                    {previewPost.keywords.join(", ")}
                  </p>
                )}
                {previewPost.source && (
                  <p>
                    <strong>Source:</strong> {previewPost.source}
                  </p>
                )}
                {previewPost.relatedTickers?.length > 0 && (
                  <p>
                    <strong>Tickers:</strong>{" "}
                    {previewPost.relatedTickers.join(", ")}
                  </p>
                )}
                <p>
                  <strong>Created:</strong>{" "}
                  {new Date(previewPost.createdAt).toLocaleString()}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scrollbar styling */}
      <style>{`
        .custom-scroll::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scroll::-webkit-scrollbar-thumb {
          background-color: var(--accent-color);
          border-radius: 9999px;
        }
        .custom-scroll::-webkit-scrollbar-thumb:hover {
          opacity: 0.8;
        }
        .custom-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
      `}</style>
    </div>
  );
};

export default Posts;
