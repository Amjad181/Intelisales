import {
  dataStore,
  nextSaleInvoiceNumber,
  upsertSale,
  upsertTopRep,
  upsertRegion,
  userSelectOptions,
} from "../state/dataStore.js";
import { escapeHtml } from "../utils/html.js";
import { t } from "../../i18n/i18n.js";
import { appState } from "../state/appState.js";
import { BACKEND_ROLE_OPTIONS } from "../../api/roleMap.js";
import { createCustomer, updateCustomer } from "../../api/services/customersService.js";
import { createProduct, updateProduct } from "../../api/services/productsService.js";
import { createPriceList, updatePriceList, addPriceListItem, updatePriceListItem } from "../../api/services/priceListsService.js";
import { createUser, updateUser, updateUserPassword } from "../../api/services/usersService.js";
import { createInvoice, updateInvoice, confirmInvoice, recordInvoicePayment } from "../../api/services/invoicesService.js";
import { createVisit, updateVisit, completeVisit } from "../../api/services/visitsService.js";

function getRecord(entity, id) {
  // user keeps its mock array around for cross-reference lookups used by not-yet-migrated
  // pages (see INTEGRATION_NOTES.md), but real backend ids won't match any mock record here
  // — that's expected, the real fetched record is passed as initialData.
  const map = {
    user: dataStore.users,
    sale: dataStore.sales,
    topRep: dataStore.topReps,
    region: dataStore.regions,
  };
  const list = map[entity];
  if (!list || !id) return null;
  return list.find((item) => item.id === id) || null;
}

// The invoice line-item builder is dynamic (add/remove any number of rows). This module-level
// cache holds the product catalog + a running row-id counter so main.js's "add row" click
// handler can grow the list without a full modal re-render.
let invoiceProductOptions = [];
let nextInvoiceRowId = 0;

function invoiceProductSelectOptions(selectedProductId) {
  return [{ value: "", label: t("form.invoice.itemNone") }, ...invoiceProductOptions]
    .map((o) => {
      const priceAttr = o.basePrice !== undefined
        ? ` data-price="${escapeHtml(o.basePrice)}" data-currency="${escapeHtml(o.currency || "")}"`
        : "";
      const selected = o.value === (selectedProductId || "") ? "selected" : "";
      return `<option value="${escapeHtml(o.value)}"${priceAttr} ${selected}>${escapeHtml(o.label)}</option>`;
    })
    .join("");
}

function invoiceItemUnitPriceText(productId) {
  const product = invoiceProductOptions.find((o) => o.value === productId);
  if (!product || product.basePrice === undefined) return "—";
  return `${product.basePrice} ${product.currency || ""}`.trim();
}

function invoiceItemRowHtml(item = {}) {
  const rowId = nextInvoiceRowId++;
  return `
    <div class="invoice-item-row" data-row-id="${rowId}">
      <div class="modal-field">
        <label>${escapeHtml(t("form.invoice.itemProduct"))}</label>
        <select class="invoice-item-row__product" data-action="invoice-item-product-change">${invoiceProductSelectOptions(item.productId)}</select>
      </div>
      <div class="modal-field">
        <label>${escapeHtml(t("form.invoice.itemUnitPrice"))}</label>
        <span class="invoice-item-row__price">${escapeHtml(invoiceItemUnitPriceText(item.productId))}</span>
      </div>
      <div class="modal-field">
        <label>${escapeHtml(t("form.invoice.itemQty"))}</label>
        <input class="invoice-item-row__qty" type="text" inputmode="numeric" placeholder="0" value="${escapeHtml(item.quantity || "")}" />
      </div>
      <button type="button" class="btn-text btn-text--danger invoice-item-row__remove" data-action="remove-invoice-item">${escapeHtml(t("common.remove"))}</button>
    </div>
  `;
}

