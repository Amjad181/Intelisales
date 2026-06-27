import { t } from "../../i18n/i18n.js";
import { escapeHtml } from "../utils/html.js";
import { renderLangSwitch } from "../../i18n/langSwitch.js";

export function renderTopbar(title, roleLabel) {
  return `
    <div class="topbar-start">
      <button type="button" class="mobile-menu-btn" data-action="toggle-sidebar" aria-label="Toggle menu">
        <span class="hamburger-line"></span>
        <span class="hamburger-line"></span>
        <span class="hamburger-line"></span>
      </button>
      <div>
        <p class="eyebrow">${escapeHtml(roleLabel)}</p>
        <h2>${escapeHtml(title)}</h2>
      </div>
    </div>
    <div class="topbar-actions">
      ${renderLangSwitch("lang-switch")}
      <button type="button" class="logout-btn" data-action="logout">${escapeHtml(t("dashboard.logout"))}</button>
    </div>
  `;
}
