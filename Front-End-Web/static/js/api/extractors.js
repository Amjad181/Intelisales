// Response extraction helpers for the tested IntelliSales (Module 12) backend contract.
//
// Success envelope: { success: true, message, data, count?, pagination? }
//   - Paginated lists: rows are DIRECTLY in `data` (an array); page info is in `pagination`;
//     total is in `count`.
//   - Single / action:  the entity is NESTED under a named key, e.g. `data.customer`,
//     `data.product`, `data.priceList`, `data.user`, `data.invoice`, `data.visit`,
//     `data.summary`, `data.salesReps`, `data.activity`.
//
// These helpers throw a clear ContractError when a required shape is missing, so a backend
// contract mismatch surfaces loudly instead of silently rendering "undefined"/em dashes.

export class ContractError extends Error {
  constructor(message) {
    super(message);
    this.name = "ContractError";
    this.isContractError = true;
  }
}

/** Rows of a paginated list — directly `response.data` (an array). */
export function getDataArray(res) {
  const data = res?.data;
  if (data == null) return [];
  if (!Array.isArray(data)) {
    throw new ContractError(`Expected response.data to be a list array, got ${typeof data}.`);
  }
  return data;
}

/** Pagination block — `response.pagination` (or null when not paginated). */
export function getPagination(res) {
  return res?.pagination || null;
}

/** Total count — `response.count` (or null when absent). */
export function getCount(res) {
  return typeof res?.count === "number" ? res.count : null;
}

/** Convenience wrapper returning the list shape the pages expect. */
export function getList(res) {
  return { items: getDataArray(res), pagination: getPagination(res), count: getCount(res) };
}

/** A nested single entity/action result — `response.data[key]`. */
export function getEntity(res, key) {
  const data = res?.data;
  if (data && Object.prototype.hasOwnProperty.call(data, key)) {
    return data[key];
  }
  throw new ContractError(`Expected "${key}" in response.data (backend contract mismatch).`);
}
