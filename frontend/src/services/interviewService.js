import api, { extractResults } from "./api";

export const getInterviews = (params = {}) =>
  api.get("/interviews/", { params });

export const getInterviewById = (id) =>
  api.get(`/interviews/${id}/`);

export const createInterview = (data) =>
  api.post("/interviews/", data);

export const updateInterview = (id, data) =>
  api.patch(`/interviews/${id}/`, data);

export const deleteInterview = (id) =>
  api.delete(`/interviews/${id}/`);

export async function fetchInterviewsList(params = {}) {
  const res = await getInterviews(params);
  return extractResults(res);
}