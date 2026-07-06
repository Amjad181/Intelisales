import { t } from "../../i18n/i18n.js";
import { escapeHtml } from "../utils/html.js";

export function renderLoadingState() {
  return `
    <section class="panel">
      <div class="async-state async-state--loading">
        <p>${escapeHtml(t("common.loading"))}</p>
      </div>
    </section>
  `;
}

export function renderErrorState(err, retryAction) {
  const isForbidden = err?.status === 403;
  const message = isForbidden ? t("common.notAllowed") : err?.message || t("common.loadError");
  return `
    <section class="panel">
      <div class="async-state async-state--error">
        <p>${escapeHtml(message)}</p>
        ${retryAction ? `<button type="button" class="secondary-btn" data-action="${escapeHtml(retryAction)}">${escapeHtml(t("common.retry"))}</button>` : ""}
      </div>
    </section>
  `;
}

export function renderModalLoadingOverlay() {
  return `
    <div class="modal-overlay is-open" data-modal-overlay role="dialog" aria-modal="true">
      <div class="modal-card" role="document">
        <div class="async-state async-state--loading">
          <p>${escapeHtml(t("common.loading"))}</p>
        </div>
      </div>
    </div>
  `;
}

export function renderModalErrorOverlay(err) {
  const isForbidden = err?.status === 403;
  const message = isForbidden ? t("common.notAllowed") : err?.message || t("common.loadError");
  return `
    <div class="modal-overlay is-open" data-modal-overlay role="dialog" aria-modal="true">
      <div class="modal-card" role="document">
        <div class="modal-header">
          <h3>${escapeHtml(t("common.loadError"))}</h3>
          <button type="button" class="modal-close" data-action="close-modal" aria-label="${escapeHtml(t("common.close"))}">&times;</button>
        </div>
        <div class="async-state async-state--error">
          <p>${escapeHtml(message)}</p>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn-outline" data-action="close-modal">${escapeHtml(t("common.close"))}</button>
        </div>
      </div>
    </div>
  `;
}

export function renderPager(pagination, entityKey) {
  if (!pagination || !pagination.pages || pagination.pages <= 1) return "";
  const page = pagination.page || 1;
  const hasPrev = page > 1;
  const hasNext = page < pagination.pages;
  return `
    <div class="pager">
      <button type="button" class="secondary-btn" data-action="page-prev" data-entity-key="${escapeHtml(entityKey)}" ${hasPrev ? "" : "disabled"}>${escapeHtml(t("common.prevPage"))}</button>
      <span class="pager-status">${escapeHtml(t("common.pageStatus", { page, pages: pagination.pages }))}</span>
      <button type="button" class="secondary-btn" data-action="page-next" data-entity-key="${escapeHtml(entityKey)}" ${hasNext ? "" : "disabled"}>${escapeHtml(t("common.nextPage"))}</button>
    </div>
  `;
}
