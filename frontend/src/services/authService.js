import api from "./api";

export const loginApi = (data) => api.post("/auth/login/", data);
export const refreshTokenApi = (data) => api.post("/auth/login/refresh/", data);
export const registerApi = (data) => api.post("/auth/register/", data);
export const getMeApi = () => api.get("/auth/me/");
export const updateMeApi = (data) => api.patch("/auth/me/", data);
export const logoutApi = () => Promise.resolve({ data: { detail: "Logged out" } });
export const forgotPasswordApi = (data) => api.post("/auth/forgot-password/", data);
export const resetPasswordApi = (data) => api.post("/auth/reset-password/", data);

export const getGeminiKeyStatus = () => api.get("/auth/gemini-key/");
export const saveGeminiKey = (apiKey) => api.post("/auth/gemini-key/", { api_key: apiKey });
export const deleteGeminiKey = () => api.delete("/auth/gemini-key/");

export function serializeAuthUser(rawUser) {
  if (!rawUser) return null;
  const rawRole = String(rawUser.role || "CANDIDATE").toLowerCase();
  const fullName =
    rawUser.full_name ||
    [rawUser.first_name, rawUser.last_name].filter(Boolean).join(" ") ||
    rawUser.username ||
    rawUser.email ||
    "User";

  return {
    id: rawUser.id ?? null,
    username: rawUser.username || "",
    email: rawUser.email || "",
    first_name: rawUser.first_name || "",
    last_name: rawUser.last_name || "",
    full_name: fullName,
    name: fullName,
    role: rawRole,
    rawRole: String(rawUser.rawRole || rawUser.role || rawRole).toUpperCase(),
    is_active: rawUser.is_active ?? true,
    date_joined: rawUser.date_joined || null,
  };
}

export function normalizeAuthUser(rawUser) {
  const essential = serializeAuthUser(rawUser);
  if (!essential) return null;
  if (typeof rawUser.avatar === "string" && rawUser.avatar) {
    return { ...essential, avatar: rawUser.avatar };
  }
  return essential;
}