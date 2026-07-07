import { apiGet, apiPost, apiPatch, apiDelete } from "../apiClient.js";
import { buildQueryString } from "../queryString.js";
import { getList, getEntity } from "../extractors.js";

export async function listPriceLists(params = {}) {
  const { page, limit, customerType, status, search, sortBy, sortOrder } = params;
  const res = await apiGet(
    `/price-lists${buildQueryString({ page, limit, customerType, status, search, sortBy, sortOrder })}`
  );
  return getList(res);
}

export async function getPriceList(id) {
  return getEntity(await apiGet(`/price-lists/${id}`), "priceList");
}

// Customer-type lookup returns a single price list under data.priceList, NOT an array.
export async function getPriceListByCustomerType(customerType) {
  return getEntity(await apiGet(`/price-lists/customer-type/${customerType}`), "priceList");
}

export async function createPriceList(payload) {
  return getEntity(await apiPost("/price-lists", payload), "priceList");
}

export async function updatePriceList(id, payload) {
  return getEntity(await apiPatch(`/price-lists/${id}`, payload), "priceList");
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
