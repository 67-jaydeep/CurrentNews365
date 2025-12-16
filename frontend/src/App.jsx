import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// ✅ Context
import { useAuth } from "./context/AuthContext";

// ✅ Layouts & Pages
import AdminLayout from "./layouts/AdminLayout";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Posts from "./pages/Posts";
import Editor from "./pages/Editor";

// ✅ Main Public Site Pages
import MainSite from "./pages/MainSite";
import PostDetail from "./pages/PostDetail";

// 🆕 Static Pages
import About from "./pages/About";
import Contact from "./pages/Contact";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Terms from "./pages/Terms";
import EditorialPolicy  from "./pages/EditorialPolicy";

// ✅ Protected Route wrapper
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600 dark:text-gray-300">
        Checking session...
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      {/* 🌍 Public Main Site */}
      <Route path="/" element={<MainSite />} />
      <Route path="/:slug" element={<PostDetail />} />

      {/* 📄 Static Pages */}
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/editorial-policy" element={<EditorialPolicy />} />
      {/* 🔓 Public Route */}
      <Route path="/login" element={<Login />} />

      {/* 🔐 Protected Admin Routes */}
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

      {/* 📝 Posts List */}
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

      {/* ✏️ Create Post */}
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

      {/* ✏️ Edit Post by ID */}
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

      {/* Default Redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
