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
// ✅ Main Public Site Page
import MainSite from "./pages/MainSite";
import PostDetail from "./pages/PostDetail";
// 🆕 create this page as your public homepage

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
