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
};

export function setActiveRoute(routeKey) {
  appState.activeRoute = routeKey;
}

export function getListPage(entityKey) {
  return appState.pagination[entityKey] || 1;
}

export function setListPage(entityKey, page) {
  appState.pagination[entityKey] = Math.max(1, page);
}
