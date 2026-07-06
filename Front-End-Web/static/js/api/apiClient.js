import { API_BASE_URL } from "./config.js";
import { getAccessToken, getRefreshToken, setAccessToken, setRefreshToken, clearAuthStorage } from "./tokenStorage.js";

let refreshPromise = null;

async function performRefresh() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw { message: "No refresh token available" };

  const res = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok || !json || json.success === false) {
    throw json || { message: "Session expired" };
  }

  if (json.data?.accessToken) setAccessToken(json.data.accessToken);
  if (json.data?.refreshToken) setRefreshToken(json.data.refreshToken);
  return json.data?.accessToken;
}

function redirectToLogin() {
  clearAuthStorage();
  window.location.href = "./index.html";
}

export async function apiRequest(path, options = {}, _retried = false) {
  const token = getAccessToken();
  const headers = { ...(options.headers || {}) };
  if (!(options.body instanceof FormData)) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });

  if (res.status === 401 && !_retried && getRefreshToken()) {
    try {
      refreshPromise = refreshPromise || performRefresh();
      await refreshPromise;
      refreshPromise = null;
      return apiRequest(path, options, true);
    } catch (err) {
      refreshPromise = null;
      redirectToLogin();
      throw err;
    }
  }

  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/pdf")) {
    if (!res.ok) throw { message: "Request failed", status: res.status };
    return res.blob();
  }

  const json = await res.json().catch(() => null);
  if (!res.ok || json?.success === false) {
    if (res.status === 401) redirectToLogin();
    throw json || { message: "Request failed", status: res.status };
  }
  return json;
}

export const apiGet = (path, options = {}) => apiRequest(path, { ...options, method: "GET" });
export const apiPost = (path, body, options = {}) =>
  apiRequest(path, { ...options, method: "POST", body: JSON.stringify(body) });
export const apiPatch = (path, body, options = {}) =>
  apiRequest(path, { ...options, method: "PATCH", body: JSON.stringify(body) });
export const apiDelete = (path, options = {}) => apiRequest(path, { ...options, method: "DELETE" });
