import React, { useEffect, useRef, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Save, Image as ImageIcon, Copy, Check } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api";
import JoditEditor from "jodit-react";
import "jodit/es5/jodit.min.css";

const slugify = (text = "") =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

export default function Editor() {
  const navigate = useNavigate();
  const { id } = useParams();
  const editorRef = useRef(null);
  const fileRef = useRef(null);

  const [form, setForm] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    heroImage: { url: "", alt: "" },
    category: "finance-news",
    subCategory: "stocks",
    tags: "",
    keywords: "",
    relatedTickers: "",
    source: "",
    referenceLinks: "",
    metaTitle: "",
    metaDescription: "",
    status: "draft",
    scheduledFor: "",
  });

  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [tab, setTab] = useState("write");
  const [copied, setCopied] = useState(false);
  const [theme, setTheme] = useState(
    document.documentElement.classList.contains("dark") ? "dark" : "default"
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const isDark = document.documentElement.classList.contains("dark");
      setTheme(isDark ? "dark" : "default");
    });
    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!id) return setLoading(false);
    api
      .get("/admin/posts")
      .then((res) => {
        const post = res.data.find((p) => p._id === id);
        if (post) {
          setForm({
            ...form,
            ...post,
            tags: (post.tags || []).join(", "),
            keywords: (post.keywords || []).join(", "),
            relatedTickers: (post.relatedTickers || []).join(", "),
            referenceLinks: (post.referenceLinks || []).join(", "),
            scheduledFor: post.scheduledFor
              ? new Date(post.scheduledFor).toISOString().slice(0, 16)
              : "",
          });
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(null), 3000);
    return () => clearTimeout(t);
  }, [message]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await api.post("/admin/uploads", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const url = res.data?.url;
      if (url) setForm((s) => ({ ...s, heroImage: { ...s.heroImage, url } }));
    } catch (err) {
      console.error(err);
      setMessage("Upload failed");
    } finally {
      e.target.value = "";
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(form.heroImage.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = {
        ...form,
        tags: form.tags ? form.tags.split(",").map((t) => t.trim()) : [],
        keywords: form.keywords
          ? form.keywords.split(",").map((t) => t.trim())
          : [],
        relatedTickers: form.relatedTickers
          ? form.relatedTickers.split(",").map((t) => t.trim())
          : [],
        referenceLinks: form.referenceLinks
          ? form.referenceLinks.split(",").map((t) => t.trim())
          : [],
      };
      if (!payload.slug) payload.slug = slugify(payload.title);
      if (id) await api.put(`/admin/posts/${id}`, payload);
      else await api.post("/admin/posts", payload);
      setMessage("Post saved successfully");
      setTimeout(() => navigate("/admin/posts"), 1000);
    } catch (err) {
      console.error("Save failed", err);
      setMessage("Save failed");
    } finally {
      setSaving(false);
    }
  };

  const config = useMemo(
    () => ({
      readonly: false,
      height: "60vh",
      theme: theme,
      toolbarSticky: true,
      buttons: [
        "source",
        "bold",
        "italic",
        "underline",
        "ul",
        "ol",
        "outdent",
        "indent",
        "align",
        "font",
        "fontsize",
        "brush",
        "paragraph",
        "table",
        "link",
        "image",
        "video",
        "quote",
        "hr",
        "undo",
        "redo",
        "fullsize",
      ],
      uploader: { insertImageAsBase64URI: false },
      image: { editImage: true, openOnDblClick: true, resize: true },
      defaultActionOnPaste: "insert_as_html",
    }),
    [theme]
  );

  const handleEditorChange = (val) => setForm((s) => ({ ...s, content: val }));

  if (loading)
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-gray-600 dark:text-gray-300">
        Loading...
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-[1200px] mx-auto">
        {/* Header Section */}
        <div className="bg-white dark:bg-gray-800/80 backdrop-blur-md rounded-2xl border dark:border-gray-700 p-6 shadow-md mb-6">
          <input
            name="title"
            value={form.title}
            onChange={(e) =>
              setForm((s) => ({
                ...s,
                title: e.target.value,
                slug: slugify(e.target.value),
              }))
            }
            placeholder="Post title..."
            className="w-full text-3xl font-bold bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none"
          />

          {/* Meta Fields */}
          <div className="mt-5 grid md:grid-cols-2 gap-4">
            {[
              { name: "slug", label: "Slug" },
              { name: "source", label: "Source" },
              { name: "tags", label: "Tags" },
              { name: "keywords", label: "Keywords" },
              { name: "relatedTickers", label: "Related Tickers" },
              { name: "referenceLinks", label: "Reference Links" },
              { name: "metaTitle", label: "Meta Title" },
              { name: "metaDescription", label: "Meta Description" },
            ].map((f) => (
              <input
                key={f.name}
                name={f.name}
                value={form[f.name]}
                onChange={handleChange}
                placeholder={f.label}
                className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-[var(--accent-color)] outline-none transition"
              />
            ))}
          </div>

          {/* Category + Subcategory */}
          <div className="mt-5 flex flex-wrap gap-3">
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-[var(--accent-color)]"
            >
              <option value="finance-news">Finance News</option>
              <option value="market-update">Market Update</option>
              <option value="case-study">Case Study</option>
              <option value="analysis">Analysis</option>
            </select>
            <select
              name="subCategory"
              value={form.subCategory}
              onChange={handleChange}
              className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-[var(--accent-color)]"
            >
              <option value="stocks">Stocks</option>
              <option value="crypto">Crypto</option>
              <option value="mutual-funds">Mutual Funds</option>
              <option value="forex">Forex</option>
            </select>
          </div>

          {/* Scheduling */}
          <div className="mt-4 flex flex-wrap gap-4 items-center">
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100"
            >
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
              <option value="published">Published</option>
            </select>

            {form.status === "scheduled" && (
              <input
                type="datetime-local"
                name="scheduledFor"
                value={form.scheduledFor}
                onChange={handleChange}
                className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100"
              />
            )}
          </div>

          {/* Hero Image */}
          <div className="mt-6">
            <label className="block text-sm text-gray-600 dark:text-gray-300 font-medium mb-2">
              Featured Image URL
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                readOnly
                value={form.heroImage.url}
                placeholder="No image uploaded yet"
                className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className={`flex items-center gap-1 px-3 py-2 rounded-lg text-white ${
                    copied
                      ? "bg-[var(--accent-color)]"
                      : "bg-[var(--accent-color)]/90 hover:opacity-90"
                  }`}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Copied" : "Copy"}
                </button>
                <button
                  onClick={() => fileRef.current.click()}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg border border-[var(--accent-color)] text-[var(--accent-color)] hover:bg-[var(--accent-color)]/10 transition"
                >
                  <ImageIcon className="w-4 h-4" /> Upload
                </button>
              </div>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleSave}
            disabled={saving}
            className="mt-6 bg-[var(--accent-color)] text-white px-6 py-2 rounded-lg shadow-md hover:shadow-lg transition"
          >
            <Save className="w-4 h-4 inline mr-2" />
            {saving ? "Saving..." : id ? "Update" : "Publish"}
          </motion.button>
        </div>

        {/* Tabs */}
        <div className="flex gap-3 mb-4">
          {["write", "preview"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1 rounded-full font-medium transition ${
                tab === t
                  ? "bg-[var(--accent-color)] text-white shadow"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
              }`}
            >
              {t === "write" ? "Write" : "Preview"}
            </button>
          ))}
        </div>

        {/* Editor */}
        {tab === "write" && (
          <div className="bg-white dark:bg-gray-800/90 backdrop-blur-md rounded-2xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
            <JoditEditor
              ref={editorRef}
              value={form.content}
              config={config}
              onChange={handleEditorChange}
            />
          </div>
        )}

        {/* Preview */}
        {tab === "preview" && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
            <h1 className="text-3xl font-bold mb-3 text-gray-900 dark:text-gray-100">
              {form.title}
            </h1>

            {/* Meta Info */}
            <div className="mb-4 text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <p>
                <strong>Category:</strong> {form.category} / {form.subCategory}
              </p>
              {form.source && (
                <p>
                  <strong>Source:</strong> {form.source}
                </p>
              )}
              {form.tags && (
                <p>
                  <strong>Tags:</strong> {form.tags}
                </p>
              )}
              {form.keywords && (
                <p>
                  <strong>Keywords:</strong> {form.keywords}
                </p>
              )}
              {form.metaTitle && (
                <p>
                  <strong>Meta Title:</strong> {form.metaTitle}
                </p>
              )}
              {form.metaDescription && (
                <p>
                  <strong>Meta Description:</strong> {form.metaDescription}
                </p>
              )}
            </div>

            <div
              className="prose dark:prose-invert max-w-none prose-ul:list-disc prose-ol:list-decimal prose-li:marker:text-[var(--accent-color)]"
              dangerouslySetInnerHTML={{ __html: form.content }}
            />
          </div>
        )}

        {message && (
          <div
            className={`mt-4 px-4 py-2 rounded-lg text-sm ${
              message.includes("fail")
                ? "bg-red-100 text-red-700"
                : "bg-[var(--accent-color)]/10 text-[var(--accent-color)]"
            }`}
          >
            {message}
          </div>
        )}
      </div>

      {/* 🔧 Fix Jodit Dark Mode + UL/OL */}
      <style>{`
        .jodit_theme_dark .jodit-toolbar__box,
        .jodit_theme_dark .jodit-toolbar-button__button {
          background: #111827 !important;
          color: #f9fafb !important;
        }
        .jodit_theme_dark .jodit-wysiwyg {
          background-color: #1f2937 !important;
          color: #f3f4f6 !important;
        }
        .prose li::marker {
          color: var(--accent-color);
        }
      `}</style>
    </div>
  );
}
