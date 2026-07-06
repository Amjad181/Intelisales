import { apiPost, apiGet } from "./apiClient.js";
import {
  getAccessToken,
  setAccessToken,
  setRefreshToken,
  getStoredUser,
  setStoredUser,
  clearAuthStorage,
} from "./tokenStorage.js";

export async function login(email, password) {
  const res = await apiPost("/auth/login", { email, password });
  const { accessToken, refreshToken, user } = res.data || {};
  if (accessToken) setAccessToken(accessToken);
  if (refreshToken) setRefreshToken(refreshToken);
  if (user) setStoredUser(user);
  return res.data;
}

export async function logout() {
  try {
    await apiPost("/auth/logout", {});
  } catch {
    // best-effort; ignore network/logout errors, we still clear local state below
  } finally {
    clearAuthStorage();
  }
}

export function isAuthenticated() {
  return Boolean(getAccessToken());
}

export function getCachedUser() {
  return getStoredUser();
}

export async function refreshCurrentUser() {
  const res = await apiGet("/auth/me");
  if (res?.data) setStoredUser(res.data);
  return res?.data;
}
