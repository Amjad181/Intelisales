import {
  dataStore,
  nextInvoiceNumber,
  priceListSelectOptions,
  upsertCustomer,
  upsertInventoryAlert,
  upsertPriceList,
  upsertPriceListItem,
  upsertSale,
  upsertTopRep,
  upsertUser,
  upsertRegion,
  upsertVisitSchedule,
  upsertDailyVisit,
  upsertInvoice,
  regionSelectOptions,
  userSelectOptions,
  getInvoiceItems,
} from "../state/dataStore.js";
import { escapeHtml } from "../utils/html.js";
import { t } from "../../i18n/i18n.js";

function getRecord(entity, id) {
  const map = {
    user: dataStore.users,
    customer: dataStore.customers,
    sale: dataStore.sales,
    invoice: dataStore.invoices,
    inventory: dataStore.inventoryAlerts,
    topRep: dataStore.topReps,
    priceList: dataStore.priceLists,
    priceItem: dataStore.priceListItems,
    region: dataStore.regions,
    visit: dataStore.visitSchedules,
    dailyVisit: dataStore.dailyVisits,
  };
  const list = map[entity];
  if (!list || !id) return null;
  return list.find((item) => item.id === id) || null;
}

function fieldText(name, label, value, attrs = "") {
  return `
    <div class="modal-field">
      <label for="fld-${name}">${escapeHtml(label)}</label>
      <input id="fld-${name}" name="${escapeHtml(name)}" type="text" value="${escapeHtml(value)}" ${attrs} />
    </div>
  `;
}

function fieldEmail(name, label, value) {
  return fieldText(name, label, value, 'autocomplete="email"');
}

function fieldPassword(name, label, value, attrs = "") {
  return `
    <div class="modal-field">
      <label for="fld-${name}">${escapeHtml(label)}</label>
      <input id="fld-${name}" name="${escapeHtml(name)}" type="password" value="${escapeHtml(value)}" ${attrs} />
    </div>
  `;
}

function fieldSelect(name, label, value, options) {
  const opts = options
    .map((o) => `<option value="${escapeHtml(o.value)}" ${o.value === value ? "selected" : ""}>${escapeHtml(o.label)}</option>`)
    .join("");
  return `
    <div class="modal-field">
      <label for="fld-${name}">${escapeHtml(label)}</label>
      <select id="fld-${name}" name="${escapeHtml(name)}">${opts}</select>
    </div>
  `;
}