// Called by main.js's "add product line" button click — appends one empty row.
export function addInvoiceItemRow(container) {
  if (!container) return;
  container.insertAdjacentHTML("beforeend", invoiceItemRowHtml());
}

// Called by main.js's delegated 'change' listener on a row's product <select>.
export function updateInvoiceItemRowPrice(selectEl) {
  const row = selectEl.closest(".invoice-item-row");
  const priceEl = row?.querySelector(".invoice-item-row__price");
  if (priceEl) priceEl.textContent = invoiceItemUnitPriceText(selectEl.value);
}

// Called by main.js when the invoice's customer changes — replaces the catalog with only
// what's actually invoiceable for that customer (the active price list for their type), so
// picking a product here can never hit the backend's "price not found" rejection at submit.
// Rebuilds every already-rendered row so a no-longer-valid selection resets to "None".
export function setInvoiceProductCatalog(options) {
  invoiceProductOptions = options;
  document.querySelectorAll(".invoice-item-row__product").forEach((select) => {
    select.innerHTML = invoiceProductSelectOptions(select.value);
    updateInvoiceItemRowPrice(select);
  });
}

// Fixed backend enum for a completed visit's outcome.
const VISIT_OUTCOMES = [
  "ORDER_PLACED",
  "PAYMENT_COLLECTED",
  "FOLLOW_UP_NEEDED",
  "NO_INTEREST",
  "CUSTOMER_UNAVAILABLE",
  "OTHER",
];

