export const setItem = (key, value) => localStorage.setItem(key, value);
export const getItem = (key) => localStorage.getItem(key);
export const removeItem = (key) => localStorage.removeItem(key);

export const setToken = (token) => localStorage.setItem("access_token", token);
export const getToken = () => localStorage.getItem("access_token");
export const removeToken = () => localStorage.removeItem("access_token");

export const setRefreshToken = (token) => localStorage.setItem("refresh_token", token);
export const getRefreshToken = () => localStorage.getItem("refresh_token");
export const removeRefreshToken = () => localStorage.removeItem("refresh_token");

export const clearAuthStorage = () => {
  removeToken();
  removeRefreshToken();
  removeUser();
};

export const setUser = (user) => localStorage.setItem("user", JSON.stringify(user));
export const getUser = () => {
  const raw = localStorage.getItem("user");
  return raw ? JSON.parse(raw) : null;
};
export const removeUser = () => localStorage.removeItem("user");