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
import { BACKEND_ROLE_OPTIONS } from "../../api/roleMap.js";
import { createCustomer, updateCustomer } from "../../api/services/customersService.js";
import { createProduct, updateProduct } from "../../api/services/productsService.js";
import { createPriceList, updatePriceList, addPriceListItem, updatePriceListItem } from "../../api/services/priceListsService.js";
import { createUser, updateUser, updateUserPassword } from "../../api/services/usersService.js";
import { createInvoice, updateInvoice, recordInvoicePayment } from "../../api/services/invoicesService.js";
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

const INVOICE_ITEM_ROW_COUNT = 6;

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
      fieldSelect("status", t("form.user.status"), record.status || "Active", [
        { value: "Active", label: t("labels.userStatus.active") },
        { value: "On Leave", label: t("labels.userStatus.onLeave") },
        { value: "Inactive", label: t("labels.userStatus.inactive") },
      ]),
    ].join("");
  }
  if (entity === "customer") {
    return [
      fieldText("name", t("form.customer.name"), record.name || ""),
      fieldText("contactName", t("form.customer.contactName"), record.contactName || ""),
      fieldText("phone", t("form.customer.phone"), record.phone || ""),
      fieldEmail("email", t("form.customer.email"), record.email || ""),
      fieldText("address", t("form.customer.address"), record.address || ""),
      fieldSelect("customerType", t("form.customer.type"), record.customerType || "Retail", [
        { value: "Retail", label: t("labels.customerType.retail") },
        { value: "Wholesale", label: t("labels.customerType.wholesale") },
        { value: "KeyAccount", label: t("labels.customerType.keyAccount") },
      ]),
      fieldSelect("paymentType", t("form.customer.paymentType"), record.paymentType || "Cash", [
        { value: "Cash", label: t("labels.payment.cash") },
        { value: "Credit", label: t("labels.payment.credit") },
      ]),
      fieldSelect("status", t("form.customer.status"), record.status || "Active", [
        { value: "Active", label: t("status.active") },
        { value: "Inactive", label: t("status.inactive") },
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
      fieldSelect("status", t("form.inventory.status"), record.status || "Active", [
        { value: "Active", label: t("labels.productStatus.active") },
        { value: "Inactive", label: t("labels.productStatus.inactive") },
        { value: "Archived", label: t("labels.productStatus.archived") },
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
      fieldSelect("status", t("form.priceList.status"), record.status || "Active", [
        { value: "Active", label: t("status.active") },
        { value: "Inactive", label: t("status.inactive") },
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
    const customerOptions = extra.customerOptions || [];
    const productOptions = extra.productOptions || [];
    const existingItems = record.items || [];

    const itemRows = Array.from({ length: INVOICE_ITEM_ROW_COUNT }).map((_, index) => {
      const item = existingItems[index] || {};
      const productSelectOptions = [{ value: "", label: t("form.invoice.itemNone") }, ...productOptions];
      return `
        <div class="invoice-item-row">
          ${fieldSelect(`item_${index}_productId`, t("form.invoice.itemProduct", { n: index + 1 }), item.productId || "", productSelectOptions)}
          ${fieldText(`item_${index}_qty`, t("form.invoice.itemQty"), item.quantity || "", 'inputmode="numeric" placeholder="0"')}
        </div>
      `;
    }).join("");

    const customerField = customerOptions.length
      ? fieldSelect("customerId", t("form.invoice.customer"), record.customerId || "", customerOptions)
      : `<p class="modal-hint">${escapeHtml(t("modal.hint.invoiceNoCustomer"))}</p>`;

    return [
      customerField,
      fieldText("dueDate", t("form.invoice.dueDate"), record.dueDate ? record.dueDate.split("T")[0] : "", 'type="date"'),
      fieldSelect("discountType", t("form.invoice.discountType"), record.discountType || "NONE", [
        { value: "NONE", label: t("labels.discountType.none") },
        { value: "AMOUNT", label: t("labels.discountType.amount") },
        { value: "PERCENTAGE", label: t("labels.discountType.percentage") },
      ]),
      fieldText("discountValue", t("form.invoice.discountValue"), record.discountValue || "", 'inputmode="decimal" placeholder="0"'),
      fieldText("notes", t("form.invoice.notes"), record.notes || "", `placeholder="${escapeHtml(t("form.invoice.notesPh"))}"`),
      `<input type="hidden" name="source" value="MANUAL" />`,
      `
        <div class="modal-section">
          <h4>${escapeHtml(t("invoices.itemsTitle"))}</h4>
          <p class="modal-hint">${escapeHtml(t("form.invoice.itemsHint"))}</p>
          <div class="invoice-items-list">${itemRows}</div>
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
        if (mode === "edit" && recordId) await updateCustomer(recordId, payload);
        else await createCustomer(payload);
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
        const items = [];
        for (let i = 0; i < INVOICE_ITEM_ROW_COUNT; i++) {
          const productId = payload[`item_${i}_productId`];
          const qty = Number(payload[`item_${i}_qty`]);
          if (productId && qty > 0) items.push({ productId, quantity: qty });
        }
        const invoicePayload = {
          customerId: payload.customerId,
          items,
          discountType: payload.discountType,
          discountValue: payload.discountValue || 0,
          dueDate: payload.dueDate,
          source: payload.source || "MANUAL",
          notes: payload.notes,
        };
        if (mode === "edit" && recordId) await updateInvoice(recordId, invoicePayload);
        else await createInvoice(invoicePayload);
      } else if (entity === "payment") {
        await recordInvoicePayment(recordId, { amount: payload.amount });
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
