import { escapeHtml } from "../utils/html.js";
import { t } from "../../i18n/i18n.js";
import { listCustomers } from "../../api/services/customersService.js";

export async function renderRecommendationsPage() {
  const { items: customers } = await listCustomers({ limit: 100 });
  const options = customers
    .map((c) => `<option value="${escapeHtml(c.id || c._id)}">${escapeHtml(c.name)}</option>`)
    .join("");

  return `
    <section class="panel">
      <div class="panel-head">
        <h3>${escapeHtml(t("recommendations.title"))}</h3>
      </div>
      <p class="toolbar-desc">${escapeHtml(t("recommendations.intro"))}</p>
      <div class="toolbar-filters toolbar-filters--inline">
        <select id="recommendationsCustomerSelect" class="toolbar-select">
          <option value="">${escapeHtml(t("recommendations.selectCustomer"))}</option>
          ${options}
        </select>
        <button type="button" class="primary-btn" data-action="load-recommendations">${escapeHtml(t("recommendations.getButton"))}</button>
      </div>
      <div id="recommendationsResults" class="recommendations-results"></div>
    </section>
  `;
}

export function renderRecommendationResults(data) {
  const recommendations = data?.recommendations || [];
  if (!recommendations.length) {
    return `<p class="modal-hint">${escapeHtml(t("common.noData"))}</p>`;
  }
  const cards = recommendations
    .map(
      (rec) => `
        <article class="recommendation-card">
          <h4>${escapeHtml(rec.product?.name || "—")}</h4>
          <p class="recommendation-card__price">${escapeHtml(rec.price ?? "—")} ${escapeHtml(rec.currency || "")}</p>
          ${rec.reason ? `<p class="recommendation-card__reason">${escapeHtml(rec.reason)}</p>` : ""}
          ${rec.score !== undefined ? `<span class="badge badge--info">${escapeHtml(t("recommendations.score", { score: rec.score }))}</span>` : ""}
        </article>
      `
    )
    .join("");
  return `<div class="recommendations-grid">${cards}</div>`;
}