function buildFields(entity, record, mode) {
  const isEdit = mode === "edit";
  if (entity === "user") {
    return [
      isEdit ? fieldText("user_id", t("form.user.userId"), record.user_id || "", "readonly") : "",
      fieldText("name", t("form.user.fullName"), record.name || ""),
      fieldEmail("email", t("form.user.email"), record.email || ""),
      fieldPassword(
        "password",
        t("form.user.password"),
        "",
        mode === "add" ? 'autocomplete="new-password" required' : 'autocomplete="new-password"'
      ),
      fieldText("phone", t("form.user.phone"), record.phone || "", 'inputmode="tel"'),
      fieldSelect("role", t("form.user.role"), record.role || "Sales Representative", [
        { value: "Administrator", label: t("labels.role.administrator") },
        { value: "Sales Manager", label: t("labels.role.salesManager") },
        { value: "Sales Supervisor", label: t("labels.role.salesSupervisor") },
        { value: "Sales Representative", label: t("labels.role.salesRep") },
        { value: "Accountant", label: t("labels.role.accountant") },
      ]),
      fieldSelect("status", t("form.user.status"), record.status || "Active", [
        { value: "Active", label: t("labels.userStatus.active") },
        { value: "On Leave", label: t("labels.userStatus.onLeave") },
        { value: "Inactive", label: t("labels.userStatus.inactive") },
      ]),
      isEdit ? fieldText("created_at", t("form.user.createdAt"), record.created_at || "", "readonly") : "",
    ].join("");
  }
  if (entity === "customer") {
    const customerId = isEdit ? record.customer_id || "" : "";
    const customerIdField = isEdit
      ? fieldText("customer_id", t("form.customer.id"), customerId, "readonly")
      : `<p class="modal-hint">${t("modal.hint.customerId", { code: customerId || "Auto-generated" })}</p><input type="hidden" name="customer_id" value="${escapeHtml(customerId)}" />`;
    
    return [
      customerIdField,
      fieldText("customer_name", t("form.customer.name"), record.customer_name || ""),
      fieldText("shop_name", t("form.customer.shopName"), record.shop_name || ""),
      fieldText("phone1", t("form.customer.phone1"), record.phone1 || ""),
      fieldText("phone2", t("form.customer.phone2"), record.phone2 || ""),
      fieldText("address", t("form.customer.address"), record.address || ""),
      fieldSelect("region_id", t("form.customer.region"), record.region_id || "", regionSelectOptions()),
      fieldSelect("assigned_user_id", t("form.customer.assignedUser"), record.assigned_user_id || "", userSelectOptions()),
      fieldSelect("payment_type", t("form.customer.paymentType"), record.payment_type || "Cash", [
        { value: "Cash", label: t("labels.payment.cash") },
        { value: "Credit", label: t("labels.payment.credit") },
        { value: "Check", label: t("labels.payment.check") },
      ]),
      fieldSelect("customer_type", t("form.customer.type"), record.customer_type || "Retail", [
        { value: "Retail", label: t("labels.customerType.retail") },
        { value: "Wholesale", label: t("labels.customerType.wholesale") },
      ]),
      fieldText("notes", t("form.customer.notes"), record.notes || ""),
    ].join("");
  }
  if (entity === "sale") {
    const inv = isEdit ? record.invoice || "" : nextInvoiceNumber();
    const invField = isEdit
      ? fieldText("invoice", t("form.sale.invoice"), record.invoice || "", "readonly")
      : `<p class="modal-hint">${t("modal.hint.invoice", { inv })}</p><input type="hidden" name="invoice" value="${escapeHtml(inv)}" />`;
    return [
      invField,
      fieldText("customer", t("form.sale.customer"), record.customer || ""),
      fieldText("amount", t("form.sale.amount"), record.amount || "", 'placeholder="$0.00"'),
      fieldSelect("status", t("form.sale.paymentStatus"), record.status || "Pending", [
        { value: "Paid", label: t("labels.payment.paid") },
        { value: "Pending", label: t("labels.payment.pending") },
        { value: "Overdue", label: t("labels.payment.overdue") },
      ]),
    ].join("");
  }
  if (entity === "inventory") {
    const nextProductId = record.product_id || `P${String(dataStore.inventoryAlerts.length + 1).padStart(3, "0")}`;
    const initialDateAdded = record.date_added || new Date().toISOString();

    return [
      fieldText(
        "product_id",
        t("form.inventory.productId"),
        nextProductId,
        "readonly"
      ),
      fieldText("product_name", t("form.inventory.productName"), record.product_name || record.name || ""),
      fieldText("description", t("form.inventory.description"), record.description || ""),
      fieldText("unit", t("form.inventory.unit"), record.unit || ""),
      fieldSelect("created_by", t("form.inventory.createdBy"), record.created_by || "", userSelectOptions()),
      fieldSelect("status", t("form.inventory.status"), record.status || "Active", [
        { value: "Active", label: t("labels.productStatus.active") },
        { value: "Inactive", label: t("labels.productStatus.inactive") },
        { value: "Archived", label: t("labels.productStatus.archived") },
      ]),
      fieldText("date_added", t("form.inventory.dateAdded"), initialDateAdded, "readonly"),
    ].join("");
  }
  if (entity === "topRep") {
    return [
      fieldText("name", t("form.topRep.repName"), record.name || ""),
      fieldText("amount", t("form.topRep.salesTotal"), record.amount || "", 'placeholder="$0.00"'),
      fieldSelect("status", t("form.topRep.performance"), record.status || "success", [
        { value: "success", label: t("labels.repPerformance.onTarget") },
        { value: "warning", label: t("labels.repPerformance.watchList") },
        { value: "danger", label: t("labels.repPerformance.atRisk") },
      ]),
    ].join("");
  }
  if (entity === "priceList") {
    return [
      fieldText("name", t("form.priceList.name"), record.name || "", `placeholder="${escapeHtml(t("form.priceList.namePh"))}"`),
      fieldText("desc", t("form.priceList.desc"), record.desc || "", `placeholder="${escapeHtml(t("form.priceList.descPh"))}"`),
      fieldSelect("status", t("form.priceList.status"), record.status || "Active", [
        { value: "Active", label: t("status.active") },
        { value: "Inactive", label: t("status.inactive") },
      ]),
      fieldSelect("created_by", t("form.priceList.createdBy"), record.created_by || "", userSelectOptions()),
    ].join("");
  }
  if (entity === "region") {
    return [
      fieldText("name", t("form.region.name"), record.name || ""),
      fieldSelect("status", t("form.region.status"), record.status || "Active", [
        { value: "Active", label: t("status.active") },
        { value: "Inactive", label: t("status.inactive") },
        { value: "Archived", label: t("status.archived") },
      ]),
      fieldSelect("created_by", t("form.region.createdBy"), record.created_by || "", userSelectOptions()),
      isEdit ? fieldText("created_at", t("form.region.createdAt"), record.created_at || "", "readonly") : "",
    ].join("");
  }
  if (entity === "visit") {
    return [
      fieldText("week_start_date", t("form.visit.weekStartDate"), record.week_start_date ? record.week_start_date.split("T")[0] : "", 'type="date"'),
      fieldSelect("status", t("form.visit.status"), record.status || "Planned", [
        { value: "Planned", label: t("visits.statusPlanned") },
        { value: "Confirmed", label: t("visits.statusConfirmed") },
        { value: "Completed", label: t("visits.statusCompleted") },
        { value: "Archived", label: t("status.archived") },
      ]),
      fieldText("user_name", t("form.visit.userName"), record.user_name || ""),
      fieldSelect("created_by", t("form.visit.createdBy"), record.created_by || "", userSelectOptions()),
      isEdit ? fieldText("created_at", t("form.visit.createdAt"), record.created_at || "", "readonly") : "",
    ].join("");
  }
  if (entity === "dailyVisit") {
    return [
      fieldText("visit_date", t("form.dailyVisit.visitDate"), record.visit_date || "", 'type="date"'),
      fieldText("check_in_time", t("form.dailyVisit.checkInTime"), record.check_in_time || "", 'type="time"'),
      fieldSelect("status", t("form.dailyVisit.status"), record.status || "Pending", [
        { value: "Pending", label: t("labels.visitStatus.pending") },
        { value: "Completed", label: t("labels.visitStatus.completed") },
        { value: "Cancelled", label: t("labels.visitStatus.cancelled") },
      ]),
      fieldText("notes", t("form.dailyVisit.notes"), record.notes || ""),
      fieldText("customer_name", t("form.dailyVisit.customerName"), record.customer_name || ""),
      fieldText("user_name", t("form.dailyVisit.userName"), record.user_name || ""),
      fieldSelect("region_id", t("form.dailyVisit.region"), record.region_id || "", regionSelectOptions()),
      fieldSelect("created_by", t("form.dailyVisit.createdBy"), record.created_by || "", userSelectOptions()),
      isEdit ? fieldText("created_at", t("form.dailyVisit.createdAt"), record.created_at || "", "readonly") : "",
    ].join("");
  }
  if (entity === "priceItem") {
    const plOptions = priceListSelectOptions();
    if (!plOptions.length) {
      return `<p class="modal-hint">${escapeHtml(t("modal.hint.priceItemNoList"))}</p>`;
    }
    const defaultPl = plOptions[0]?.value || "";
    return [
      fieldSelect("priceListId", t("form.priceItem.pricelist"), record.priceListId || defaultPl, plOptions),
      fieldText("product_name", t("form.priceItem.productName"), record.product_name || ""),
      fieldText("price", t("form.priceItem.price"), record.price || "", `placeholder="${escapeHtml(t("form.priceItem.pricePh"))}" inputmode="decimal"`),
    ].join("");
  }
  if (entity === "invoice") {
    const invNum = isEdit ? record.Invoice_number || "" : nextInvoiceNumber();
    const invField = isEdit
      ? fieldText("Invoice_number", t("form.invoice.invoiceNumber"), record.Invoice_number || "", "readonly")
      : `<p class="modal-hint">${t("modal.hint.invoiceNumber", { num: invNum })}</p><input type="hidden" name="Invoice_number" value="${escapeHtml(invNum)}" />`;
    return [
      invField,
      fieldText("customer_id", t("form.invoice.customerId"), record.customer_id || "", 'inputmode="numeric"'),
      fieldSelect("created_by", t("form.invoice.createdBy"), record.created_by || "", userSelectOptions()),
      fieldText("Invoice_date", t("form.invoice.invoiceDate"), record.Invoice_date ? record.Invoice_date.split("T")[0] : "", 'type="date"'),
      fieldText("total_Amount", t("form.invoice.totalAmount"), record.total_Amount || "", 'placeholder="0.00" inputmode="decimal"'),
      fieldText("paid_Amount", t("form.invoice.paidAmount"), record.paid_Amount || "", 'placeholder="0.00" inputmode="decimal"'),
      fieldText("remaining_Amount", t("form.invoice.remainingAmount"), record.remaining_Amount || "", 'placeholder="0.00" inputmode="decimal" readonly'),
      fieldSelect("status", t("form.invoice.status"), record.status || "Pending", [
        { value: "Paid", label: t("labels.invoiceStatus.paid") },
        { value: "Pending", label: t("labels.invoiceStatus.pending") },
        { value: "Overdue", label: t("labels.invoiceStatus.overdue") },
      ]),
      fieldSelect("creation_method", t("form.invoice.creationMethod"), record.creation_method || "Mobile", [
        { value: "Mobile", label: t("labels.creationMethod.mobile") },
        { value: "Web", label: t("labels.creationMethod.web") },
        { value: "Manual", label: t("labels.creationMethod.manual") },
      ]),
      fieldText("notes", t("form.invoice.notes"), record.notes || "", 'placeholder="' + escapeHtml(t("form.invoice.notesPh")) + '"'),
    ].join("");
  }
  return "";
}

