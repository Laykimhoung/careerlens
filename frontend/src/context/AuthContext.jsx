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
      // DEMO INTERCEPT: Allow test credentials without a backend
      if (credentials.email === "candidate@test.com" && credentials.password === "password123") {
        const mockUser = { id: 1, full_name: "Dara Sok", email: "candidate@test.com", role: "candidate" };
        setTokenState("demo-jwt-token");
        setUser(mockUser);
        setLoading(false);
        return { success: true, role: "candidate" };
      }
      if (credentials.email === "company@test.com" && credentials.password === "password123") {
        const mockUser = { id: 2, full_name: "TechNova Cambodia", email: "company@test.com", role: "company" };
        setTokenState("demo-jwt-token");
        setUser(mockUser);
        setLoading(false);
        return { success: true, role: "company" };
      }
      if (credentials.email === "admin@test.com" && credentials.password === "password123") {
        const mockUser = { id: 3, full_name: "Platform Admin", email: "admin@test.com", role: "admin" };
        setTokenState("demo-jwt-token");
        setUser(mockUser);
        setLoading(false);
        return { success: true, role: "admin" };
      }

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

  const switchRole = useCallback((newRole) => {
    let newName = "Dara Sok";
    let assignedRole = newRole;

    if (newRole === "company") {
      newName = "TechNova Cambodia";
    } else if (newRole === "admin") {
      newName = "Platform Admin";
    } else if (newRole === "student" || newRole === "candidate") {
      newName = "Dara Sok";
      assignedRole = "candidate"; // AppRoutes uses 'candidate'
    }

    const newUser = {
      id: 1,
      full_name: newName,
      email: "demo@test.com",
      role: assignedRole
    };

    setUser(newUser);
    
    // Auto-redirect to the corresponding dashboard to complete the sync
    if (newRole === "company") window.location.href = "/company";
    else if (newRole === "admin") window.location.href = "/admin";
    else window.location.href = "/candidate";
    
  }, [user]);

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
    switchRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}