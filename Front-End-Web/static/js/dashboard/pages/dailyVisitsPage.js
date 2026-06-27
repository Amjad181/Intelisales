import { dataStore, getDailyVisits } from "../state/dataStore.js";
import { escapeHtml } from "../utils/html.js";
import { renderRowActions } from "../components/tableActions.js";
import { t } from "../../i18n/i18n.js";

export function renderDailyVisitsPage() {
  const hash = window.location.hash.replace("#", "").trim();
  const parts = hash.split("/");
  const date = parts[1];
  const regionId = parts[2];

  if (!date || !regionId) {
    return `
      <section class="panel panel--flush">
        <div class="panel-body">
          <p>${escapeHtml(t("common.notFound"))}</p>
        </div>
      </section>
    `;
  }

  const visits = getDailyVisits(date, regionId);
  const rows = visits
    .map(
      (row) => `
        <tr>
          <td>${escapeHtml(row.visit_date)}</td>
          <td>${escapeHtml(row.check_in_time)}</td>
          <td><span class="badge badge--${row.status === 'Completed' ? 'ok' : row.status === 'Pending' ? 'warning' : 'secondary'}">${escapeHtml(row.status)}</span></td>
          <td>${escapeHtml(row.notes)}</td>
          <td>${escapeHtml(row.customer_name)}</td>
          <td>${escapeHtml(row.user_name)}</td>
          <td class="td-actions">${renderRowActions("dailyVisit", row.id)}</td>
        </tr>
      `
    )
    .join("");

  return `
    <section class="panel panel--flush">
      <div class="toolbar toolbar--split">
        <div>
          <h3 class="toolbar-title">${escapeHtml(t("dailyVisits.title", { date, region: dataStore.regions.find(r => r.id === regionId)?.name || regionId }))}</h3>
        </div>
        <div class="toolbar-filters toolbar-filters--inline">
          <input class="search-input table-filter" type="search" data-table="dailyVisits" placeholder="${escapeHtml(t("dailyVisits.searchPh"))}" />
          <button class="primary-btn" type="button" data-action="open-entity-form" data-entity="dailyVisit" data-mode="add" data-date="${escapeHtml(date)}" data-region="${escapeHtml(regionId)}">${escapeHtml(t("dailyVisits.add"))}</button>
        </div>
      </div>
      <div class="table-shell">
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>${escapeHtml(t("dailyVisits.thVisitDate"))}</th>
                <th>${escapeHtml(t("dailyVisits.thCheckInTime"))}</th>
                <th>${escapeHtml(t("dailyVisits.thStatus"))}</th>
                <th>${escapeHtml(t("dailyVisits.thNotes"))}</th>
                <th>${escapeHtml(t("dailyVisits.thCustomerName"))}</th>
                <th>${escapeHtml(t("dailyVisits.thUserName"))}</th>
                <th class="th-actions">${escapeHtml(t("common.actions"))}</th>
              </tr>
            </thead>
            <tbody id="dailyVisitsTableBody">${rows}</tbody>
          </table>
        </div>
      </div>
    </section>
  `;
}