function modalTitle(entity, mode) {
  const variant = mode === "add" ? "add" : "edit";
  const path = `modalTitle.${entity}.${variant}`;
  const resolved = t(path);
  if (resolved !== path) return resolved;
  return t(`modalTitle.form.${variant}`);
}

export function buildModalMarkup(entity, mode, id, initialData = {}) {
  const record = mode === "edit" && id ? { ...(getRecord(entity, id) || {}), ...initialData } : initialData;
  const title = modalTitle(entity, mode);
  const fields = buildFields(entity, record || {}, mode);
  const entityAttr = escapeHtml(entity);
  const modeAttr = escapeHtml(mode);
  const idAttr = id ? escapeHtml(id) : "";

  const invoiceItemsSection = entity === "invoice" && mode === "edit" && id ? buildInvoiceItemsSection(id) : "";

  return `
    <div class="modal-overlay is-open" data-modal-overlay role="dialog" aria-modal="true" aria-labelledby="modalTitle">
      <div class="modal-card ${entity === 'invoice' ? 'modal-card--wide' : ''}" role="document">
        <div class="modal-header">
          <h3 id="modalTitle">${escapeHtml(title)}</h3>
          <button type="button" class="modal-close" data-action="close-modal" aria-label="${escapeHtml(t("common.close"))}">&times;</button>
        </div>
        <form id="dashboardEntityForm" class="modal-form" data-entity="${entityAttr}" data-mode="${modeAttr}" data-record-id="${idAttr}">
          ${fields}
          ${invoiceItemsSection}
        </form>
        <div class="modal-footer">
          <button type="button" class="btn-outline" data-action="close-modal">${escapeHtml(t("common.cancel"))}</button>
          <button type="submit" form="dashboardEntityForm" class="btn-primary">${escapeHtml(mode === "add" ? t("common.create") : t("common.saveChanges"))}</button>
        </div>
      </div>
    </div>
  `;
}