function fieldText(name, label, value, attrs = "") {
  const typeMatch = attrs.match(/type="([^"]+)"/);
  const type = typeMatch ? typeMatch[1] : "text";
  const restAttrs = typeMatch ? attrs.replace(typeMatch[0], "") : attrs;
  return `
    <div class="modal-field">
      <label for="fld-${name}">${escapeHtml(label)}</label>
      <input id="fld-${name}" name="${escapeHtml(name)}" type="${escapeHtml(type)}" value="${escapeHtml(value)}" ${restAttrs} />
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

function fieldSelect(name, label, value, options, attrs = "") {
  const opts = options
    .map((o) => `<option value="${escapeHtml(o.value)}" ${o.value === value ? "selected" : ""}>${escapeHtml(o.label)}</option>`)
    .join("");
  return `
    <div class="modal-field">
      <label for="fld-${name}">${escapeHtml(label)}</label>
      <select id="fld-${name}" name="${escapeHtml(name)}" ${attrs}>${opts}</select>
    </div>
  `;
}

function buildFields(entity, record, mode, extra = {}) {
  const isEdit = mode === "edit";
  if (entity === "user") {
    return [
      fieldText("name", t("form.user.fullName"), record.name || ""),
      fieldEmail("email", t("form.user.email"), record.email || ""),
      fieldPassword(
        "password",
        t("form.user.password"),
        "",
        mode === "add" ? 'autocomplete="new-password" required' : 'autocomplete="new-password"'
      ),
      fieldSelect(
        "role",
        t("form.user.role"),
        record.role || BACKEND_ROLE_OPTIONS[0].value,
        BACKEND_ROLE_OPTIONS.map(({ value, labelKey }) => ({ value, label: t(labelKey) }))
      ),
      fieldSelect("status", t("form.user.status"), record.status || "ACTIVE", [
        { value: "ACTIVE", label: t("labels.userStatus.active") },
        { value: "INACTIVE", label: t("labels.userStatus.inactive") },
      ]),
    ].join("");
  }
  if (entity === "customer") {
    // The backend stores address as an object ({ line1, city, ... }) but the user just
    // types one free-text line — show that line1 back when editing an existing record.
    const addressText = typeof record.address === "string" ? record.address : record.address?.line1 || "";
    return [
      fieldText("name", t("form.customer.name"), record.name || ""),
      fieldText("contactName", t("form.customer.contactName"), record.contactName || ""),
      fieldText("phone", t("form.customer.phone"), record.phone || "", 'inputmode="numeric" placeholder="0999999999"'),
      fieldEmail("email", t("form.customer.email"), record.email || ""),
      fieldText("address", t("form.customer.address"), addressText),
      fieldSelect("customerType", t("form.customer.type"), record.customerType || "Retail", [
        { value: "Retail", label: t("labels.customerType.retail") },
        { value: "Wholesale", label: t("labels.customerType.wholesale") },
        { value: "KeyAccount", label: t("labels.customerType.keyAccount") },
      ]),
      fieldSelect("paymentType", t("form.customer.paymentType"), record.paymentType || "Cash", [
        { value: "Cash", label: t("labels.payment.cash") },
        { value: "Credit", label: t("labels.payment.credit") },
      ]),
      fieldSelect("status", t("form.customer.status"), record.status || "ACTIVE", [
        { value: "ACTIVE", label: t("status.active") },
        { value: "INACTIVE", label: t("status.inactive") },
      ]),
      fieldText("notes", t("form.customer.notes"), record.notes || ""),
    ].join("");
  }
  if (entity === "sale") {
    const inv = isEdit ? record.invoice || "" : nextSaleInvoiceNumber();
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
    return [
      fieldText("name", t("form.inventory.productName"), record.name || ""),
      fieldText("productCode", t("form.inventory.productCode"), record.productCode || ""),
      fieldText("barcode", t("form.inventory.barcode"), record.barcode || ""),
      fieldText("category", t("form.inventory.category"), record.category || ""),
      fieldText("brand", t("form.inventory.brand"), record.brand || ""),
      fieldText("description", t("form.inventory.description"), record.description || ""),
      fieldSelect("unit", t("form.inventory.unit"), record.unit || "PIECE", [
        { value: "PIECE", label: t("labels.unit.piece") },
        { value: "BOX", label: t("labels.unit.box") },
        { value: "KG", label: t("labels.unit.kg") },
        { value: "LITER", label: t("labels.unit.liter") },
        { value: "METER", label: t("labels.unit.meter") },
        { value: "PACK", label: t("labels.unit.pack") },
      ]),
      fieldText("basePrice", t("form.inventory.basePrice"), record.basePrice || "", 'placeholder="0.00" inputmode="decimal"'),
      fieldText("currency", t("form.inventory.currency"), record.currency || "SYP"),
      fieldText("taxRate", t("form.inventory.taxRate"), record.taxRate || "", 'placeholder="0" inputmode="decimal"'),
      fieldSelect("status", t("form.inventory.status"), record.status || "ACTIVE", [
        { value: "ACTIVE", label: t("labels.productStatus.active") },
        { value: "INACTIVE", label: t("labels.productStatus.inactive") },
      ]),
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
      fieldText("description", t("form.priceList.desc"), record.description || "", `placeholder="${escapeHtml(t("form.priceList.descPh"))}"`),
      fieldSelect("customerType", t("form.priceList.customerType"), record.customerType || "Retail", [
        { value: "Retail", label: t("labels.customerType.retail") },
        { value: "Wholesale", label: t("labels.customerType.wholesale") },
        { value: "KeyAccount", label: t("labels.customerType.keyAccount") },
      ]),
      fieldSelect("status", t("form.priceList.status"), record.status || "ACTIVE", [
        { value: "ACTIVE", label: t("status.active") },
        { value: "INACTIVE", label: t("status.inactive") },
      ]),
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
    const customerOptions = extra.customerOptions || [];
    // The contract's create body field is `customer`; handle both a populated object
    // and a plain id when preselecting on edit.
    const visitCustomerId = record.customer?.id || record.customer?._id || (typeof record.customer === "string" ? record.customer : "") || record.customerId || "";
    const customerField = customerOptions.length
      ? fieldSelect("customer", t("form.visit.customer"), visitCustomerId, customerOptions)
      : `<p class="modal-hint">${escapeHtml(t("modal.hint.invoiceNoCustomer"))}</p>`;
    return [
      customerField,
      fieldText("visitDate", t("form.visit.visitDate"), record.visitDate ? record.visitDate.split("T")[0] : "", 'type="date"'),
      fieldText("purpose", t("form.visit.purpose"), record.purpose || "", `placeholder="${escapeHtml(t("form.visit.purposePh"))}"`),
      fieldText("location", t("form.visit.location"), record.location || "", `placeholder="${escapeHtml(t("form.visit.locationPh"))}"`),
      fieldText("notes", t("form.visit.notes"), record.notes || ""),
    ].join("");
  }
  if (entity === "visitComplete") {
    return [
      fieldSelect("outcome", t("form.visitComplete.outcome"), record.outcome || VISIT_OUTCOMES[0], VISIT_OUTCOMES.map((value) => ({ value, label: t(`labels.visitOutcome.${value}`) }))),
      fieldText("nextAction", t("form.visitComplete.nextAction"), record.nextAction || ""),
      fieldText("nextVisitDate", t("form.visitComplete.nextVisitDate"), record.nextVisitDate ? record.nextVisitDate.split("T")[0] : "", 'type="date"'),
    ].join("");
  }
  if (entity === "priceItem") {
    const productOptions = extra.productOptions || [];
    if (!productOptions.length) {
      return `<p class="modal-hint">${escapeHtml(t("modal.hint.priceItemNoProduct"))}</p>`;
    }
    const defaultProduct = productOptions[0]?.value || "";
    return [
      fieldSelect("productId", t("form.priceItem.product"), record.productId || defaultProduct, productOptions),
      fieldText("price", t("form.priceItem.price"), record.price || "", `placeholder="${escapeHtml(t("form.priceItem.pricePh"))}" inputmode="decimal"`),
      fieldText("currency", t("form.priceItem.currency"), record.currency || "SYP"),
      `<input type="hidden" name="_priceListId" value="${escapeHtml(record.priceListId || "")}" />`,
      record.itemIndex !== undefined && record.itemIndex !== null
        ? `<input type="hidden" name="_itemIndex" value="${escapeHtml(String(record.itemIndex))}" />`
        : "",
    ].join("");
  }
  if (entity === "invoice") {
    invoiceProductOptions = extra.productOptions || [];
    nextInvoiceRowId = 0;
    const customerOptions = extra.customerOptions || [];
    const existingItems = record.items || [];

    const itemRows = (existingItems.length ? existingItems : [{}])
      .map((item) => invoiceItemRowHtml(item))
      .join("");

    // Custom markup (not the generic fieldSelect) so each <option> can carry the customer's
    // type — main.js reads it on 'change' to refetch that type's active price list and swap
    // the product catalog, so only invoiceable products for THIS customer can be selected.
    // The customer can't be changed once an invoice exists (the update endpoint's schema
    // doesn't accept customerId at all), so lock the field in edit mode instead of letting
    // the user pick a different one and have it silently do nothing.
    const customerField = customerOptions.length
      ? `
        <div class="modal-field">
          <label for="fld-customerId">${escapeHtml(t("form.invoice.customer"))}</label>
          <select id="fld-customerId" name="customerId" data-action="invoice-customer-change" ${mode === "edit" ? "disabled" : ""}>
            <option value="">${escapeHtml(t("form.invoice.selectCustomer"))}</option>
            ${customerOptions.map((c) => `<option value="${escapeHtml(c.value)}" data-customer-type="${escapeHtml(c.customerType || "")}" ${c.value === (record.customerId || "") ? "selected" : ""}>${escapeHtml(c.label)}</option>`).join("")}
          </select>
        </div>
      `
      : `<p class="modal-hint">${escapeHtml(t("modal.hint.invoiceNoCustomer"))}</p>`;

    const discountType = record.discountType || "NONE";

    return [
      customerField,
      fieldText("dueDate", t("form.invoice.dueDate"), record.dueDate ? record.dueDate.split("T")[0] : "", 'type="date"'),
      `<p class="modal-hint">${escapeHtml(t("form.invoice.dueDateHint"))}</p>`,
      fieldSelect("discountType", t("form.invoice.discountType"), discountType, [
        { value: "NONE", label: t("labels.discountType.none") },
        { value: "AMOUNT", label: t("labels.discountType.amount") },
        { value: "PERCENTAGE", label: t("labels.discountType.percentage") },
      ], 'data-action="invoice-discount-type-change"'),
      fieldText(
        "discountValue",
        t("form.invoice.discountValue"),
        record.discountValue || "",
        `inputmode="decimal" placeholder="0" ${discountType === "NONE" ? "disabled" : ""}`
      ),
      fieldText("notes", t("form.invoice.notes"), record.notes || "", `placeholder="${escapeHtml(t("form.invoice.notesPh"))}"`),
      `<input type="hidden" name="source" value="MANUAL" />`,
      `
        <div class="modal-section">
          <h4>${escapeHtml(t("invoices.itemsTitle"))}</h4>
          <p class="modal-hint">${escapeHtml(t("form.invoice.itemsHint"))}</p>
          <div class="invoice-items-list">${itemRows}</div>
          <button type="button" class="secondary-btn" data-action="add-invoice-item">${escapeHtml(t("form.invoice.addItem"))}</button>
        </div>
      `,
    ].join("");
  }
  if (entity === "payment") {
    return [
      fieldText("amount", t("form.payment.amount"), record.amount || "", 'inputmode="decimal" placeholder="0.00"'),
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

export function buildModalMarkup(entity, mode, id, initialData = {}, extra = {}) {
  const record = mode === "edit" && id ? { ...(getRecord(entity, id) || {}), ...initialData } : initialData;
  const title = modalTitle(entity, mode);
  const fields = buildFields(entity, record || {}, mode, extra);
  const entityAttr = escapeHtml(entity);
  const modeAttr = escapeHtml(mode);
  const idAttr = id ? escapeHtml(id) : "";

  return `
    <div class="modal-overlay is-open" data-modal-overlay role="dialog" aria-modal="true" aria-labelledby="modalTitle">
      <div class="modal-card ${entity === 'invoice' ? 'modal-card--wide' : ''}" role="document">
        <div class="modal-header">
          <h3 id="modalTitle">${escapeHtml(title)}</h3>
          <button type="button" class="modal-close" data-action="close-modal" aria-label="${escapeHtml(t("common.close"))}">&times;</button>
        </div>
        <div class="modal-error" data-modal-error hidden></div>
        <form id="dashboardEntityForm" class="modal-form" data-entity="${entityAttr}" data-mode="${modeAttr}" data-record-id="${idAttr}">
          ${fields}
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

