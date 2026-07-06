import { escapeHtml } from "../utils/html.js";
import { renderRowActions } from "../components/tableActions.js";
import { renderPager } from "../components/asyncState.js";
import { t } from "../../i18n/i18n.js";
import { getListPage } from "../state/appState.js";
import { listInvoices } from "../../api/services/invoicesService.js";

export async function renderInvoicesPage() {
  const page = getListPage("invoices");
  const { items, pagination } = await listInvoices({ page, limit: 20 });

  const rows = items
    .map((row) => {
      const id = row.id || row._id;
      return `
        <tr>
          <td class="td-muted">
            <button type="button" class="btn-text btn-text--view" data-action="nav-route" data-route="invoice/${escapeHtml(id)}">
              ${escapeHtml(row.invoiceNumber)}
            </button>
          </td>
          <td class="td-strong">${escapeHtml(row.customerSnapshot?.name || row.customerId || "—")}</td>
          <td>${escapeHtml(row.invoiceStatus)}</td>
          <td>${escapeHtml(row.paymentStatus)}</td>
          <td>${escapeHtml(row.totalAmount)} ${escapeHtml(row.currency || "")}</td>
          <td>${escapeHtml(row.paidAmount)}</td>
          <td>${escapeHtml(row.remainingAmount)}</td>
          <td class="td-actions">${renderRowActions("invoice", id)}</td>
        </tr>
      `;
    })
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
                <th>${escapeHtml(t("invoices.thStatus"))}</th>
                <th>${escapeHtml(t("invoices.thPaymentStatus"))}</th>
                <th>${escapeHtml(t("invoices.thTotalAmount"))}</th>
                <th>${escapeHtml(t("invoices.thPaidAmount"))}</th>
                <th>${escapeHtml(t("invoices.thRemainingAmount"))}</th>
                <th class="th-actions">${escapeHtml(t("common.actions"))}</th>
              </tr>
            </thead>
            <tbody id="invoicesTableBody">${rows || `<tr><td colspan="8" class="text-center">${escapeHtml(t("common.noData"))}</td></tr>`}</tbody>
          </table>
        </div>
      </div>
      ${renderPager(pagination, "invoices")}
    </section>
  `;
}
