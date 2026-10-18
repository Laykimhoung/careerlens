import api, { extractResults } from "./api";
import { getMeApi } from "./authService";

export const getCompanies = (params = {}) => api.get("/auth/companies/", { params });

export const getCompanyById = (id) => api.get(`/auth/companies/${id}/`);

export const updateCompanyProfile = (id, data) =>
  api.patch(`/auth/companies/${id}/`, data);

export const deleteCompanyProfile = (id) =>
  api.delete(`/auth/companies/${id}/`);

export async function getCurrentCompanyProfile(userId = null) {
  let targetUserId = userId;
  if (!targetUserId) {
    const meRes = await getMeApi();
    targetUserId = meRes.data?.id;
  }
  const res = await getCompanies();
  const list = extractResults(res);
  const found = list.find((co) => Number(co.user?.id) === Number(targetUserId));
  return found || null;
}

export const getCompanyProfile = (userId = null) => getCurrentCompanyProfile(userId);