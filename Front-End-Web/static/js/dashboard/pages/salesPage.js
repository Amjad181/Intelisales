import { dataStore } from "../state/dataStore.js";
import { escapeHtml } from "../utils/html.js";
import { renderRowActions } from "../components/tableActions.js";
import { t } from "../../i18n/i18n.js";
import { labelPaymentStatus } from "../../i18n/labels.js";

export function renderSalesPage() {
  const rows = dataStore.sales
    .map(
      (row) => `
        <tr>
          <td class="td-strong">${escapeHtml(row.invoice)}</td>
          <td>${escapeHtml(row.customer)}</td>
          <td>${escapeHtml(row.amount)}</td>
          <td><span class="badge badge--neutral">${escapeHtml(labelPaymentStatus(row.status))}</span></td>
          <td class="td-actions">${renderRowActions("sale", row.id)}</td>
        </tr>
      `
    )
    .join("");

  return `
    <section class="panel panel--flush">
      <div class="toolbar">
        <input class="search-input table-filter" type="search" data-table="sales" placeholder="${escapeHtml(t("sales.searchPh"))}" />
        <button class="primary-btn toolbar-primary" type="button" data-action="open-entity-form" data-entity="sale" data-mode="add">${escapeHtml(t("sales.newSale"))}</button>
      </div>
      <div class="table-shell">
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>${escapeHtml(t("sales.thInvoice"))}</th>
                <th>${escapeHtml(t("sales.thCustomer"))}</th>
                <th>${escapeHtml(t("sales.thAmount"))}</th>
                <th>${escapeHtml(t("sales.thStatus"))}</th>
                <th class="th-actions">${escapeHtml(t("common.actions"))}</th>
              </tr>
            </thead>
            <tbody id="salesTableBody">${rows}</tbody>
          </table>
        </div>
      </div>
    </section>
  `;
}
