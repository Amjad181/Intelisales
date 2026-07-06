import { escapeHtml } from "../utils/html.js";
import { renderPager } from "../components/asyncState.js";
import { t } from "../../i18n/i18n.js";
import { getListPage } from "../state/appState.js";
import { listVisits } from "../../api/services/visitsService.js";

export async function renderVisitsPage() {
  const page = getListPage("visits");
  const { items, pagination } = await listVisits({ page, limit: 20 });

  const rows = items
    .map((row) => {
      const id = row.id || row._id;
      return `
        <tr>
          <td class="td-strong">
            <button type="button" class="btn-text btn-text--view" data-action="nav-route" data-route="visit/${escapeHtml(id)}">
              ${escapeHtml(row.customerSnapshot?.name || row.customerId || "—")}
            </button>
          </td>
          <td>${escapeHtml(row.visitDate ? new Date(row.visitDate).toLocaleDateString() : "—")}</td>
          <td>${escapeHtml(row.purpose || "—")}</td>
          <td>${escapeHtml(row.status || "—")}</td>
          <td>${escapeHtml(row.salesRepSnapshot?.name || "—")}</td>
          <td class="td-actions">
            <div class="table-actions">
              <button type="button" class="btn-text btn-text--edit" data-action="open-entity-form" data-entity="visit" data-mode="edit" data-id="${escapeHtml(id)}">
                ${escapeHtml(t("common.edit"))}
              </button>
            </div>
          </td>
        </tr>
      `;
    })
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
                <th>${escapeHtml(t("visits.thCustomer"))}</th>
                <th>${escapeHtml(t("visits.thVisitDate"))}</th>
                <th>${escapeHtml(t("visits.thPurpose"))}</th>
                <th>${escapeHtml(t("visits.thStatus"))}</th>
                <th>${escapeHtml(t("visits.thSalesRep"))}</th>
                <th class="th-actions">${escapeHtml(t("common.actions"))}</th>
              </tr>
            </thead>
            <tbody id="visitsTableBody">${rows || `<tr><td colspan="6" class="text-center">${escapeHtml(t("common.noData"))}</td></tr>`}</tbody>
          </table>
        </div>
      </div>
      ${renderPager(pagination, "visits")}
    </section>
  `;
}
