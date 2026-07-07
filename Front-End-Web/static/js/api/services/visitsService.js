import { apiGet, apiPost, apiPatch } from "../apiClient.js";
import { buildQueryString } from "../queryString.js";
import { getList, getEntity } from "../extractors.js";

export async function listVisits(params = {}) {
  const { page, limit, status, outcome, customer, salesRep, dateFrom, dateTo, search, sortBy, sortOrder } = params;
  const res = await apiGet(
    `/visits${buildQueryString({ page, limit, status, outcome, customer, salesRep, dateFrom, dateTo, search, sortBy, sortOrder })}`
  );
  return getList(res);
}

export async function getVisit(id) {
  return getEntity(await apiGet(`/visits/${id}`), "visit");
}

export async function createVisit(payload) {
  return getEntity(await apiPost("/visits", payload), "visit");
}

export async function updateVisit(id, payload) {
  return getEntity(await apiPatch(`/visits/${id}`, payload), "visit");
}

// Visit lifecycle: there is NO confirm route. A planned visit may be updated,
// completed (with outcome), or cancelled (with optional notes).
export async function completeVisit(id, payload) {
  return getEntity(await apiPatch(`/visits/${id}/complete`, payload), "visit");
}

export async function cancelVisit(id, payload = {}) {
  return getEntity(await apiPatch(`/visits/${id}/cancel`, payload), "visit");
}
