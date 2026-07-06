import { apiGet, apiPost, apiPatch } from "../apiClient.js";
import { buildQueryString } from "../queryString.js";

export async function listVisits({ page, limit } = {}) {
  const res = await apiGet(`/visits${buildQueryString({ page, limit })}`);
  return { items: res.data || [], pagination: res.pagination || null };
}

export async function getVisit(id) {
  const res = await apiGet(`/visits/${id}`);
  return res.data;
}

export async function createVisit(payload) {
  const res = await apiPost("/visits", payload);
  return res.data;
}

export async function updateVisit(id, payload) {
  const res = await apiPatch(`/visits/${id}`, payload);
  return res.data;
}

export async function confirmVisit(id) {
  const res = await apiPatch(`/visits/${id}/confirm`, {});
  return res.data;
}

export async function completeVisit(id, payload) {
  const res = await apiPatch(`/visits/${id}/complete`, payload);
  return res.data;
}

export async function cancelVisit(id) {
  const res = await apiPatch(`/visits/${id}/cancel`, {});
  return res.data;
}
