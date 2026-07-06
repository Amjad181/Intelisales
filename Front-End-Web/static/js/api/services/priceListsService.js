import { apiGet, apiPost, apiPatch, apiDelete } from "../apiClient.js";
import { buildQueryString } from "../queryString.js";

export async function listPriceLists({ page, limit } = {}) {
  const res = await apiGet(`/price-lists${buildQueryString({ page, limit })}`);
  return { items: res.data || [], pagination: res.pagination || null };
}

export async function getPriceList(id) {
  const res = await apiGet(`/price-lists/${id}`);
  return res.data;
}

export async function getPriceListsByCustomerType(customerType) {
  const res = await apiGet(`/price-lists/customer-type/${customerType}`);
  return res.data || [];
}

export async function createPriceList(payload) {
  const res = await apiPost("/price-lists", payload);
  return res.data;
}

export async function updatePriceList(id, payload) {
  const res = await apiPatch(`/price-lists/${id}`, payload);
  return res.data;
}

export async function deletePriceList(id) {
  await apiDelete(`/price-lists/${id}`);
}

// The backend has no separate price-list-item endpoint — items live inline on the
// price list resource (`items[].productId/price/currency`), so item add/edit/remove
// is a read-modify-write against the parent list's `items` array.

export async function addPriceListItem(priceListId, item) {
  const priceList = await getPriceList(priceListId);
  const items = [...(priceList.items || []), item];
  return updatePriceList(priceListId, { items });
}

export async function updatePriceListItem(priceListId, itemIndex, item) {
  const priceList = await getPriceList(priceListId);
  const items = [...(priceList.items || [])];
  items[itemIndex] = { ...items[itemIndex], ...item };
  return updatePriceList(priceListId, { items });
}

export async function removePriceListItem(priceListId, itemIndex) {
  const priceList = await getPriceList(priceListId);
  const items = (priceList.items || []).filter((_, index) => index !== itemIndex);
  return updatePriceList(priceListId, { items });
}
