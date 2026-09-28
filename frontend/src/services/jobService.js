import api from "./api";

export const getJobs = () => api.get("/jobs");