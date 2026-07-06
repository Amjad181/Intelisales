import { t } from "../../i18n/i18n.js";
import { escapeHtml } from "../utils/html.js";

export function renderRowActions(entity, id) {
  const e = escapeHtml(entity);
  const i = escapeHtml(id);
  let actions = `
    <button type="button" class="btn-text btn-text--edit" data-action="open-entity-form" data-entity="${e}" data-mode="edit" data-id="${i}">
      ${escapeHtml(t("common.edit"))}
    </button>
    <button type="button" class="btn-text btn-text--danger" data-action="delete-entity" data-entity="${e}" data-id="${i}">
      ${escapeHtml(t("common.delete"))}
    </button>
  `;

  if (entity === "invoice" || entity === "inventory" || entity === "priceList" || entity === "region") {
    actions = `
      <button type="button" class="btn-text btn-text--edit" data-action="open-entity-form" data-entity="${e}" data-mode="edit" data-id="${i}">
        ${escapeHtml(t("common.edit"))}
      </button>
      <button type="button" class="btn-text btn-text--warning" data-action="archive-entity" data-entity="${e}" data-id="${i}">
        ${escapeHtml(t("common.archive"))}
      </button>
    `;
  }

  return `
    <div class="table-actions">
      ${actions}
    </div>
  `;
}
