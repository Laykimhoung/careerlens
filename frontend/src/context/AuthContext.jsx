import { createContext, useState, useEffect, useCallback } from "react";
import {
  setToken,
  getToken,
  removeToken,
  setUser as saveUser,
  getUser as loadUser,
  removeUser,
} from "../utils/storage";
import { loginApi, registerApi, logoutApi } from "../services/authService";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => loadUser());
  const [token, setTokenState] = useState(() => getToken());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Keep localStorage in sync whenever user/token changes
  useEffect(() => {
    if (token) setToken(token);
    else removeToken();
  }, [token]);

  useEffect(() => {
    if (user) saveUser(user);
    else removeUser();
  }, [user]);

  const login = useCallback(async (credentials) => {
    setLoading(true);
    setError(null);
    try {
      const response = await loginApi(credentials);
      const { access, user: userData } = response.data;
      setTokenState(access);
      setUser(userData);
      return { success: true, role: userData.role };
    } catch (err) {
      const message =
        err.response?.data?.detail ||
        err.response?.data?.non_field_errors?.[0] ||
        "Login failed. Please check your credentials.";
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (formData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await registerApi(formData);
      const { access, user: userData } = response.data;
      setTokenState(access);
      setUser(userData);
      return { success: true, role: userData.role };
    } catch (err) {
      const message =
        err.response?.data?.detail ||
        err.response?.data?.email?.[0] ||
        "Registration failed. Please try again.";
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      if (token) await logoutApi();
    } catch {
      // ignore logout API errors — still clear local state
    } finally {
      setTokenState(null);
      setUser(null);
      setLoading(false);
    }
  }, [token]);

  const clearError = useCallback(() => setError(null), []);

  // Role helpers
  const isAuthenticated = Boolean(token && user);
  const isCandidate = isAuthenticated && user?.role === "candidate";
  const isCompany = isAuthenticated && user?.role === "company";
  const isAdmin = isAuthenticated && user?.role === "admin";

  const value = {
    user,
    token,
    loading,
    error,
    isAuthenticated,
    isCandidate,
    isCompany,
    isAdmin,
    login,
    register,
    logout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}