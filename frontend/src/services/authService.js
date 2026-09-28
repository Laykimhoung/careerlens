import api from "./api";

export const login = (data) => api.post("/login", data);