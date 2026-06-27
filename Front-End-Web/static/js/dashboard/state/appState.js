export const appState = {
  activeRoute: "overview",
  userRoleKey: "administrator",
};

export function setActiveRoute(routeKey) {
  appState.activeRoute = routeKey;
}
