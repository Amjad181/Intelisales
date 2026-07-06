import { apiGet, apiPost, apiPatch, apiDelete } from "../apiClient.js";
import { buildQueryString } from "../queryString.js";

export async function listProducts({ page, limit } = {}) {
  const res = await apiGet(`/products${buildQueryString({ page, limit })}`);
  return { items: res.data || [], pagination: res.pagination || null };
}

export async function getProduct(id) {
  const res = await apiGet(`/products/${id}`);
  return res.data;
}

export async function createProduct(payload) {
  const res = await apiPost("/products", payload);
  return res.data;
}

export async function updateProduct(id, payload) {
  const res = await apiPatch(`/products/${id}`, payload);
  return res.data;
}

export async function deleteProduct(id) {
  await apiDelete(`/products/${id}`);
}

export async function updateProductPrice(id, payload) {
  const res = await apiPatch(`/products/${id}/price`, payload);
  return res.data;
}
