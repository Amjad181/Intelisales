import { apiGet, apiPost, apiPatch, apiRequest } from "../apiClient.js";
import { buildQueryString } from "../queryString.js";

export async function listInvoices({ page, limit } = {}) {
  const res = await apiGet(`/invoices${buildQueryString({ page, limit })}`);
  return { items: res.data || [], pagination: res.pagination || null };
}

export async function getInvoice(id) {
  const res = await apiGet(`/invoices/${id}`);
  return res.data;
}

export async function createInvoice(payload) {
  const res = await apiPost("/invoices", payload);
  return res.data;
}

export async function updateInvoice(id, payload) {
  const res = await apiPatch(`/invoices/${id}`, payload);
  return res.data;
}

export async function confirmInvoice(id) {
  const res = await apiPatch(`/invoices/${id}/confirm`, {});
  return res.data;
}

export async function archiveInvoice(id) {
  const res = await apiPatch(`/invoices/${id}/archive`, {});
  return res.data;
}

export async function markInvoiceSent(id) {
  const res = await apiPatch(`/invoices/${id}/mark-sent`, {});
  return res.data;
}

export async function recordInvoicePayment(id, payload) {
  const res = await apiPatch(`/invoices/${id}/payment`, payload);
  return res.data;
}

export async function getInvoicePdfBlob(id) {
  return apiRequest(`/invoices/${id}/pdf`, { method: "GET" });
}
