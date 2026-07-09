import { apiGet } from "../apiClient.js";
import { getEntity } from "../extractors.js";

export async function getDashboardSummary() {
  return getEntity(await apiGet("/dashboard/summary"), "summary");
}

// Restricted to admin / manager / supervisor by the backend.
export async function getSalesRepsPerformance() {
  return getEntity(await apiGet("/dashboard/sales-reps"), "salesReps");
}
