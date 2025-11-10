import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  FileText,
  PenSquare,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";

export default function AdminLayout({ children, title = "Dashboard" }) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setSidebarOpen(!mobile);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const links = [
    { name: "Dashboard", icon: LayoutDashboard, path: "/admin/dashboard" },
    { name: "Posts", icon: FileText, path: "/admin/posts" },
    { name: "Create Post", icon: PenSquare, path: "/admin/editor" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Navbar */}
      <Navbar title={title} />

      <div className="flex flex-1 w-full overflow-hidden">
        {/* ===== Desktop Sidebar ===== */}
        {!isMobile && (
          <motion.aside
            animate={{ width: sidebarOpen ? 200 : 60 }}
            transition={{ type: "spring", stiffness: 230, damping: 25 }}
            className="hidden md:flex flex-col bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-r border-gray-200 dark:border-gray-800 shadow-md z-40 h-[calc(100vh-3.5rem)] fixed top-14 left-0 overflow-hidden"
          >
            {/* Toggle Button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="absolute -right-3 top-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-md p-1 text-gray-500 hover:text-[var(--accent-color)] dark:text-gray-300 dark:hover:text-[var(--accent-color)] transition z-50"
              aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            >
              {sidebarOpen ? (
                <ChevronLeft className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>

            {/* Navigation Links */}
            <nav className="flex-1 overflow-y-auto px-2 py-6 space-y-1">
              {links.map(({ name, icon: Icon, path }) => {
                const active = location.pathname === path;
                return (
                  <Link
                    key={name}
                    to={path}
                    className="flex items-center gap-3 p-2 rounded-lg transition-all duration-200"
                  >
                    <div
                      className={`w-9 h-9 flex items-center justify-center rounded-md ${
                        active
                          ? "bg-[var(--accent-color)] text-white shadow-lg"
                          : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    {sidebarOpen && (
                      <span
                        className={`text-sm font-medium truncate ${
                          active
                            ? "text-[var(--accent-color)]"
                            : "text-gray-800 dark:text-gray-200"
                        }`}
                      >
                        {name}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Footer */}
            <div className="px-3 py-3 border-t border-gray-200 dark:border-gray-800 text-xs text-gray-500 dark:text-gray-400 text-center">
              {sidebarOpen ? "© 2025 Blogyy" : "©"}
            </div>
          </motion.aside>
        )}

        {/* ===== Main Content ===== */}
        <main
          className={`flex-1 w-full p-4 sm:p-6 mt-14 md:mt-14 mb-[65px] md:mb-0 transition-all duration-300 overflow-y-auto ${
            isMobile ? "" : sidebarOpen ? "md:ml-[200px]" : "md:ml-[60px]"
          }`}
        >
          {children}
        </main>
      </div>

      {/* ===== Mobile Bottom Navbar ===== */}
      {isMobile && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-lg flex justify-around py-2 z-40">
          {links.map(({ name, icon: Icon, path }) => {
            const active = location.pathname === path;
            return (
              <Link
                key={name}
                to={path}
                className={`flex flex-col items-center text-xs ${
                  active
                    ? "text-[var(--accent-color)]"
                    : "text-gray-600 dark:text-gray-300 hover:text-[var(--accent-color)]"
                }`}
              >
                <div
                  className={`w-9 h-9 flex items-center justify-center rounded-md ${
                    active
                      ? "bg-[var(--accent-color)] text-white shadow-md"
                      : "text-gray-700 dark:text-gray-300"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[11px] mt-1">{name}</span>
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}