function applyFormError(form, err) {
  const banner = form.closest(".modal-card")?.querySelector("[data-modal-error]");
  if (banner) {
    banner.textContent = err?.message || t("common.loadError");
    banner.hidden = false;
  }
  form.querySelectorAll(".field-error").forEach((el) => el.remove());
  if (Array.isArray(err?.errors)) {
    err.errors.forEach((fieldError) => {
      const fieldName = fieldError?.field || fieldError?.param || fieldError?.path;
      const message = fieldError?.message;
      if (!fieldName || !message) return;
      const input = form.querySelector(`[name="${fieldName}"]`);
      const container = input?.closest(".modal-field");
      if (!container) return;
      const span = document.createElement("small");
      span.className = "field-error";
      span.textContent = message;
      container.appendChild(span);
    });
  }
}

const PHONE_PATTERN = /^\d{10}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Client-side checks before hitting the network — phone/email are optional on the
// backend, so only validate format when the user actually entered something.
function validateCustomerPayload(payload) {
  const errors = [];
  if (payload.phone && !PHONE_PATTERN.test(payload.phone)) {
    errors.push({ field: "phone", message: t("form.customer.phoneInvalid") });
  }
  if (payload.email && !EMAIL_PATTERN.test(payload.email)) {
    errors.push({ field: "email", message: t("form.customer.emailInvalid") });
  }
  return errors;
}

