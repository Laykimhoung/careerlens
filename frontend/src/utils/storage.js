const LEGACY_IMAGE_KEY_PREFIXES = [
  "careerlens_avatar",
  "careerlens_admin_avatar",
  "careerlens_company_logo",
];

export const clearLegacyImageStorage = () => {
  try {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (
        key &&
        LEGACY_IMAGE_KEY_PREFIXES.some(
          (prefix) => key === prefix || key.startsWith(`${prefix}_`)
        )
      ) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  } catch {
    // Ignore storage iteration errors in restricted browser contexts
  }
};

const safeSetItem = (key, value) => {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    // Evict legacy oversized base64 image keys that exhaust origin storage quota
    clearLegacyImageStorage();
    try {
      localStorage.setItem(key, value);
      return true;
    } catch {
      console.warn(`Storage quota exceeded while saving key "${key}".`);
      return false;
    }
  }
};

const extractEssentialUser = (user) => {
  if (!user || typeof user !== "object") return null;
  const rawRole = String(user.role || "CANDIDATE").toLowerCase();
  const fullName =
    user.full_name ||
    [user.first_name, user.last_name].filter(Boolean).join(" ") ||
    user.username ||
    user.email ||
    "User";

  return {
    id: user.id ?? null,
    username: user.username || "",
    email: user.email || "",
    first_name: user.first_name || "",
    last_name: user.last_name || "",
    full_name: fullName,
    name: fullName,
    role: rawRole,
    rawRole: String(user.rawRole || user.role || rawRole).toUpperCase(),
    is_active: user.is_active ?? true,
    date_joined: user.date_joined || null,
  };
};

export const setItem = (key, value) => safeSetItem(key, value);
export const getItem = (key) => localStorage.getItem(key);
export const removeItem = (key) => localStorage.removeItem(key);

export const setToken = (token) => safeSetItem("access_token", token);
export const getToken = () => localStorage.getItem("access_token");
export const removeToken = () => localStorage.removeItem("access_token");

export const setRefreshToken = (token) => safeSetItem("refresh_token", token);
export const getRefreshToken = () => localStorage.getItem("refresh_token");
export const removeRefreshToken = () => localStorage.removeItem("refresh_token");

export const clearAuthStorage = () => {
  removeToken();
  removeRefreshToken();
  removeUser();
  clearLegacyImageStorage();
};

export const setUser = (user) => {
  const essential = extractEssentialUser(user);
  if (!essential) {
    removeUser();
    return;
  }
  const serialized = JSON.stringify(essential);
  if (localStorage.getItem("user") === serialized) {
    return;
  }
  safeSetItem("user", serialized);
};

export const getUser = () => {
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const essential = extractEssentialUser(parsed);
    // Upgrade/compact any legacy oversized "user" entry sitting in storage
    if (
      parsed &&
      ("avatar" in parsed ||
        "profile_picture" in parsed ||
        "logo" in parsed ||
        raw.length > 2048)
    ) {
      safeSetItem("user", JSON.stringify(essential));
      clearLegacyImageStorage();
    }
    return essential;
  } catch {
    removeUser();
    return null;
  }
};

export const removeUser = () => localStorage.removeItem("user");