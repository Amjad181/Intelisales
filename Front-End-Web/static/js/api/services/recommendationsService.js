import { apiGet } from "../apiClient.js";
import { buildQueryString } from "../queryString.js";

export async function getCustomerRecommendations(customerId, { limit, includeHistory } = {}) {
  const res = await apiGet(
    `/recommendations/customers/${customerId}/products${buildQueryString({ limit, includeHistory })}`
  );
  return res.data;
}