// The backend stores address as an object ({ line1, ... }); the UI keeps a single
// free-text field, so wrap it here rather than adding more inputs to the form.
function buildCustomerPayload(payload) {
  const { address, ...rest } = payload;
  return address ? { ...rest, address: { line1: address } } : rest;
}

// Only these two roles can both write invoices AND manage payment on the backend
// (POST /invoices/:id/payment is COMPANY_ADMIN/SALES_MANAGER/ACCOUNTANT-only, and
// ACCOUNTANT can't create invoices at all) — matches Phase 2's role map.
const INVOICE_PAYMENT_ROLES = new Set(["administrator", "salesManager"]);

// Confirming moves DRAFT -> CONFIRMED (assigns the real invoice number) and payment can only
// be recorded on a confirmed invoice — so collecting a payment right after create means
// confirming it first. Skipped entirely if the user declines/leaves the prompt blank.
async function promptAndRecordInitialPayment(invoice) {
  const totalAmount = Number(invoice?.totalAmount || 0);
  if (!(totalAmount > 0)) return;

  const raw = window.prompt(
    t("form.payment.askAtCreate", { total: totalAmount, currency: invoice.currency || "" })
  );
  if (raw === null || raw.trim() === "") return;

  const paidAmount = Number(raw);
  if (!(paidAmount > 0)) return;

  const invoiceId = invoice.id || invoice._id;
  const confirmed = await confirmInvoice(invoiceId);
  await recordInvoicePayment(confirmed.id || confirmed._id || invoiceId, {
    paidAmount: Math.min(paidAmount, totalAmount),
  });
}

