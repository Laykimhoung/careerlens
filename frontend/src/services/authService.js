import api from "./api";

export const loginApi = (data) => api.post("/auth/login/", data);
export const refreshTokenApi = (data) => api.post("/auth/login/refresh/", data);
export const registerApi = (data) => api.post("/auth/register/", data);
export const getMeApi = () => api.get("/auth/me/");
export const updateMeApi = (data) => api.patch("/auth/me/", data);
export const logoutApi = () => Promise.resolve({ data: { detail: "Logged out" } });
export const forgotPasswordApi = (data) => api.post("/auth/forgot-password/", data);
export const resetPasswordApi = (data) => api.post("/auth/reset-password/", data);

export function normalizeAuthUser(rawUser) {
  if (!rawUser) return null;
  const rawRole = String(rawUser.role || "CANDIDATE").toLowerCase();
  const fullName =
    rawUser.full_name ||
    [rawUser.first_name, rawUser.last_name].filter(Boolean).join(" ") ||
    rawUser.username ||
    rawUser.email ||
    "User";
  return {
    ...rawUser,
    role: rawRole,
    rawRole: String(rawUser.role || rawRole).toUpperCase(),
    full_name: fullName,
    name: fullName,
  };
}