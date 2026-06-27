import { dataStore, getCustomerName, getUserName, getInvoiceItems } from "../state/dataStore.js";
import { escapeHtml } from "../utils/html.js";
import { t } from "../../i18n/i18n.js";
import { labelInvoiceStatus } from "../../i18n/labels.js";

export function renderInvoiceDetailPage() {
  const hash = window.location.hash.replace("#", "").trim();
  const invoiceId = hash.split("/")[1] || "";
  const invoice = dataStore.invoices.find((inv) => inv.id === invoiceId);

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

  const items = getInvoiceItems(invoiceId);
  const itemRows = items.length > 0
    ? items.map((item) => `
        <tr>
          <td>${escapeHtml(item.item_id)}</td>
          <td>${escapeHtml(item.product_id)}</td>
          <td>${escapeHtml(item.quantity)}</td>
          <td>${escapeHtml(item.unit_id || "—")}</td>
          <td>${escapeHtml(item.unit_price)}</td>
          <td>${escapeHtml(item.total_price)}</td>
        </tr>
      `).join("")
    : `<tr><td colspan="6" class="text-center">${escapeHtml(t("common.noData"))}</td></tr>`;

  return `
    <section class="panel panel--flush">
      <div class="toolbar">
        <button class="secondary-btn" type="button" data-action="nav-route" data-route="invoices">${escapeHtml(t("common.list"))}</button>
        <button class="primary-btn" type="button" data-action="open-entity-form" data-entity="invoice" data-mode="edit" data-id="${escapeHtml(invoiceId)}">${escapeHtml(t("common.edit"))}</button>
      </div>

      <div class="table-shell">
        <div class="table-wrap">
          <table class="data-table">
            <tbody>
              <tr>
                <th>${escapeHtml(t("form.invoice.invoiceNumber"))}</th>
                <td><div class="modal-field"><input id="fld-Invoice_number" name="Invoice_number" type="text" value="${escapeHtml(invoice.Invoice_number)}" readonly /></div></td>
              </tr>
              <tr>
                <th>${escapeHtml(t("form.invoice.customerId"))}</th>
                <td><div class="modal-field"><input id="fld-customer_id" name="customer_id" type="text" value="${escapeHtml(invoice.customer_id)}" readonly /></div></td>
              </tr>
              <tr>
                <th>${escapeHtml(t("form.invoice.createdBy"))}</th>
                <td><div class="modal-field"><input id="fld-created_by" name="created_by" type="text" value="${escapeHtml(getUserName(invoice.created_by))}" readonly /></div></td>
              </tr>
              <tr>
                <th>${escapeHtml(t("form.invoice.invoiceDate"))}</th>
                <td><div class="modal-field"><input id="fld-Invoice_date" name="Invoice_date" type="text" value="${escapeHtml(invoice.Invoice_date ? new Date(invoice.Invoice_date).toLocaleDateString() : "")}" readonly /></div></td>
              </tr>
              <tr>
                <th>${escapeHtml(t("form.invoice.totalAmount"))}</th>
                <td><div class="modal-field"><input id="fld-total_Amount" name="total_Amount" type="text" value="${escapeHtml(invoice.total_Amount)}" readonly /></div></td>
              </tr>
              <tr>
                <th>${escapeHtml(t("form.invoice.paidAmount"))}</th>
                <td><div class="modal-field"><input id="fld-paid_Amount" name="paid_Amount" type="text" value="${escapeHtml(invoice.paid_Amount)}" readonly /></div></td>
              </tr>
              <tr>
                <th>${escapeHtml(t("form.invoice.remainingAmount"))}</th>
                <td><div class="modal-field"><input id="fld-remaining_Amount" name="remaining_Amount" type="text" value="${escapeHtml(invoice.remaining_Amount)}" readonly /></div></td>
              </tr>
              <tr>
                <th>${escapeHtml(t("form.invoice.status"))}</th>
                <td><div class="modal-field"><input id="fld-status" name="status" type="text" value="${escapeHtml(labelInvoiceStatus(invoice.status))}" readonly /></div></td>
              </tr>
              <tr>
                <th>${escapeHtml(t("form.invoice.creationMethod"))}</th>
                <td><div class="modal-field"><input id="fld-creation_method" name="creation_method" type="text" value="${escapeHtml(invoice.creation_method)}" readonly /></div></td>
              </tr>
              <tr>
                <th>${escapeHtml(t("form.invoice.notes"))}</th>
                <td><div class="modal-field"><input id="fld-notes" name="notes" type="text" value="${escapeHtml(invoice.notes)}" readonly /></div></td>
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
                <th>${escapeHtml(t("invoices.thItemId"))}</th>
                <th>${escapeHtml(t("invoices.thProjectId"))}</th>
                <th>${escapeHtml(t("invoices.thQuantity"))}</th>
                <th>${escapeHtml(t("invoices.thUnit"))}</th>
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
