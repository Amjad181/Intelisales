export const appState = {
  activeRoute: "overview",
  userRoleKey: "administrator",
  pagination: {
    customers: 1,
    inventory: 1,
    priceLists: 1,
    users: 1,
    invoices: 1,
    visits: 1,
  },
  // Server-side search term per list entity (empty string = no filter).
  search: {
    customers: "",
    inventory: "",
    priceLists: "",
    users: "",
    invoices: "",
    visits: "",
  },
};

export function setActiveRoute(routeKey) {
  appState.activeRoute = routeKey;
}

// Role-aware UI capabilities. The backend RBAC is authoritative (and still returns 403);
// this only hides actions the current role can't perform so they aren't shown before use.
const CAPABILITIES = {
  invoicePayment: new Set(["administrator", "salesManager", "accountant"]),
  invoiceMarkSent: new Set(["administrator", "salesManager", "accountant"]),
};

export function can(capability) {
  const roles = CAPABILITIES[capability];
  return roles ? roles.has(appState.userRoleKey) : true;
}

export function getListPage(entityKey) {
  return appState.pagination[entityKey] || 1;
}

export function setListPage(entityKey, page) {
  appState.pagination[entityKey] = Math.max(1, page);
}

export function getListSearch(entityKey) {
  return appState.search[entityKey] || "";
}

export function setListSearch(entityKey, value) {
  appState.search[entityKey] = value || "";
}
