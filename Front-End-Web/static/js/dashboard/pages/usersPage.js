import { dataStore } from "../state/dataStore.js";
import { escapeHtml } from "../utils/html.js";
import { renderRowActions } from "../components/tableActions.js";
import { t } from "../../i18n/i18n.js";
import { labelRole, labelUserStatus } from "../../i18n/labels.js";

function formatDate(value) {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date.toLocaleDateString() : "—";
}

export function renderUsersPage() {
  const rows = dataStore.users
    .map(
      (u) => `
        <tr>
          <td>
            <div class="cell-stack">
              <span class="td-strong">${escapeHtml(u.name)}</span>
              <span class="td-sub">${escapeHtml(u.email)}${u.user_id ? ` • ${escapeHtml(String(u.user_id))}` : ""}</span>
            </div>
          </td>
          <td>${escapeHtml(labelRole(u.role))}</td>
          <td>${escapeHtml(u.phone || "—")}</td>
          <td>${escapeHtml(formatDate(u.created_at))}</td>
          <td><span class="badge ${u.status === "Active" ? "badge--ok" : u.status === "On Leave" ? "badge--warn" : "badge--neutral"}">${escapeHtml(labelUserStatus(u.status))}</span></td>
          <td class="td-actions">${renderRowActions("user", u.id)}</td>
        </tr>
      `
    )
    .join("");

  return `
    <section class="panel panel--flush">
      <div class="toolbar">
        <input class="search-input table-filter" type="search" data-table="users" placeholder="${escapeHtml(t("users.searchPh"))}" />
        <button class="primary-btn toolbar-primary" type="button" data-action="open-entity-form" data-entity="user" data-mode="add">${escapeHtml(t("users.add"))}</button>
      </div>
      <div class="table-shell">
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>${escapeHtml(t("users.thUser"))}</th>
                <th>${escapeHtml(t("users.thRole"))}</th>
                <th>${escapeHtml(t("users.thPhone"))}</th>
                <th>${escapeHtml(t("users.thCreatedAt"))}</th>
                <th>${escapeHtml(t("users.thStatus"))}</th>
                <th class="th-actions">${escapeHtml(t("common.actions"))}</th>
              </tr>
            </thead>
            <tbody id="usersTableBody">${rows}</tbody>
          </table>
        </div>
      </div>
    </section>
  `;
}