// Editing a confirmed invoice (e.g. adding a line item) can raise its total beyond what's
// already been paid — offer to collect the difference right away. paidAmount on the
// payment endpoint is an absolute figure, not a delta, so we add the new amount to what
// was already paid rather than sending it alone.
async function promptAndRecordAdditionalPayment(invoice) {
  const remainingAmount = Number(invoice?.remainingAmount || 0);
  if (!(remainingAmount > 0)) return;

  const raw = window.prompt(
    t("form.payment.askAdditional", { remaining: remainingAmount, currency: invoice.currency || "" })
  );
  if (raw === null || raw.trim() === "") return;

  const additionalAmount = Number(raw);
  if (!(additionalAmount > 0)) return;

  const invoiceId = invoice.id || invoice._id;
  const previousPaidAmount = Number(invoice.paidAmount || 0);
  await recordInvoicePayment(invoiceId, {
    paidAmount: previousPaidAmount + Math.min(additionalAmount, remainingAmount),
  });
}

const ASYNC_ENTITIES = new Set(["user", "customer", "inventory", "priceList", "priceItem", "invoice", "payment", "visit", "visitComplete"]);

export async function handleEntityFormSubmit(form) {
  const entity = form.dataset.entity;
  const mode = form.dataset.mode;
  const recordId = form.dataset.recordId || "";
  const payload = readForm(form);

  if (ASYNC_ENTITIES.has(entity)) {
    try {
      if (entity === "user") {
        const { password, ...rest } = payload;
        if (mode === "edit" && recordId) {
          await updateUser(recordId, rest);
          if (password) await updateUserPassword(recordId, password);
        } else {
          await createUser({ ...rest, password });
        }
      } else if (entity === "customer") {
        const validationErrors = validateCustomerPayload(payload);
        if (validationErrors.length) {
          applyFormError(form, { message: t("common.validationFailed"), errors: validationErrors });
          return false;
        }
        const customerPayload = buildCustomerPayload(payload);
        if (mode === "edit" && recordId) await updateCustomer(recordId, customerPayload);
        else await createCustomer(customerPayload);
      } else if (entity === "inventory") {
        if (mode === "edit" && recordId) await updateProduct(recordId, payload);
        else await createProduct(payload);
      } else if (entity === "priceList") {
        if (mode === "edit" && recordId) await updatePriceList(recordId, payload);
        else await createPriceList(payload);
      } else if (entity === "priceItem") {
        const { _priceListId, _itemIndex, ...item } = payload;
        if (mode === "edit" && _itemIndex !== undefined && _itemIndex !== "") {
          await updatePriceListItem(_priceListId, Number(_itemIndex), item);
        } else {
          await addPriceListItem(_priceListId, item);
        }
      } else if (entity === "invoice") {
        const items = Array.from(form.querySelectorAll(".invoice-item-row")).reduce((acc, row) => {
          const productId = row.querySelector(".invoice-item-row__product")?.value;
          const qty = Number(row.querySelector(".invoice-item-row__qty")?.value);
          if (productId && qty > 0) acc.push({ productId, quantity: qty });
          return acc;
        }, []);
        const invoicePayload = {
          customerId: payload.customerId,
          items,
          discountType: payload.discountType,
          discountValue: payload.discountType === "NONE" ? 0 : payload.discountValue || 0,
          dueDate: payload.dueDate,
          source: payload.source || "MANUAL",
          notes: payload.notes,
        };
        let savedInvoice;
        if (mode === "edit" && recordId) {
          // The update endpoint's schema is strict and doesn't accept customerId at all —
          // an invoice's customer can't be changed after creation, only its items/discount/notes.
          const { customerId, ...updatePayload } = invoicePayload;
          savedInvoice = await updateInvoice(recordId, updatePayload);
        } else {
          savedInvoice = await createInvoice(invoicePayload);
        }

        // Only admin/manager can both write invoices and manage payment on the backend —
        // ask for an initial payment right after creating a fresh draft for those roles.
        if (mode !== "edit" && INVOICE_PAYMENT_ROLES.has(appState.userRoleKey)) {
          try {
            await promptAndRecordInitialPayment(savedInvoice);
          } catch (err) {
            window.alert(`${t("form.payment.createdButPaymentFailed")}${err?.message || t("common.loadError")}`);
          }
        } else if (
          mode === "edit" &&
          savedInvoice.invoiceStatus === "CONFIRMED" &&
          INVOICE_PAYMENT_ROLES.has(appState.userRoleKey)
        ) {
          try {
            await promptAndRecordAdditionalPayment(savedInvoice);
          } catch (err) {
            window.alert(`${t("form.payment.updatedButPaymentFailed")}${err?.message || t("common.loadError")}`);
          }
        }
      } else if (entity === "payment") {
        await recordInvoicePayment(recordId, { paidAmount: Number(payload.amount) });
      } else if (entity === "visit") {
        // Contract body field is `customer` (Phase 6 §40) — not customerId.
        const visitPayload = {
          customer: payload.customer,
          visitDate: payload.visitDate,
          purpose: payload.purpose,
          location: payload.location,
          notes: payload.notes,
        };
        if (mode === "edit" && recordId) await updateVisit(recordId, visitPayload);
        else await createVisit(visitPayload);
      } else if (entity === "visitComplete") {
        await completeVisit(recordId, {
          outcome: payload.outcome,
          nextAction: payload.nextAction,
          nextVisitDate: payload.nextVisitDate,
        });
      }
      return true;
    } catch (err) {
      applyFormError(form, err);
      return false;
    }
  }

  if (entity === "sale") {
    upsertSale(
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
  } else if (entity === "region") {
    upsertRegion(
      mode === "edit" && recordId
        ? { id: recordId, ...payload }
        : { ...payload }
    );
  }
}
