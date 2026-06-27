import { dataStore, getUserName } from "../state/dataStore.js";
import { escapeHtml } from "../utils/html.js";
import { renderRowActions } from "../components/tableActions.js";
import { t } from "../../i18n/i18n.js";
import { labelProductStatus } from "../../i18n/labels.js";

export function renderInventoryPage() {
  const rows = dataStore.inventoryAlerts
    .map(
      (row) => `
        <tr>
          <td class="td-muted">${escapeHtml(row.product_id)}</td>
          <td class="td-strong">${escapeHtml(row.product_name)}</td>
          <td>${escapeHtml(row.description)}</td>
          <td>${escapeHtml(row.unit)}</td>
          <td>${escapeHtml(getUserName(row.created_by))}</td>
          <td><span class="badge badge--${row.status === 'Active' ? 'ok' : row.status === 'Inactive' ? 'warning' : row.status === 'Archived' ? 'secondary' : 'danger'}">${escapeHtml(labelProductStatus(row.status))}</span></td>
          <td>${escapeHtml(row.date_added ? new Date(row.date_added).toLocaleDateString() : "—")}</td>
          <td class="td-actions">${renderRowActions("inventory", row.id)}</td>
        </tr>
      `
    )
    .join("");

  return `
    <section class="panel panel--flush">
      <div class="toolbar">
        <input class="search-input table-filter" type="search" data-table="inventory" placeholder="${escapeHtml(t("inventory.searchPh"))}" />
        <button class="primary-btn toolbar-primary" type="button" data-action="open-entity-form" data-entity="inventory" data-mode="add">${escapeHtml(t("inventory.addItem"))}</button>
      </div>
      <div class="table-shell">
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>${escapeHtml(t("inventory.thProductId"))}</th>
                <th>${escapeHtml(t("inventory.thProductName"))}</th>
                <th>${escapeHtml(t("inventory.thDescription"))}</th>
                <th>${escapeHtml(t("inventory.thUnit"))}</th>
                <th>${escapeHtml(t("inventory.thCreatedBy"))}</th>
                <th>${escapeHtml(t("inventory.thStatus"))}</th>
                <th>${escapeHtml(t("inventory.thDateAdded"))}</th>
                <th class="th-actions">${escapeHtml(t("common.actions"))}</th>
              </tr>
            </thead>
            <tbody id="inventoryTableBody">${rows}</tbody>
          </table>
        </div>
      </div>
    </section>
  `;
}
