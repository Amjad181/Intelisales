import { apiGet } from "../apiClient.js";
import { buildQueryString } from "../queryString.js";

export async function getDashboardSummary() {
  const res = await apiGet("/dashboard/summary");
  return res.data;
}

export async function getSalesRepsPerformance() {
  const res = await apiGet("/dashboard/sales-reps");
  return res.data;
}

export async function getRecentActivity(limit = 10) {
  const res = await apiGet(`/dashboard/recent-activity${buildQueryString({ limit })}`);
  return res.data;
}
