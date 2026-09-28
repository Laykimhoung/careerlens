import api from "./api";

export const getApplications = () => api.get("/applications");