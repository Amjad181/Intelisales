import { escapeHtml } from "../utils/html.js";
import { t } from "../../i18n/i18n.js";
import { renderErrorState } from "../components/asyncState.js";
import { getVisit } from "../../api/services/visitsService.js";

function notFound() {
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

function fmtDate(value) {
  return value ? new Date(value).toLocaleDateString() : "—";
}

export async function renderVisitDetailPage() {
  const hash = window.location.hash.replace("#", "").trim();
  const visitId = hash.split("/")[1] || "";

  if (!visitId) return notFound();

  let visit;
  try {
    visit = await getVisit(visitId);
  } catch (err) {
    return renderErrorState(err, "retry-route");
  }

  if (!visit) return notFound();

  return `
    <section class="panel panel--flush">
      <div class="toolbar toolbar--split">
        <button class="secondary-btn" type="button" data-action="nav-route" data-route="visits">${escapeHtml(t("common.list"))}</button>
        <div class="actions">
          <button class="secondary-btn" type="button" data-action="open-entity-form" data-entity="visit" data-mode="edit" data-id="${escapeHtml(visitId)}">${escapeHtml(t("common.edit"))}</button>
          <button class="secondary-btn" type="button" data-action="confirm-visit" data-id="${escapeHtml(visitId)}">${escapeHtml(t("visits.confirm"))}</button>
          <button class="secondary-btn" type="button" data-action="open-entity-form" data-entity="visitComplete" data-mode="edit" data-id="${escapeHtml(visitId)}">${escapeHtml(t("visits.complete"))}</button>
          <button class="btn-text btn-text--warning" type="button" data-action="cancel-visit" data-id="${escapeHtml(visitId)}">${escapeHtml(t("visits.cancel"))}</button>
        </div>
      </div>

      <div class="table-shell">
        <div class="table-wrap">
          <table class="data-table">
            <tbody>
              <tr>
                <th>${escapeHtml(t("visits.thCustomer"))}</th>
                <td>${escapeHtml(visit.customerSnapshot?.name || visit.customerId || "—")}</td>
              </tr>
              <tr>
                <th>${escapeHtml(t("visits.thSalesRep"))}</th>
                <td>${escapeHtml(visit.salesRepSnapshot?.name || "—")}</td>
              </tr>
              <tr>
                <th>${escapeHtml(t("visits.thVisitDate"))}</th>
                <td>${escapeHtml(fmtDate(visit.visitDate))}</td>
              </tr>
              <tr>
                <th>${escapeHtml(t("visits.thStatus"))}</th>
                <td>${escapeHtml(visit.status || "—")}</td>
              </tr>
              <tr>
                <th>${escapeHtml(t("form.visit.purpose"))}</th>
                <td>${escapeHtml(visit.purpose || "—")}</td>
              </tr>
              <tr>
                <th>${escapeHtml(t("form.visit.location"))}</th>
                <td>${escapeHtml(visit.location || "—")}</td>
              </tr>
              <tr>
                <th>${escapeHtml(t("form.visit.notes"))}</th>
                <td>${escapeHtml(visit.notes || "—")}</td>
              </tr>
              <tr>
                <th>${escapeHtml(t("form.visitComplete.outcome"))}</th>
                <td>${escapeHtml(visit.outcome || "—")}</td>
              </tr>
              <tr>
                <th>${escapeHtml(t("form.visitComplete.nextAction"))}</th>
                <td>${escapeHtml(visit.nextAction || "—")}</td>
              </tr>
              <tr>
                <th>${escapeHtml(t("form.visitComplete.nextVisitDate"))}</th>
                <td>${escapeHtml(fmtDate(visit.nextVisitDate))}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  `;
}
