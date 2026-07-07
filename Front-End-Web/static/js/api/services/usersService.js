import { apiGet, apiPost, apiPatch, apiDelete } from "../apiClient.js";
import { buildQueryString } from "../queryString.js";
import { getList, getEntity } from "../extractors.js";

export async function listUsers(params = {}) {
  const { page, limit, search, role, status, sortBy, sortOrder } = params;
  const res = await apiGet(`/users${buildQueryString({ page, limit, search, role, status, sortBy, sortOrder })}`);
  return getList(res);
}

export async function getUser(id) {
  return getEntity(await apiGet(`/users/${id}`), "user");
}

export async function createUser(payload) {
  return getEntity(await apiPost("/users", payload), "user");
}

export async function updateUser(id, payload) {
  return getEntity(await apiPatch(`/users/${id}`, payload), "user");
}

export async function deleteUser(id) {
  await apiDelete(`/users/${id}`);
}

// Password reset returns a success envelope; its data payload isn't consumed by the UI.
export async function updateUserPassword(id, password) {
  const res = await apiPatch(`/users/${id}/password`, { password });
  return res?.data ?? null;
}
