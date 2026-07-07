import { apiGet } from "../apiClient.js";
import { buildQueryString } from "../queryString.js";
import { getEntity } from "../extractors.js";

export async function getDashboardSummary() {
  return getEntity(await apiGet("/dashboard/summary"), "summary");
}

// Restricted to admin / manager / supervisor by the backend.
export async function getSalesRepsPerformance() {
  return getEntity(await apiGet("/dashboard/sales-reps"), "salesReps");
}

export async function getRecentActivity(limit = 10) {
  return getEntity(await apiGet(`/dashboard/recent-activity${buildQueryString({ limit })}`), "activity");
}
