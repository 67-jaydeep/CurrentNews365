import React, { createContext, useContext, useState, useEffect } from "react";
import api, { setAccessToken, clearAccessToken } from "../api";
import { motion } from "framer-motion";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasAttempted, setHasAttempted] = useState(false);

  useEffect(() => {
    let didRun = false; // ✅ prevents double effect in React StrictMode

    const verifyLogin = async () => {
      if (didRun || hasAttempted) return;
      didRun = true;
      setHasAttempted(true);

      try {
        await new Promise((res) => setTimeout(res, 200));
        console.log("🔹 Attempting session refresh...");

        const res = await api.post("/auth/refresh", {}, { withCredentials: true });
        const newAccess = res.data?.accessToken;

        if (newAccess) {
          setAccessToken(newAccess);
          const me = await api.get("/auth/me");
          setUser(me.data.user);
          console.log("✅ Session refreshed successfully.");
        } else {
          console.warn("⚠️ No new access token received.");
          clearAccessToken();
          setUser(null);
        }
      } catch (err) {
        const msg = err.response?.data?.msg || err.message;
        // ✅ stop loop if refresh endpoint fails (401 / 429 / network)
        if (err.response?.status === 429) {
          console.warn("🚫 Rate limit hit on refresh — skipping retry.");
        }
        console.warn("❌ Session refresh failed:", msg);
        clearAccessToken();
        setUser(null);
      } finally {
        // ensure loader stops even if refresh fails
        setTimeout(() => setLoading(false), 300);
      }
    };

    verifyLogin();
  }, [hasAttempted]);

  // 🧠 Login
  const login = async (email, password) => {
    try {
      const res = await api.post("/auth/login", { email, password });
      setAccessToken(res.data.accessToken);
      setUser(res.data.user);
      return { success: true };
    } catch (err) {
      const msg =
        err.response?.data?.msg ||
        err.response?.data?.error ||
        "Login failed. Please try again later.";
      return { success: false, error: msg };
    }
  };

  // 🚪 Logout
  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      /* ignore */
    } finally {
      clearAccessToken();
      setUser(null);
    }
  };

  // 🌀 Loader while checking session
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
            className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full"
          ></motion.div>
          <p className="mt-4 text-gray-600 dark:text-gray-300 text-sm">
            Checking session...
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
