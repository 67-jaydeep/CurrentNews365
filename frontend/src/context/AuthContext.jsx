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
        if (err.response?.status === 429) {
          console.warn("🚫 Rate limit hit on refresh — skipping retry.");
        }
        console.warn("❌ Session refresh failed:", msg);
        clearAccessToken();
        setUser(null);
      } finally {
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

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {loading ? (
        // ✅ LOADER (unchanged UI)
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
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
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
