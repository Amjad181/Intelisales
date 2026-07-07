import { apiGet, apiPost, apiPatch, apiDelete } from "../apiClient.js";
import { buildQueryString } from "../queryString.js";
import { getList, getEntity } from "../extractors.js";

export async function listCustomers(params = {}) {
  const { page, limit, search, status, customerType, paymentType, assignedSalesRep, city, sortBy, sortOrder } = params;
  const res = await apiGet(
    `/customers${buildQueryString({ page, limit, search, status, customerType, paymentType, assignedSalesRep, city, sortBy, sortOrder })}`
  );
  return getList(res);
}

export async function getCustomer(id) {
  return getEntity(await apiGet(`/customers/${id}`), "customer");
}

export async function createCustomer(payload) {
  return getEntity(await apiPost("/customers", payload), "customer");
}

export async function updateCustomer(id, payload) {
  return getEntity(await apiPatch(`/customers/${id}`, payload), "customer");
}

export async function deleteCustomer(id) {
  await apiDelete(`/customers/${id}`);
}

// Assignment is a dedicated action — a normal update must NOT include assignedSalesRep.
export async function assignCustomer(id, assignedSalesRep) {
  return getEntity(await apiPatch(`/customers/${id}/assign`, { assignedSalesRep }), "customer");
}

// Documented balance route — never recalculate balance from visible invoice rows.
// The contract doesn't specify a nested key for this payload, so return data as-is.
export async function getCustomerBalance(id) {
  const res = await apiGet(`/customers/${id}/balance`);
  return res?.data ?? null;
}
