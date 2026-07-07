import { apiGet, apiPost, apiPatch, apiRequest } from "../apiClient.js";
import { buildQueryString } from "../queryString.js";
import { getList, getEntity } from "../extractors.js";

export async function listInvoices(params = {}) {
  const { page, limit, search, invoiceStatus, paymentStatus, customerId, createdBy, dateFrom, dateTo, sortBy, sortOrder } = params;
  const res = await apiGet(
    `/invoices${buildQueryString({ page, limit, search, invoiceStatus, paymentStatus, customerId, createdBy, dateFrom, dateTo, sortBy, sortOrder })}`
  );
  return getList(res);
}

export async function getInvoice(id) {
  return getEntity(await apiGet(`/invoices/${id}`), "invoice");
}

// Draft creation — backend resolves the customer-type price list and calculates all totals.
export async function createInvoice(payload) {
  return getEntity(await apiPost("/invoices", payload), "invoice");
}

// Only drafts are editable; the backend enforces this.
export async function updateInvoice(id, payload) {
  return getEntity(await apiPatch(`/invoices/${id}`, payload), "invoice");
}

export async function confirmInvoice(id) {
  return getEntity(await apiPatch(`/invoices/${id}/confirm`, {}), "invoice");
}

// Invoices are archived, never deleted — there is no DELETE invoice route.
export async function archiveInvoice(id) {
  return getEntity(await apiPatch(`/invoices/${id}/archive`, {}), "invoice");
}

export async function markInvoiceSent(id) {
  return getEntity(await apiPatch(`/invoices/${id}/mark-sent`, {}), "invoice");
}

// paidAmount is cumulative; paymentMethod is Cash.
export async function recordInvoicePayment(id, payload) {
  return getEntity(await apiPatch(`/invoices/${id}/payment`, payload), "invoice");
}

// Returns raw application/pdf bytes as a Blob on success; JSON errors are thrown by apiRequest.
export async function getInvoicePdfBlob(id) {
  return apiRequest(`/invoices/${id}/pdf`, { method: "GET" });
}
