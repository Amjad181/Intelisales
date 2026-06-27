import { dataStore, getUserName } from "../state/dataStore.js";
import { escapeHtml } from "../utils/html.js";
import { renderRowActions } from "../components/tableActions.js";
import { t } from "../../i18n/i18n.js";

export function renderVisitsPage() {
  const rows = dataStore.visitSchedules
    .map(
      (row) => `
        <tr>
          <td class="td-strong">
            <button type="button" class="btn-text btn-text--view" data-action="nav-route" data-route="visit/${escapeHtml(row.id)}">
              ${escapeHtml(new Date(row.week_start_date).toLocaleDateString())}
            </button>
          </td>
          <td>${escapeHtml(row.status)}</td>
          <td>${escapeHtml(row.user_name)}</td>
          <td>${escapeHtml(getUserName(row.created_by))}</td>
          <td>${escapeHtml(row.created_at ? new Date(row.created_at).toLocaleDateString() : "—")}</td>
          <td class="td-actions">${renderRowActions("visit", row.id)}</td>
        </tr>
      `
    )
    .join("");

  return `
    <section class="panel panel--flush">
      <div class="toolbar toolbar--split">
        <div>
          <h3 class="toolbar-title">${escapeHtml(t("titles.visits"))}</h3>
        </div>
        <div class="toolbar-filters toolbar-filters--inline">
          <input class="search-input table-filter" type="search" data-table="visits" placeholder="${escapeHtml(t("visits.searchPh"))}" />
          <button class="primary-btn" type="button" data-action="open-entity-form" data-entity="visit" data-mode="add">${escapeHtml(t("visits.add"))}</button>
        </div>
      </div>
      <div class="table-shell">
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>${escapeHtml(t("visits.thWeekStartDate"))}</th>
                <th>${escapeHtml(t("visits.thStatus"))}</th>
                <th>${escapeHtml(t("visits.thUserName"))}</th>
                <th>${escapeHtml(t("visits.thCreatedBy"))}</th>
                <th>${escapeHtml(t("visits.thCreatedAt"))}</th>
                <th class="th-actions">${escapeHtml(t("common.actions"))}</th>
              </tr>
            </thead>
            <tbody id="visitsTableBody">${rows}</tbody>
          </table>
        </div>
      </div>
    </section>
  `;
}
