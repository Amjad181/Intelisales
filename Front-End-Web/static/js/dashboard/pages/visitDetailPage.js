import { dataStore, getRegionName, getUserName, getVisitLines } from "../state/dataStore.js";
import { escapeHtml } from "../utils/html.js";
import { t } from "../../i18n/i18n.js";

export function renderVisitDetailPage() {
  const hash = window.location.hash.replace("#", "").trim();
  const visitId = hash.split("/")[1] || "";
  const visit = dataStore.visitSchedules.find((item) => item.id === visitId);

  if (!visit) {
    return `
      <section class="panel panel--flush">
        <div class="toolbar">
          <button class="secondary-btn" type="button" data-action="nav-route" data-route="visits">${escapeHtml(t("common.list"))}</button>
        </div>
        <div class="panel-body">
          <p>${escapeHtml(t("common.notFound"))}</p>
        </div>
      </section>
    `;
  }

  const lines = getVisitLines(visitId);
  const lineRows = lines.length > 0
    ? lines.map((line) => {
        const weekStart = new Date(visit.week_start_date);
        const dayOffset = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].indexOf(line.day_of_week);
        const visitDate = new Date(weekStart);
        visitDate.setDate(weekStart.getDate() + dayOffset);
        const dateStr = visitDate.toISOString().split('T')[0];
        return `
          <tr>
            <td>${escapeHtml(line.day_of_week)}</td>
            <td>${escapeHtml(getRegionName(line.region_id))}</td>
          </tr>
        `;
      }).join("")
    : `<tr><td colspan="3" class="text-center">${escapeHtml(t("common.noData"))}</td></tr>`;

  return `
    <section class="panel panel--flush">
      <div class="toolbar">
        <button class="secondary-btn" type="button" data-action="nav-route" data-route="visits">${escapeHtml(t("common.list"))}</button>
        <button class="primary-btn" type="button" data-action="open-entity-form" data-entity="visit" data-mode="edit" data-id="${escapeHtml(visitId)}">${escapeHtml(t("common.edit"))}</button>
      </div>
      <div class="table-shell">
        <div class="table-wrap">
          <table class="data-table">
            <tbody>
              <tr>
                <th>${escapeHtml(t("visits.thWeekStartDate"))}</th>
                <td>${escapeHtml(visit.week_start_date ? new Date(visit.week_start_date).toLocaleDateString() : "—")}</td>
              </tr>
              <tr>
                <th>${escapeHtml(t("visits.thCreatedAt"))}</th>
                <td>${escapeHtml(visit.created_at ? new Date(visit.created_at).toLocaleDateString() : "—")}</td>
              </tr>
              <tr>
                <th>${escapeHtml(t("visits.thStatus"))}</th>
                <td>${escapeHtml(visit.status)}</td>
              </tr>
              <tr>
                <th>${escapeHtml(t("visits.thUserName"))}</th>
                <td>${escapeHtml(visit.user_name)}</td>
              </tr>
              <tr>
                <th>${escapeHtml(t("visits.thCreatedBy"))}</th>
                <td>${escapeHtml(getUserName(visit.created_by))}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="toolbar" style="margin-top:1.5rem; justify-content:flex-start;">
        <h3>${escapeHtml(t("visits.itemsTitle"))}</h3>
      </div>

      <div class="table-shell">
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>${escapeHtml(t("visits.thDayOfWeek"))}</th>
                <th>${escapeHtml(t("visits.thRegion"))}</th>
              </tr>
            </thead>
            <tbody>${lineRows}</tbody>
          </table>
        </div>
      </div>
    </section>
  `;
}
