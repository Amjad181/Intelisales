import { apiGet, apiPost, apiPatch, apiDelete } from "../apiClient.js";
import { buildQueryString } from "../queryString.js";
import { getList, getEntity } from "../extractors.js";

export async function listProducts(params = {}) {
  const { page, limit, search, status, category, brand, minPrice, maxPrice, sortBy, sortOrder } = params;
  const res = await apiGet(
    `/products${buildQueryString({ page, limit, search, status, category, brand, minPrice, maxPrice, sortBy, sortOrder })}`
  );
  return getList(res);
}

// Dedicated selector route for building price lists / invoices — returns a paginated data array.
export async function listProductsForPriceList(params = {}) {
  const { page, limit, search } = params;
  const res = await apiGet(`/products/price-list${buildQueryString({ page, limit, search })}`);
  return getList(res);
}

export async function getProduct(id) {
  return getEntity(await apiGet(`/products/${id}`), "product");
}

export async function createProduct(payload) {
  return getEntity(await apiPost("/products", payload), "product");
}

export async function updateProduct(id, payload) {
  return getEntity(await apiPatch(`/products/${id}`, payload), "product");
}

// DELETE performs a soft deactivate on the backend.
export async function deleteProduct(id) {
  await apiDelete(`/products/${id}`);
}

export async function updateProductPrice(id, payload) {
  return getEntity(await apiPatch(`/products/${id}/price`, payload), "product");
}