function readForm(form) {
  const data = new FormData(form);
  const out = {};
  data.forEach((value, key) => {
    out[key] = String(value).trim();
  });
  return out;
}

export function handleEntityFormSubmit(form) {
  const entity = form.dataset.entity;
  const mode = form.dataset.mode;
  const recordId = form.dataset.recordId || "";
  const payload = readForm(form);

  if (entity === "user") {
    upsertUser(
      mode === "edit" && recordId
        ? { id: recordId, ...payload }
        : { ...payload }
    );
  } else if (entity === "customer") {
    upsertCustomer(
      mode === "edit" && recordId
        ? { id: recordId, ...payload }
        : { ...payload }
    );
  } else if (entity === "sale") {
    upsertSale(
      mode === "edit" && recordId
        ? { id: recordId, ...payload }
        : { ...payload }
    );
  } else if (entity === "inventory") {
    upsertInventoryAlert(
      mode === "edit" && recordId
        ? { id: recordId, ...payload }
        : { ...payload }
    );
  } else if (entity === "topRep") {
    upsertTopRep(
      mode === "edit" && recordId
        ? { id: recordId, ...payload }
        : { ...payload }
    );
  } else if (entity === "priceList") {
    upsertPriceList(
      mode === "edit" && recordId
        ? { id: recordId, ...payload }
        : { ...payload }
    );
  } else if (entity === "region") {
    upsertRegion(
      mode === "edit" && recordId
        ? { id: recordId, ...payload }
        : { ...payload }
    );
  } else if (entity === "visit") {
    upsertVisitSchedule(
      mode === "edit" && recordId
        ? { id: recordId, ...payload }
        : { ...payload }
    );
  } else if (entity === "dailyVisit") {
    upsertDailyVisit(
      mode === "edit" && recordId
        ? { id: recordId, ...payload }
        : { ...payload }
    );
  } else if (entity === "priceItem") {
    if (mode !== "edit" && !payload.priceListId) {
      return;
    }
    upsertPriceListItem(
      mode === "edit" && recordId
        ? { id: recordId, ...payload }
        : { ...payload }
    );
  } else if (entity === "invoice") {
    upsertInvoice(
      mode === "edit" && recordId
        ? { id: recordId, ...payload }
        : { ...payload }
    );
  }
}

