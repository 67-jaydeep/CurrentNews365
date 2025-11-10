import React, { useState, useEffect } from "react"; 
import {
  Bell,
  Moon,
  Sun,
  User,
  CheckCircle,
  AlertCircle,
  X,
  Download,
  Trash2,
  Check,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import api from "../api";

export default function Navbar({ title }) {
  const [darkMode, setDarkMode] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileModal, setProfileModal] = useState(false);
  const [settingsModal, setSettingsModal] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const { user, logout } = useAuth();

  // 🎨 Accent Palettes
  const palettes = {
    emeraldMist: {
      name: "Emerald Mist",
      gradient: ["#10b981", "#14b8a6"],
    },
    royalSunset: {
      name: "Royal Sunset",
      gradient: ["#f59e0b", "#ef4444"],
    },
    sapphireWave: {
      name: "Sapphire Wave",
      gradient: ["#3b82f6", "#6366f1"],
    },
    violetBloom: {
      name: "Violet Bloom",
      gradient: ["#8b5cf6", "#ec4899"],
    },
    cyberLime: {
      name: "Cyber Lime",
      gradient: ["#84cc16", "#22d3ee"],
    },
  };

  // local state for custom picker inputs
  const [customStart, setCustomStart] = useState("#10b981");
  const [customEnd, setCustomEnd] = useState("#14b8a6");

  // 🎯 Apply Palette Function
  const applyPalette = (key, custom = null) => {
    const root = document.documentElement;
    if (key === "custom" && custom) {
      const [s, e] = custom;
      root.style.setProperty("--accent-gradient-start", s);
      root.style.setProperty("--accent-gradient-end", e);
      root.style.setProperty("--accent-color", s);
      localStorage.setItem("accentPalette", "custom");
      localStorage.setItem("accentCustom", JSON.stringify({ start: s, end: e }));
    } else {
      const theme = palettes[key];
      if (!theme) return;
      root.style.setProperty("--accent-gradient-start", theme.gradient[0]);
      root.style.setProperty("--accent-gradient-end", theme.gradient[1]);
      root.style.setProperty("--accent-color", theme.gradient[0]);
      localStorage.setItem("accentPalette", key);
      localStorage.removeItem("accentCustom");
    }
    // NOTE: CSS vars update will automatically style .btn-primary and other CSS that references them.
  };

  // Load theme + palette on mount
  useEffect(() => {
    const isDark = localStorage.getItem("theme") === "dark";
    setDarkMode(isDark);
    document.documentElement.classList.toggle("dark", isDark);

    const savedPalette = localStorage.getItem("accentPalette") || "emeraldMist";
    if (savedPalette === "custom") {
      const t = localStorage.getItem("accentCustom");
      try {
        const parsed = t ? JSON.parse(t) : null;
        if (parsed?.start && parsed?.end) {
          setCustomStart(parsed.start);
          setCustomEnd(parsed.end);
          applyPalette("custom", [parsed.start, parsed.end]);
        } else {
          applyPalette("emeraldMist");
        }
      } catch {
        applyPalette("emeraldMist");
      }
    } else {
      applyPalette(savedPalette);
    }
  }, []);

  const toggleTheme = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    document.documentElement.classList.toggle("dark", newMode);
    localStorage.setItem("theme", newMode ? "dark" : "light");
  };

  // Close menus on outside click
  useEffect(() => {
    const closeMenus = (e) => {
      if (!e.target.closest(".profile-dropdown")) setMenuOpen(false);
      if (!e.target.closest(".notif-dropdown")) setNotifOpen(false);
    };
    document.addEventListener("click", closeMenus);
    return () => document.removeEventListener("click", closeMenus);
  }, []);

  // Fetch notifications (unchanged)
  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const res = await api.get("/auth/notifications");
        setNotifications(res.data || []);
      } catch {
        setNotifications([
          { id: 1, type: "info", message: "Welcome back! 👋", time: "Just now" },
          { id: 2, type: "success", message: "New post published successfully.", time: "2h ago" },
          { id: 3, type: "alert", message: "3 scheduled posts pending.", time: "Yesterday" },
        ]);
      }
    };
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 15000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.length;

  const handleBackup = async () => {
    try {
      const [summary, notifications] = await Promise.all([
        api.get("/auth/summary"),
        api.get("/auth/notifications"),
      ]);
      const data = {
        summary: summary.data,
        notifications: notifications.data,
        exportedAt: new Date().toISOString(),
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `dashboard-backup-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Failed to export backup");
    }
  };

  const clearCache = () => {
    localStorage.clear();
    window.location.reload();
  };

  return (
    <>
      {/* ===== NAVBAR ===== */}
      <header
        className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r 
        from-[var(--accent-gradient-start)]/90 to-[var(--accent-gradient-end)]/90 
        dark:from-[var(--accent-gradient-start)]/90 dark:to-[var(--accent-gradient-end)]/90 
        backdrop-blur-md border-b border-emerald-200/20 dark:border-gray-800 shadow-md transition-all"
      >
        <div className="flex items-center justify-between px-5 py-3">
          <h1
            className={`text-lg font-semibold tracking-tight drop-shadow-sm transition-colors ${
              darkMode ? "text-white" : "text-gray-900"
            }`}
          >
            {title}
          </h1>

          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-full shadow-inner transition-all duration-300 ${
                darkMode
                  ? "bg-gray-800/30 hover:bg-gray-700/50 text-white"
                  : "bg-white/70 hover:bg-white text-gray-900"
              }`}
              aria-label="Toggle theme"
            >
              {darkMode ? <Sun className="w-5 h-5 text-yellow-300" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Notifications */}
            <div className="relative notif-dropdown">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className={`relative p-2 rounded-full shadow-inner transition-all duration-300 ${
                  darkMode
                    ? "bg-gray-800/30 hover:bg-gray-700/50 text-white"
                    : "bg-white/70 hover:bg-white text-gray-900"
                }`}
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </button>

              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-80 bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl border border-emerald-200/20 dark:border-gray-700 rounded-xl shadow-2xl overflow-hidden z-50"
                  >
                    <div className="flex justify-between items-center px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                      <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                        Notifications
                      </h3>
                      {unreadCount > 0 && (
                        <button
                          onClick={() => setNotifications([])}
                          className="text-xs text-[var(--accent-color)] hover:underline"
                        >
                          Clear all
                        </button>
                      )}
                    </div>
                    <div className="max-h-72 overflow-y-auto hide-scrollbar">
                      {notifications.length > 0 ? (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            className="flex items-start gap-3 px-4 py-3 hover:bg-emerald-50/60 dark:hover:bg-gray-800/70 transition"
                          >
                            {n.type === "success" ? (
                              <CheckCircle className="w-4 h-4 text-emerald-500 mt-1" />
                            ) : n.type === "alert" ? (
                              <AlertCircle className="w-4 h-4 text-amber-500 mt-1" />
                            ) : (
                              <Bell className="w-4 h-4 text-emerald-400 mt-1" />
                            )}
                            <div>
                              <p className="text-sm text-gray-700 dark:text-gray-200">{n.message}</p>
                              <span className="text-xs text-gray-500 dark:text-gray-400">{n.time}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-6">
                          No notifications
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Profile Dropdown */}
            <div className="relative profile-dropdown">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center justify-center w-9 h-9 rounded-full 
                  bg-gradient-to-br from-[var(--accent-gradient-start)] to-[var(--accent-gradient-end)] 
                  text-white shadow-md hover:shadow-lg transition-all duration-300"
              >
                <User className="w-4 h-4" />
              </button>

              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-44 bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl border border-emerald-200/20 dark:border-gray-700 rounded-xl shadow-2xl overflow-hidden z-50"
                  >
                    <div className="px-4 py-3 border-b border-gray-100/30 dark:border-gray-700">
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                        {user?.email?.split("@")[0] || "Admin"}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {user?.email || "you@domain.com"}
                      </p>
                    </div>
                    <ul className="py-1">
                      <li>
                        <button
                          onClick={() => {
                            setProfileModal(true);
                            setMenuOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-emerald-50 dark:hover:bg-gray-800/80 transition"
                        >
                          Profile
                        </button>
                      </li>
                      <li>
                        <button
                          onClick={() => {
                            setSettingsModal(true);
                            setMenuOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-emerald-50 dark:hover:bg-gray-800/80 transition"
                        >
                          Settings
                        </button>
                      </li>
                      <li>
                        <button
                          onClick={() => {
                            logout();
                            setMenuOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-gray-800/80 transition"
                        >
                          Logout
                        </button>
                      </li>
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      {/* ===== PROFILE MODAL (restored) ===== */}
      <AnimatePresence>
        {profileModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]"
            onClick={() => setProfileModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white/40 dark:bg-gray-900/40 backdrop-blur-3xl rounded-2xl shadow-2xl w-[90%] max-w-md p-6 border border-white/30 dark:border-gray-700"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-[var(--accent-color)]">Admin Profile</h2>
                <button
                  onClick={() => setProfileModal(false)}
                  className="p-1 hover:bg-gray-100/40 dark:hover:bg-gray-800/40 rounded-full transition"
                >
                  <X className="w-5 h-5 text-gray-500 dark:text-gray-300" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Name</p>
                  <p className="text-base font-medium text-gray-800 dark:text-gray-100">
                    {user?.name || "Default Admin"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                  <p className="text-base font-medium text-gray-800 dark:text-gray-100">
                    {user?.email || "you@domain.com"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Role</p>
                  <p className="text-base font-medium text-gray-800 dark:text-gray-100 capitalize">
                    {user?.role || "admin"}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  disabled
                  className="px-4 py-2 bg-[var(--accent-color)]/60 text-white text-sm rounded-lg cursor-not-allowed"
                >
                  Edit (coming soon)
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== SETTINGS MODAL (with custom picker) ===== */}
      <AnimatePresence>
        {settingsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70]"
            onClick={() => setSettingsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white/40 dark:bg-gray-900/40 backdrop-blur-3xl rounded-2xl shadow-2xl w-[90%] max-w-md p-6 border border-white/30 dark:border-gray-700"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-[var(--accent-color)]">Settings</h2>
                <button
                  onClick={() => setSettingsModal(false)}
                  className="p-1 hover:bg-gray-100/40 dark:hover:bg-gray-800/40 rounded-full transition"
                >
                  <X className="w-5 h-5 text-gray-500 dark:text-gray-300" />
                </button>
              </div>

              {/* Built-in Palettes */}
              <div className="mb-5">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Accent Palette
                </p>
                <div className="grid grid-cols-5 gap-3">
                  {Object.entries(palettes).map(([key, theme]) => (
                    <button
                      key={key}
                      onClick={() => applyPalette(key)}
                      className={`relative w-9 h-9 rounded-full border-2 transition-all ${
                        localStorage.getItem("accentPalette") === key
                          ? "scale-110 border-[var(--accent-color)]"
                          : "border-transparent"
                      }`}
                      style={{
                        background: `linear-gradient(135deg, ${theme.gradient[0]}, ${theme.gradient[1]})`,
                      }}
                    >
                      {localStorage.getItem("accentPalette") === key && (
                        <Check className="absolute inset-0 m-auto text-white w-4 h-4" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Palette Picker */}
              <div className="mb-5">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Custom Palette
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-center">
                    <label className="text-xs text-gray-600 dark:text-gray-400 mb-1">Start</label>
                    <input
                      type="color"
                      value={customStart}
                      onChange={(e) => setCustomStart(e.target.value)}
                      className="w-12 h-8 p-0 border-0 bg-transparent"
                    />
                  </div>
                  <div className="flex flex-col items-center">
                    <label className="text-xs text-gray-600 dark:text-gray-400 mb-1">End</label>
                    <input
                      type="color"
                      value={customEnd}
                      onChange={(e) => setCustomEnd(e.target.value)}
                      className="w-12 h-8 p-0 border-0 bg-transparent"
                    />
                  </div>

                  <div className="ml-2 flex gap-2">
                    <button
                      onClick={() => {
                        applyPalette("custom", [customStart, customEnd]);
                      }}
                      className="px-3 py-1 rounded-lg text-white text-sm"
                      style={{
                        background: `linear-gradient(135deg, ${customStart}, ${customEnd})`,
                      }}
                    >
                      Save
                    </button>

                    <button
                      onClick={() => {
                        setCustomStart("#10b981");
                        setCustomEnd("#14b8a6");
                      }}
                      className="px-3 py-1 rounded-lg border text-sm"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </div>

              {/* Backup + Clear */}
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleBackup}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-[var(--accent-color)] text-white text-sm rounded-lg hover:opacity-90 transition"
                >
                  <Download className="w-4 h-4" /> Backup Data
                </button>
                <button
                  onClick={clearCache}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-red-500/80 text-white text-sm rounded-lg hover:bg-red-500 transition"
                >
                  <Trash2 className="w-4 h-4" /> Clear Cache
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CSS Vars + hide scrollbar */}
      <style>{`
        :root {
          --accent-gradient-start: #10b981;
          --accent-gradient-end: #14b8a6;
          --accent-color: #10b981;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }

        /* handy helper: use this class in other components to apply gradient backgrounds
           e.g. className="bg-gradient-accent" (but we didn't add a global class to avoid touching other files)
        */
        .bg-gradient-accent {
          background: linear-gradient(135deg, var(--accent-gradient-start), var(--accent-gradient-end));
        }

        /* === ADDED: Global .btn-primary uses the selected gradient ===
           This is the only addition — it ensures every element using .btn-primary
           will immediately reflect the chosen palette (including gradient).
        */
        .btn-primary {
          background: linear-gradient(135deg, var(--accent-gradient-start), var(--accent-gradient-end));
          color: #fff;
          border: none;
          border-radius: 0.5rem;
          padding: 0.5rem 1rem;
          font-weight: 500;
          transition: all 0.25s ease;
        }
        .btn-primary:hover {
          opacity: 0.95;
          transform: translateY(-1px);
        }
      `}</style>
    </>
  );
}
