import { dataStore, getCustomerName, getUserName } from "../state/dataStore.js";
import { escapeHtml } from "../utils/html.js";
import { renderRowActions } from "../components/tableActions.js";
import { t } from "../../i18n/i18n.js";
import { labelInvoiceStatus } from "../../i18n/labels.js";

export function renderInvoicesPage() {
  const rows = dataStore.invoices
    .map(
      (row) => `
        <tr>
          <td class="td-muted">
            <button type="button" class="btn-text btn-text--view" data-action="nav-route" data-route="invoice/${escapeHtml(row.id)}">
              ${escapeHtml(row.Invoice_number)}
            </button>
          </td>
          <td class="td-strong">${escapeHtml(getCustomerName(row.customer_id))}</td>
          <td>${escapeHtml(getUserName(row.created_by))}</td>
          <td>${escapeHtml(row.Invoice_date ? new Date(row.Invoice_date).toLocaleDateString() : "—")}</td>
          <td>${escapeHtml(row.total_Amount)}</td>
          <td>${escapeHtml(row.paid_Amount)}</td>
          <td>${escapeHtml(row.remaining_Amount)}</td>
          <td><span class="badge badge--${row.status === 'Paid' ? 'ok' : row.status === 'Pending' ? 'warning' : row.status === 'Overdue' ? 'danger' : row.status === 'Archived' ? 'secondary' : 'danger'}">${escapeHtml(labelInvoiceStatus(row.status))}</span></td>
          <td class="td-actions">${renderRowActions("invoice", row.id)}</td>
        </tr>
      `
    )
    .join("");

  return `
    <section class="panel panel--flush">
      <div class="toolbar">
        <input class="search-input table-filter" type="search" data-table="invoices" placeholder="${escapeHtml(t("invoices.searchPh"))}" />
        <button class="primary-btn toolbar-primary" type="button" data-action="open-entity-form" data-entity="invoice" data-mode="add">${escapeHtml(t("invoices.newInvoice"))}</button>
      </div>
      <div class="table-shell">
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>${escapeHtml(t("invoices.thInvoiceNumber"))}</th>
                <th>${escapeHtml(t("invoices.thCustomer"))}</th>
                <th>${escapeHtml(t("invoices.thCreatedBy"))}</th>
                <th>${escapeHtml(t("invoices.thDate"))}</th>
                <th>${escapeHtml(t("invoices.thTotalAmount"))}</th>
                <th>${escapeHtml(t("invoices.thPaidAmount"))}</th>
                <th>${escapeHtml(t("invoices.thRemainingAmount"))}</th>
                <th>${escapeHtml(t("invoices.thStatus"))}</th>
                <th class="th-actions">${escapeHtml(t("common.actions"))}</th>
              </tr>
            </thead>
            <tbody id="invoicesTableBody">${rows}</tbody>
          </table>
        </div>
      </div>
    </section>
  `;
}
