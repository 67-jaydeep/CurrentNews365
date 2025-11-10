import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, LogIn, XCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setShowToast(false);
    setSubmitting(true);

    const result = await login(email, password); // ✅ store result object
    setSubmitting(false);

    if (result.success) {
      navigate("/admin/dashboard");
    } else {
      setError(result.error);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 4000); // auto-hide toast
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 transition-colors duration-300 relative overflow-hidden">
      {/* -------- Toast Notification -------- */}
      <AnimatePresence>
        {showToast && error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="absolute top-6 left-1/2 -translate-x-1/2 px-4 py-3 bg-red-500 text-white rounded-lg shadow-lg flex items-center gap-2 text-sm z-50"
          >
            <XCircle className="w-4 h-4" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* -------- Login Form -------- */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8"
      >
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-800 dark:text-gray-100">
          Admin Login
        </h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block mb-1 text-sm font-semibold text-gray-600 dark:text-gray-300">
              Email
            </label>
            <div className="flex items-center border border-gray-300 dark:border-gray-700 rounded-lg p-2 bg-gray-50 dark:bg-gray-900">
              <Mail className="w-5 h-5 mr-2 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                className="w-full bg-transparent outline-none text-gray-800 dark:text-gray-100"
                required
              />
            </div>
          </div>

          <div>
            <label className="block mb-1 text-sm font-semibold text-gray-600 dark:text-gray-300">
              Password
            </label>
            <div className="flex items-center border border-gray-300 dark:border-gray-700 rounded-lg p-2 bg-gray-50 dark:bg-gray-900">
              <Lock className="w-5 h-5 mr-2 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-transparent outline-none text-gray-800 dark:text-gray-100"
                required
              />
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            disabled={loading || submitting}
            type="submit"
            className={`w-full flex justify-center items-center gap-2 py-2 rounded-lg font-semibold text-white transition-all ${
              submitting ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            <LogIn className="w-5 h-5" />
            {submitting ? "Signing in..." : "Login"}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
