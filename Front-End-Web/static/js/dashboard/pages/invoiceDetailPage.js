import { escapeHtml } from "../utils/html.js";
import { t } from "../../i18n/i18n.js";
import { can } from "../state/appState.js";
import { renderErrorState } from "../components/asyncState.js";
import { getInvoice } from "../../api/services/invoicesService.js";

export async function renderInvoiceDetailPage() {
  const hash = window.location.hash.replace("#", "").trim();
  const invoiceId = hash.split("/")[1] || "";

  if (!invoiceId) {
    return `
      <section class="panel panel--flush">
        <div class="toolbar">
          <button class="secondary-btn" type="button" data-action="nav-route" data-route="invoices">${escapeHtml(t("common.list"))}</button>
        </div>
        <div class="panel-body">
          <p>${escapeHtml(t("common.notFound"))}</p>
        </div>
      </section>
    `;
  }

  let invoice;
  try {
    invoice = await getInvoice(invoiceId);
  } catch (err) {
    return renderErrorState(err, "retry-route");
  }

  if (!invoice) {
    return `
      <section class="panel panel--flush">
        <div class="toolbar">
          <button class="secondary-btn" type="button" data-action="nav-route" data-route="invoices">${escapeHtml(t("common.list"))}</button>
        </div>
        <div class="panel-body">
          <p>${escapeHtml(t("common.notFound"))}</p>
        </div>
      </section>
    `;
  }

  const items = invoice.items || [];
  const itemRows = items.length > 0
    ? items.map((item) => `
        <tr>
          <td>${escapeHtml(item.productSnapshot?.name || item.productId || "—")}</td>
          <td>${escapeHtml(item.quantity)}</td>
          <td>${escapeHtml(item.unitPrice ?? "—")}</td>
          <td>${escapeHtml(item.totalPrice ?? "—")}</td>
        </tr>
      `).join("")
    : `<tr><td colspan="4" class="text-center">${escapeHtml(t("common.noData"))}</td></tr>`;

  return `
    <section class="panel panel--flush">
      <div class="toolbar toolbar--split">
        <button class="secondary-btn" type="button" data-action="nav-route" data-route="invoices">${escapeHtml(t("common.list"))}</button>
        <div class="actions">
          <button class="secondary-btn" type="button" data-action="open-entity-form" data-entity="invoice" data-mode="edit" data-id="${escapeHtml(invoiceId)}">${escapeHtml(t("common.edit"))}</button>
          <button class="secondary-btn" type="button" data-action="confirm-invoice" data-id="${escapeHtml(invoiceId)}">${escapeHtml(t("invoices.confirm"))}</button>
          ${can("invoiceMarkSent") ? `<button class="secondary-btn" type="button" data-action="mark-sent-invoice" data-id="${escapeHtml(invoiceId)}">${escapeHtml(t("invoices.markSent"))}</button>` : ""}
          ${can("invoicePayment") ? `<button class="secondary-btn" type="button" data-action="open-entity-form" data-entity="payment" data-mode="edit" data-id="${escapeHtml(invoiceId)}">${escapeHtml(t("invoices.recordPayment"))}</button>` : ""}
          <button class="secondary-btn" type="button" data-action="open-invoice-pdf" data-id="${escapeHtml(invoiceId)}">${escapeHtml(t("invoices.openPdf"))}</button>
          <button class="btn-text btn-text--warning" type="button" data-action="archive-entity" data-entity="invoice" data-id="${escapeHtml(invoiceId)}">${escapeHtml(t("common.archive"))}</button>
        </div>
      </div>

      <div class="table-shell">
        <div class="table-wrap">
          <table class="data-table">
            <tbody>
              <tr>
                <th>${escapeHtml(t("invoices.thInvoiceNumber"))}</th>
                <td>${escapeHtml(invoice.invoiceNumber || t("invoices.draftNumber"))}</td>
              </tr>
              <tr>
                <th>${escapeHtml(t("invoices.thCustomer"))}</th>
                <td>${escapeHtml(invoice.customerSnapshot?.name || invoice.customerId || "—")}</td>
              </tr>
              <tr>
                <th>${escapeHtml(t("invoices.thStatus"))}</th>
                <td>${escapeHtml(invoice.invoiceStatus)}</td>
              </tr>
              <tr>
                <th>${escapeHtml(t("invoices.thPaymentStatus"))}</th>
                <td>${escapeHtml(invoice.paymentStatus)}</td>
              </tr>
              <tr>
                <th>${escapeHtml(t("form.invoice.dueDate"))}</th>
                <td>${escapeHtml(invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : "—")}</td>
              </tr>
              <tr>
                <th>${escapeHtml(t("invoices.thSubtotal"))}</th>
                <td>${escapeHtml(invoice.subtotal ?? "—")}</td>
              </tr>
              <tr>
                <th>${escapeHtml(t("invoices.thDiscountAmount"))}</th>
                <td>${escapeHtml(invoice.discountAmount ?? "—")}</td>
              </tr>
              <tr>
                <th>${escapeHtml(t("invoices.thTaxAmount"))}</th>
                <td>${escapeHtml(invoice.taxAmount ?? "—")}</td>
              </tr>
              <tr>
                <th>${escapeHtml(t("invoices.thTotalAmount"))}</th>
                <td>${escapeHtml(invoice.totalAmount)} ${escapeHtml(invoice.currency || "")}</td>
              </tr>
              <tr>
                <th>${escapeHtml(t("invoices.thPaidAmount"))}</th>
                <td>${escapeHtml(invoice.paidAmount)}</td>
              </tr>
              <tr>
                <th>${escapeHtml(t("invoices.thRemainingAmount"))}</th>
                <td>${escapeHtml(invoice.remainingAmount)}</td>
              </tr>
              <tr>
                <th>${escapeHtml(t("form.invoice.notes"))}</th>
                <td>${escapeHtml(invoice.notes || "—")}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="toolbar" style="margin-top:1.5rem; justify-content:flex-start;">
        <h3>${escapeHtml(t("invoices.itemsTitle"))}</h3>
      </div>

      <div class="table-shell">
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>${escapeHtml(t("invoices.thProjectId"))}</th>
                <th>${escapeHtml(t("invoices.thQuantity"))}</th>
                <th>${escapeHtml(t("invoices.thUnitPrice"))}</th>
                <th>${escapeHtml(t("invoices.thTotalPrice"))}</th>
              </tr>
            </thead>
            <tbody>${itemRows}</tbody>
          </table>
        </div>
      </div>
    </section>
  `;
}
