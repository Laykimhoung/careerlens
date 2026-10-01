import api from "./api";

export const loginApi = (data) => api.post("/auth/login/", data);
export const registerApi = (data) => api.post("/auth/register/", data);
export const logoutApi = () => api.post("/auth/logout/");
export const forgotPasswordApi = (data) => api.post("/auth/forgot-password/", data);
export const resetPasswordApi = (data) => api.post("/auth/reset-password/", data);