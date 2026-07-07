import { dataStore, getUserName } from "../state/dataStore.js";
import { escapeHtml } from "../utils/html.js";
import { renderRowActions } from "../components/tableActions.js";
import { renderDemoBanner } from "../components/asyncState.js";
import { t } from "../../i18n/i18n.js";

export function renderRegionsPage() {
  const rows = dataStore.regions
    .map(
      (row) => `
        <tr>
          <td class="td-strong">${escapeHtml(row.name)}</td>
          <td><span class="badge badge--${row.status === 'Active' ? 'ok' : row.status === 'Inactive' ? 'warning' : 'secondary'}">${escapeHtml(row.status)}</span></td>
          <td>${escapeHtml(row.created_at ? new Date(row.created_at).toLocaleDateString() : "—")}</td>
          <td>${escapeHtml(getUserName(row.created_by))}</td>
          <td class="td-actions">${renderRowActions("region", row.id)}</td>
        </tr>
      `
    )
    .join("");

  return `
    ${renderDemoBanner()}
    <section class="panel panel--flush">
      <div class="toolbar toolbar--split">
        <div>
          <h3 class="toolbar-title">${escapeHtml(t("titles.regions"))}</h3>
        </div>
        <div class="toolbar-filters toolbar-filters--inline">
          <input class="search-input table-filter" type="search" data-table="regions" placeholder="${escapeHtml(t("regions.searchPh"))}" />
          <button class="primary-btn" type="button" data-action="open-entity-form" data-entity="region" data-mode="add">${escapeHtml(t("regions.add"))}</button>
        </div>
      </div>
      <div class="table-shell">
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>${escapeHtml(t("regions.thName"))}</th>
                <th>${escapeHtml(t("regions.thStatus"))}</th>
                <th>${escapeHtml(t("regions.thCreatedAt"))}</th>
                <th>${escapeHtml(t("regions.thCreatedBy"))}</th>
                <th class="th-actions">${escapeHtml(t("common.actions"))}</th>
              </tr>
            </thead>
            <tbody id="regionsTableBody">${rows}</tbody>
          </table>
        </div>
      </div>
    </section>
  `;
}
