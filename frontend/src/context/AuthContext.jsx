import React, { createContext, useContext, useState, useEffect } from "react";
import api, { setAccessToken, clearAccessToken } from "../api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const refreshSession = async () => {
      try {
        const res = await api.post("/auth/refresh");
        const token = res.data?.accessToken;

        if (token && !cancelled) {
          setAccessToken(token);
          const me = await api.get("/auth/me");
          if (!cancelled) setUser(me.data.user);
        }
      } catch {
        clearAccessToken();
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    refreshSession();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.post("/auth/login", { email, password });
      await api.post('/auth/refresh');
      const me = await api.get('/auth/me');
      setUser(me.data.user);
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error:
          err.response?.data?.msg ||
          "Login failed. Please try again later.",
      };
    }
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (err) {
  if (err.response?.status === 401 || err.response?.status === 403) {
    clearAccessToken();
    setUser(null);
  }

    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
