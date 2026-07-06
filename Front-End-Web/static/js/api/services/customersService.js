import { apiGet, apiPost, apiPatch, apiDelete } from "../apiClient.js";
import { buildQueryString } from "../queryString.js";

export async function listCustomers({ page, limit } = {}) {
  const res = await apiGet(`/customers${buildQueryString({ page, limit })}`);
  return { items: res.data || [], pagination: res.pagination || null };
}

export async function getCustomer(id) {
  const res = await apiGet(`/customers/${id}`);
  return res.data;
}

export async function createCustomer(payload) {
  const res = await apiPost("/customers", payload);
  return res.data;
}

export async function updateCustomer(id, payload) {
  const res = await apiPatch(`/customers/${id}`, payload);
  return res.data;
}

export async function deleteCustomer(id) {
  await apiDelete(`/customers/${id}`);
}

export async function assignCustomer(id, assignedSalesRep) {
  const res = await apiPatch(`/customers/${id}/assign`, { assignedSalesRep });
  return res.data;
}
