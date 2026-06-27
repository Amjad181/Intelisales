import { t } from "../../i18n/i18n.js";
import { escapeHtml } from "../utils/html.js";

export function renderSidebar(routes, activeRoute) {
  const routeButtons = routes
    .map(
      (route) => `
        <button
          type="button"
          class="${activeRoute === route.key ? "active" : ""}"
          data-route="${route.key}"
        >
          ${escapeHtml(t(`nav.${route.key}`))}
        </button>
      `
    )
    .join("");

  return `
    <h1>${escapeHtml(t("meta.appName"))}</h1>
    <p class="admin-badge">${escapeHtml(t("dashboard.adminWorkspace"))}</p>
    <nav>${routeButtons}</nav>
  `;
}
