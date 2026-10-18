import { createContext, useState, useEffect, useCallback } from "react";
import {
  setToken,
  getToken,
  removeToken,
  setUser as saveUser,
  getUser as loadUser,
  removeUser,
} from "../utils/storage";
import {
  loginApi,
  registerApi,
  logoutApi,
  getMeApi,
  normalizeAuthUser,
} from "../services/authService";

export const AuthContext = createContext(null);

const DEMO_ROLE_CREDENTIALS = {
  candidate: { username: "demo_cand_sreymom", password: "CareerLens2026!Demo" },
  student: { username: "demo_cand_sreymom", password: "CareerLens2026!Demo" },
  company: { username: "demo_comp_mekong", password: "CareerLens2026!Demo" },
  admin: { username: "demo_admin", password: "CareerLens2026!Demo" },
};

function extractApiError(err, fallback) {
  const data = err?.response?.data;
  if (!data) {
    if (err?.message === "Network Error" || err?.code === "ERR_NETWORK") {
      return "Unable to connect to the server. Please ensure the Django backend is running (http://127.0.0.1:8000).";
    }
    return err?.message || fallback;
  }
  if (typeof data === "string") return data;
  if (data.detail) return data.detail;
  if (Array.isArray(data.non_field_errors) && data.non_field_errors[0]) {
    return data.non_field_errors[0];
  }
  const firstKey = Object.keys(data)[0];
  if (firstKey) {
    const val = data[firstKey];
    if (Array.isArray(val) && val[0]) return `${firstKey}: ${val[0]}`;
    if (typeof val === "string") return `${firstKey}: ${val}`;
  }
  return fallback;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const storedToken = getToken();
    if (!storedToken || storedToken === "demo-jwt-token" || storedToken === "fake-jwt") {
      removeToken();
      removeUser();
      return null;
    }
    return normalizeAuthUser(loadUser());
  });
  const [token, setTokenState] = useState(() => {
    const storedToken = getToken();
    if (!storedToken || storedToken === "demo-jwt-token" || storedToken === "fake-jwt") {
      return null;
    }
    return storedToken;
  });
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

  const refreshUser = useCallback(async () => {
    const currentToken = getToken();
    if (!currentToken) return null;
    try {
      const meRes = await getMeApi();
      const normalized = normalizeAuthUser(meRes.data);
      saveUser(normalized);
      setUser(normalized);
      return normalized;
    } catch {
      return null;
    }
  }, []);

  // Verify token and refresh user profile on initial mount
  useEffect(() => {
    if (token) {
      refreshUser();
    }
  }, [token, refreshUser]);

  const login = useCallback(async (credentials) => {
    setLoading(true);
    setError(null);
    try {
      const identifier = (credentials.username || credentials.email || "").trim();
      const response = await loginApi({
        username: identifier,
        email: identifier,
        password: credentials.password,
      });
      const { access } = response.data;
      setToken(access);
      setTokenState(access);

      const meRes = await getMeApi();
      const normalizedUser = normalizeAuthUser(meRes.data);
      saveUser(normalizedUser);
      setUser(normalizedUser);

      return { success: true, role: normalizedUser.role, user: normalizedUser };
    } catch (err) {
      removeToken();
      removeUser();
      setTokenState(null);
      setUser(null);
      const message = extractApiError(
        err,
        "Login failed. Please check your username/email and password."
      );
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
      if (
        formData.confirm_password !== undefined &&
        formData.password !== formData.confirm_password
      ) {
        const msg = "Passwords do not match.";
        setError(msg);
        return { success: false, error: msg };
      }

      const isCompanyRole =
        String(formData.role || "").toLowerCase() === "company";
      const email = (
        isCompanyRole
          ? formData.work_email || formData.email
          : formData.email
      )?.trim();

      const emailPrefix = (email || "user")
        .split("@")[0]
        .replace(/[^a-zA-Z0-9_]/g, "_")
        .toLowerCase();
      const username =
        formData.username?.trim() ||
        `${emailPrefix}_${Math.floor(100 + Math.random() * 900)}`;

      const nameParts = String(formData.full_name || "")
        .trim()
        .split(/\s+/)
        .filter(Boolean);
      const firstName = isCompanyRole
        ? formData.company_name || ""
        : nameParts[0] || "";
      const lastName = isCompanyRole ? "" : nameParts.slice(1).join(" ");

      const payload = {
        username,
        email,
        password: formData.password,
        first_name: firstName,
        last_name: lastName,
        role: isCompanyRole ? "COMPANY" : "CANDIDATE",
        ...(isCompanyRole
          ? {
              company_name: formData.company_name || firstName,
              industry: formData.industry || "",
              size: formData.company_size || formData.size || "",
              location: formData.location || "",
              website: formData.website || "",
            }
          : {
              university: formData.university || "",
              major: formData.major || "",
              graduation_year: formData.graduation_year
                ? Number(formData.graduation_year)
                : null,
            }),
      };

      await registerApi(payload);

      // Automatically sign in the newly registered user
      const loginRes = await loginApi({
        username: payload.username,
        password: payload.password,
      });
      const { access } = loginRes.data;
      setToken(access);
      setTokenState(access);

      const meRes = await getMeApi();
      const normalizedUser = normalizeAuthUser(meRes.data);
      saveUser(normalizedUser);
      setUser(normalizedUser);

      return { success: true, role: normalizedUser.role, user: normalizedUser };
    } catch (err) {
      const message = extractApiError(
        err,
        "Registration failed. Please check your details and try again."
      );
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
      removeToken();
      removeUser();
      setTokenState(null);
      setUser(null);
      setLoading(false);
    }
  }, [token]);

  const clearError = useCallback(() => setError(null), []);

  const switchRole = useCallback(
    async (newRole) => {
      const normalizedTarget =
        newRole === "student" ? "candidate" : String(newRole || "candidate").toLowerCase();
      const creds = DEMO_ROLE_CREDENTIALS[normalizedTarget];
      if (!creds) return;

      const res = await login(creds);
      if (res.success) {
        if (normalizedTarget === "company") window.location.href = "/company";
        else if (normalizedTarget === "admin") window.location.href = "/admin";
        else window.location.href = "/candidate";
      }
    },
    [login]
  );

  // Role helpers
  const isAuthenticated = Boolean(token && user);
  const isCandidate = isAuthenticated && user?.role === "candidate";
  const isCompany = isAuthenticated && user?.role === "company";
  const isAdmin = isAuthenticated && user?.role === "admin";

  const value = {
    user,
    setUser,
    refreshUser,
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