function buildInvoiceItemsTable(items) {
  const rows = items.length > 0
    ? items.map(item => `
        <tr>
          <td>${escapeHtml(item.item_id)}</td>
          <td>${escapeHtml(item.invoice_id)}</td>
          <td>${escapeHtml(item.product_id)}</td>
          <td>${escapeHtml(item.quantity)}</td>
          <td>${escapeHtml(item.unit_id || "—")}</td>
          <td>${escapeHtml(item.unit_price)}</td>
          <td>${escapeHtml(item.total_price)}</td>
        </tr>
      `).join("")
    : `<tr><td colspan="7" class="text-center">${escapeHtml(t("common.noData"))}</td></tr>`;

  return `
    <div class="table-shell">
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>${escapeHtml(t("invoices.thItemId"))}</th>
              <th>${escapeHtml(t("invoices.thInvoiceId"))}</th>
              <th>${escapeHtml(t("invoices.thProjectId"))}</th>
              <th>${escapeHtml(t("invoices.thQuantity"))}</th>
              <th>${escapeHtml(t("invoices.thUnit"))}</th>
              <th>${escapeHtml(t("invoices.thUnitPrice"))}</th>
              <th>${escapeHtml(t("invoices.thTotalPrice"))}</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  `;
}

function buildInvoiceItemsSection(invoiceId) {
  const items = getInvoiceItems(invoiceId);
  return `
    <div class="modal-section">
      <h4>${escapeHtml(t("invoices.itemsTitle"))}</h4>
      ${buildInvoiceItemsTable(items)}
    </div>
  `;
}

export function buildInvoiceItemsModalMarkup(invoiceId) {
  const items = getInvoiceItems(invoiceId);
  return `
    <div class="modal-overlay is-open" data-modal-overlay role="dialog" aria-modal="true" aria-labelledby="invoiceItemsModalTitle">
      <div class="modal-card modal-card--wide">
        <div class="modal-header">
          <h3 id="invoiceItemsModalTitle">${escapeHtml(t("invoices.itemsTitle"))}</h3>
          <button type="button" class="modal-close" data-action="close-modal" aria-label="${escapeHtml(t("common.close"))}">&times;</button>
        </div>
        <div class="modal-body">
          ${buildInvoiceItemsTable(items)}
        </div>
        <div class="modal-footer">
          <button type="button" class="btn-outline" data-action="close-modal">${escapeHtml(t("common.close"))}</button>
        </div>
      </div>
    </div>
  `;
}
