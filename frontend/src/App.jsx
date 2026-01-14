import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { motion } from "framer-motion";

// Layouts & Pages
import AdminLayout from "./layouts/AdminLayout";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Posts from "./pages/Posts";
import Editor from "./pages/Editor";

import MainSite from "./pages/MainSite";
import PostDetail from "./pages/PostDetail";

import About from "./pages/About";
import Contact from "./pages/Contact";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Terms from "./pages/Terms";
import EditorialPolicy from "./pages/EditorialPolicy";
console.log("DEPLOY_MARKER: 2026-01-14-LOGIN-FIX");
// 🔐 Protected Route (NO LOADER HERE)
function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const { loading } = useAuth();

  // ✅ APP GATE (SINGLE GLOBAL LOADER)
  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <motion.h1
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="text-2xl font-bold text-[var(--accent-color)]"
          >
            CurrentNews365
          </motion.h1>

          <div className="flex gap-2">
            {[1, 2, 3].map((i) => (
              <motion.span
                key={i}
                animate={{ height: [8, 24, 8] }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  delay: i * 0.15,
                }}
                className="w-2 bg-[var(--accent-color)] rounded"
              />
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  // ✅ NORMAL APP AFTER AUTH RESOLVES
  return (
    <Routes>
      {/* Public Main Site */}
      <Route path="/" element={<MainSite />} />

      {/* Static Pages */}
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/editorial-policy" element={<EditorialPolicy />} />

      {/* Auth */}
      <Route path="/login" element={<Login />} />

      {/* Admin */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute>
            <AdminLayout title="Dashboard">
              <Dashboard />
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/posts"
        element={
          <ProtectedRoute>
            <AdminLayout title="Posts">
              <Posts />
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/editor"
        element={
          <ProtectedRoute>
            <AdminLayout title="Create Post">
              <Editor />
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/editor/:id"
        element={
          <ProtectedRoute>
            <AdminLayout title="Edit Post">
              <Editor />
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      {/* Article */}
      <Route path="/:slug" element={<PostDetail />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
