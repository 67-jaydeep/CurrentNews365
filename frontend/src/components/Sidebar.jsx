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

export default function Sidebar() {
  const location = useLocation();
  const [open, setOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Handle responsive layout
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setOpen(!mobile);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Sidebar links
  const links = [
    { name: "Dashboard", icon: LayoutDashboard, path: "/admin/dashboard" },
    { name: "Posts", icon: FileText, path: "/admin/posts" },
    { name: "Create Post", icon: PenSquare, path: "/admin/editor" },
  ];

  return (
    <>
      {/* ===== Desktop Sidebar ===== */}
      {!isMobile && (
        <motion.aside
          animate={{ width: open ? 200 : 60 }}
          transition={{ type: "spring", stiffness: 230, damping: 25 }}
          className="fixed left-0 top-14 h-[calc(100vh-3.5rem)] bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 shadow-md z-40 flex flex-col overflow-hidden"
        >
          {/* Sidebar toggle button */}
          <button
            onClick={() => setOpen(!open)}
            className="absolute -right-3 top-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-md p-1 text-gray-500 hover:text-emerald-500 dark:text-gray-300 dark:hover:text-emerald-400 transition z-50"
            aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
          >
            {open ? (
              <ChevronLeft className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>

          {/* Navigation links */}
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
                        ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg"
                        : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  {open && (
                    <span
                      className={`text-sm font-medium truncate ${
                        active
                          ? "text-emerald-600 dark:text-emerald-400"
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
            {open ? "© 2025 CurrentNews365" : "©"}
          </div>
        </motion.aside>
      )}

      {/* ===== Mobile Bottom Navbar ===== */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-inner flex justify-around py-2 z-40">
          {links.map(({ name, icon: Icon, path }) => {
            const active = location.pathname === path;
            return (
              <Link
                key={name}
                to={path}
                className={`flex flex-col items-center text-xs ${
                  active
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-gray-600 dark:text-gray-300 hover:text-emerald-500"
                }`}
              >
                <div
                  className={`w-9 h-9 flex items-center justify-center rounded-md ${
                    active
                      ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md"
                      : "text-gray-700 dark:text-gray-300"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[11px] mt-1">{name}</span>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
