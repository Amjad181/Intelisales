import { apiGet, apiPost, apiPatch, apiDelete } from "../apiClient.js";
import { buildQueryString } from "../queryString.js";

export async function listUsers({ page, limit } = {}) {
  const res = await apiGet(`/users${buildQueryString({ page, limit })}`);
  return { items: res.data || [], pagination: res.pagination || null };
}

export async function getUser(id) {
  const res = await apiGet(`/users/${id}`);
  return res.data;
}

export async function createUser(payload) {
  const res = await apiPost("/users", payload);
  return res.data;
}

export async function updateUser(id, payload) {
  const res = await apiPatch(`/users/${id}`, payload);
  return res.data;
}

export async function deleteUser(id) {
  await apiDelete(`/users/${id}`);
}

export async function updateUserPassword(id, password) {
  const res = await apiPatch(`/users/${id}/password`, { password });
  return res.data;
}
