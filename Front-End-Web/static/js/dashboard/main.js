import { renderSidebar } from "./components/sidebar.js";
import { renderTopbar } from "./components/topbar.js";
import { buildModalMarkup, handleEntityFormSubmit } from "./components/entityModal.js";
import { renderLoadingState, renderErrorState, renderModalLoadingOverlay, renderModalErrorOverlay } from "./components/asyncState.js";
import { appState, setActiveRoute, getListPage, setListPage, getListSearch, setListSearch, can } from "./state/appState.js";
import {
  removeSale,
  removeTopRep,
  removeRegion,
} from "./state/dataStore.js";
import { getCustomer, deleteCustomer, listCustomers } from "../api/services/customersService.js";
import { getProduct, deleteProduct, updateProduct, listProductsForPriceList } from "../api/services/productsService.js";
import { getPriceList, deletePriceList, updatePriceList, removePriceListItem } from "../api/services/priceListsService.js";
import { getUser, deleteUser } from "../api/services/usersService.js";
import {
  getInvoice,
  archiveInvoice,
  confirmInvoice,
  markInvoiceSent,
  getInvoicePdfBlob,
} from "../api/services/invoicesService.js";
import {
  getVisit,
  cancelVisit,
} from "../api/services/visitsService.js";
import { renderOverviewPage } from "./pages/overviewPage.js";
import { renderSalesPage } from "./pages/salesPage.js";
import { renderCustomersPage } from "./pages/customersPage.js";
import { renderInvoicesPage } from "./pages/invoicesPage.js";
import { renderInvoiceDetailPage } from "./pages/invoiceDetailPage.js";
import { renderInventoryPage } from "./pages/inventoryPage.js";
import { renderReportsPage } from "./pages/reportsPage.js";
import { renderUsersPage } from "./pages/usersPage.js";
import { renderPricelistsPage } from "./pages/pricelistsPage.js";
import { renderPricelistDetailPage } from "./pages/pricelistDetailPage.js";
import { renderRegionsPage } from "./pages/regionsPage.js";
import { renderVisitsPage } from "./pages/visitsPage.js";
import { renderVisitDetailPage } from "./pages/visitDetailPage.js";
import { renderRecommendationsPage, renderRecommendationResults } from "./pages/recommendationsPage.js";
import { getCustomerRecommendations } from "../api/services/recommendationsService.js";
import { t, setLocale, initI18n } from "../i18n/i18n.js";
import { isAuthenticated, logout, refreshCurrentUser } from "../api/authService.js";

initI18n();

const routes = [
  { key: "overview", render: renderOverviewPage },
  { key: "sales", render: renderSalesPage },
  { key: "customers", render: renderCustomersPage },
  { key: "invoices", render: renderInvoicesPage },
  { key: "invoice", render: renderInvoiceDetailPage },
  { key: "inventory", render: renderInventoryPage },
  { key: "pricelists", render: renderPricelistsPage },
  { key: "pricelist", render: renderPricelistDetailPage },
  { key: "regions", render: renderRegionsPage },
  { key: "visits", render: renderVisitsPage },
  { key: "visit", render: renderVisitDetailPage },
  { key: "reports", render: renderReportsPage },
  { key: "users", render: renderUsersPage },
  { key: "recommendations", render: renderRecommendationsPage },
];

const TABLE_BODY_IDS = {
  sales: "salesTableBody",
  customers: "customersTableBody",
  invoices: "invoicesTableBody",
  inventory: "inventoryTableBody",
  users: "usersTableBody",
  priceLists: "priceListsTableBody",
  regions: "regionsTableBody",
  visits: "visitsTableBody",
};

const USER_ROLE_STORAGE_KEY = "intellisalesUserRole";
const ROLE_PERMISSIONS = {
  administrator: [
    "overview",
    "sales",
    "customers",
    "invoices",
    "invoice",
    "inventory",
    "pricelists",
    "pricelist",
    "regions",
    "visits",
    "visit",
    "reports",
    "users",
    "recommendations",
  ],
  salesManager: [
    "overview",
    "sales",
    "customers",
    "invoices",
    "invoice",
    "inventory",
    "pricelists",
    "pricelist",
    "regions",
    "visits",
    "visit",
    "reports",
    "recommendations",
  ],
  salesSupervisor: [
    "overview",
    "sales",
    "customers",
    "invoices",
    "invoice",
    "regions",
    "visits",
    "visit",
    "reports",
    "recommendations",
  ],
  salesRep: [
    "overview",
    "sales",
    "customers",
    "invoices",
    "invoice",
    "visits",
    "visit",
    "recommendations",
  ],
  accountant: [
    "overview",
    "customers",
    "invoices",
    "invoice",
    "reports",
  ],
};

const sidebarMount = document.getElementById("sidebarMount");
const topbarMount = document.getElementById("topbarMount");
const pageMount = document.getElementById("pageMount");
const modalMount = document.getElementById("modalMount");

function getRouteFromHash(allowedKeys) {
  const hash = window.location.hash.replace("#", "").trim();
  const key = hash.split("/")[0];
  if (allowedKeys.has(key)) {
    return key;
  }

  const fallback = routes.find((route) => allowedKeys.has(route.key) && route.key !== "invoice" && route.key !== "pricelist" && route.key !== "visit");
  return fallback ? fallback.key : "overview";
}

function closeModal() {
  if (modalMount) modalMount.innerHTML = "";
}

function toggleSidebar() {
  const sidebar = document.querySelector('.sidebar');
  if (sidebar) {
    sidebar.classList.toggle('sidebar--open');
  }
}

function closeSidebar() {
  const sidebar = document.querySelector('.sidebar');
  if (sidebar) {
    sidebar.classList.remove('sidebar--open');
  }
}

const ASYNC_MODAL_GETTERS = {
  customer: getCustomer,
  inventory: getProduct,
  priceList: getPriceList,
  user: getUser,
};

async function openEntityModal(entity, mode, id, options = {}) {
  if (!modalMount) return;

  if (entity === "priceItem") {
    modalMount.innerHTML = renderModalLoadingOverlay();
    try {
      const priceListId = options.priceListId;
      const [priceList, productsRes] = await Promise.all([
        getPriceList(priceListId),
        listProductsForPriceList({ limit: 100 }),
      ]);
      const productOptions = (productsRes.items || []).map((p) => ({ value: p.id || p._id, label: p.name }));
      let record = { priceListId };
      if (mode === "edit" && options.itemIndex !== undefined) {
        const item = (priceList.items || [])[options.itemIndex] || {};
        record = { ...item, priceListId, itemIndex: options.itemIndex };
      }
      modalMount.innerHTML = buildModalMarkup("priceItem", mode, "", record, { productOptions });
    } catch (err) {
      modalMount.innerHTML = renderModalErrorOverlay(err);
    }
    return;
  }

  if (entity === "invoice") {
    modalMount.innerHTML = renderModalLoadingOverlay();
    try {
      const [invoice, customersRes, productsRes] = await Promise.all([
        mode === "edit" && id ? getInvoice(id) : Promise.resolve(null),
        listCustomers({ limit: 100 }),
        listProductsForPriceList({ limit: 100 }),
      ]);
      const customerOptions = (customersRes.items || []).map((c) => ({ value: c.id || c._id, label: c.name }));
      const productOptions = (productsRes.items || []).map((p) => ({ value: p.id || p._id, label: p.name }));
      modalMount.innerHTML = buildModalMarkup("invoice", mode, id || "", invoice || {}, { customerOptions, productOptions });
    } catch (err) {
      modalMount.innerHTML = renderModalErrorOverlay(err);
    }
    return;
  }

  if (entity === "visit") {
    modalMount.innerHTML = renderModalLoadingOverlay();
    try {
      const [visit, customersRes] = await Promise.all([
        mode === "edit" && id ? getVisit(id) : Promise.resolve(null),
        listCustomers({ limit: 100 }),
      ]);
      const customerOptions = (customersRes.items || []).map((c) => ({ value: c.id || c._id, label: c.name }));
      modalMount.innerHTML = buildModalMarkup("visit", mode, id || "", visit || {}, { customerOptions });
    } catch (err) {
      modalMount.innerHTML = renderModalErrorOverlay(err);
    }
    return;
  }

  if (entity === "visitComplete") {
    modalMount.innerHTML = buildModalMarkup("visitComplete", mode, id || "", {});
    return;
  }

  const asyncGetter = ASYNC_MODAL_GETTERS[entity];
  if (asyncGetter) {
    modalMount.innerHTML = renderModalLoadingOverlay();
    try {
      const record = mode === "edit" && id ? await asyncGetter(id) : options;
      modalMount.innerHTML = buildModalMarkup(entity, mode, id || "", record || {});
    } catch (err) {
      modalMount.innerHTML = renderModalErrorOverlay(err);
    }
    return;
  }

  modalMount.innerHTML = buildModalMarkup(entity, mode, id || "", options);
}

async function deleteEntity(entity, id) {
  const message = entity === "priceList" ? t("confirm.deletePricelist") : t("confirm.deleteRecord");
  if (!window.confirm(message)) {
    return;
  }
  try {
    if (entity === "user") await deleteUser(id);
    else if (entity === "customer") await deleteCustomer(id);
    else if (entity === "sale") removeSale(id);
    else if (entity === "inventory") await deleteProduct(id);
    else if (entity === "topRep") removeTopRep(id);
    else if (entity === "priceList") await deletePriceList(id);
    else if (entity === "region") removeRegion(id);
    renderApp();
  } catch (err) {
    window.alert(err?.message || t("common.loadError"));
  }
}

async function archiveEntity(entity, id) {
  if (entity === "invoice") {
    const message = t("confirm.archiveRecord") || "Archive this invoice? It will be moved to archived status.";
    if (!window.confirm(message)) {
      return;
    }
    try {
      await archiveInvoice(id);
      renderApp();
    } catch (err) {
      window.alert(err?.message || t("common.loadError"));
    }
  } else if (entity === "inventory") {
    const message = t("confirm.archiveRecord") || "Archive this product? It will be moved to archived status.";
    if (!window.confirm(message)) {
      return;
    }
    try {
      await updateProduct(id, { status: "Archived" });
      renderApp();
    } catch (err) {
      window.alert(err?.message || t("common.loadError"));
    }
  } else if (entity === "priceList") {
    const message = t("confirm.archivePricelist") || "Archive this pricelist? It will be moved to archived status.";
    if (!window.confirm(message)) {
      return;
    }
    try {
      await updatePriceList(id, { status: "Archived" });
      renderApp();
    } catch (err) {
      window.alert(err?.message || t("common.loadError"));
    }
  }
}

function filterTable(tableKey, query) {
  const tbodyId = TABLE_BODY_IDS[tableKey];
  if (!tbodyId) return;
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;
  const q = query.toLowerCase().trim();
  tbody.querySelectorAll("tr").forEach((tr) => {
    tr.style.display = !q || tr.textContent.toLowerCase().includes(q) ? "" : "none";
  });
}

function getCurrentUserRole() {
  if (!isAuthenticated()) {
    window.location.href = "./index.html";
    return null;
  }
  const storedRole = localStorage.getItem(USER_ROLE_STORAGE_KEY);
  if (!storedRole || !ROLE_PERMISSIONS[storedRole]) {
    window.location.href = "./index.html";
    return null;
  }
  return storedRole;
}

async function renderRoute(routeDef) {
  const result = routeDef.render();
  if (!(result instanceof Promise)) {
    pageMount.innerHTML = result;
    return;
  }
  pageMount.innerHTML = renderLoadingState();
  try {
    pageMount.innerHTML = await result;
  } catch (err) {
    pageMount.innerHTML = renderErrorState(err, "retry-route");
  }
}

function renderApp() {
  const currentRole = getCurrentUserRole();
  if (!currentRole) return;
  appState.userRoleKey = currentRole;

  const allowedKeys = new Set(ROLE_PERMISSIONS[currentRole]);
  const activeRoute = getRouteFromHash(allowedKeys);
  setActiveRoute(activeRoute);
  const currentRoute = routes.find((item) => item.key === activeRoute) || routes[0];

  document.title = t("meta.dashboardTitle");

  const sidebarRoutes = routes.filter(
    (route) => allowedKeys.has(route.key) && route.key !== "invoice" && route.key !== "pricelist" && route.key !== "visit"
  );

  sidebarMount.innerHTML = renderSidebar(sidebarRoutes, appState.activeRoute);
  topbarMount.innerHTML = renderTopbar(t(`titles.${currentRoute.key}`), t(`roles.${appState.userRoleKey}`));
  renderRoute(currentRoute);
}

document.addEventListener("click", (event) => {
  const target = event.target;
  const overlayEl = target instanceof HTMLElement ? target.closest(".modal-overlay") : null;
  if (overlayEl && target === overlayEl) {
    closeModal();
    return;
  }

  const routeBtn = target.closest("button[data-route]");
  if (routeBtn && sidebarMount.contains(routeBtn)) {
    window.location.hash = routeBtn.dataset.route || "overview";
    closeSidebar(); // Close sidebar after navigation on mobile
    return;
  }

  if (target.closest('[data-action="logout"]')) {
    localStorage.removeItem(USER_ROLE_STORAGE_KEY);
    logout().finally(() => {
      window.location.href = "./index.html";
    });
    return;
  }

  if (target.closest('[data-action="toggle-sidebar"]')) {
    toggleSidebar();
    return;
  }

  // Close sidebar when clicking outside on mobile, but keep processing the action.
  const sidebar = document.querySelector('.sidebar');
  if (
    window.innerWidth <= 768 &&
    sidebar?.classList.contains('sidebar--open') &&
    !sidebarMount.contains(target) &&
    !target.closest('.mobile-menu-btn')
  ) {
    closeSidebar();
  }

  const actionEl = target.closest("[data-action]");
  if (!actionEl) return;

  const action = actionEl.dataset.action;
  if (action === "set-locale") {
    event.preventDefault();
    const lang = actionEl.dataset.lang;
    if (lang === "en" || lang === "ar") {
      setLocale(lang);
      closeModal();
      renderApp();
    }
    return;
  }
  if (action === "close-modal") {
    event.preventDefault();
    closeModal();
    return;
  }

  if (action === "open-entity-form") {
    event.preventDefault();
    const entity = actionEl.dataset.entity;
    if (entity === "payment" && !can("invoicePayment")) return;
    const mode = actionEl.dataset.mode || "add";
    const id = actionEl.dataset.id || "";
    const options = {};
    if (entity === "priceItem") {
      const priceListId = actionEl.dataset.priceListId;
      if (priceListId) options.priceListId = priceListId;
      if (actionEl.dataset.itemIndex !== undefined) options.itemIndex = Number(actionEl.dataset.itemIndex);
    }
    if (entity) openEntityModal(entity, mode, id, options);
    return;
  }

  if (action === "confirm-invoice") {
    event.preventDefault();
    const invoiceId = actionEl.dataset.id;
    if (invoiceId && window.confirm(t("confirm.confirmInvoice"))) {
      confirmInvoice(invoiceId)
        .then(() => renderApp())
        .catch((err) => window.alert(err?.message || t("common.loadError")));
    }
    return;
  }

  if (action === "mark-sent-invoice") {
    event.preventDefault();
    if (!can("invoiceMarkSent")) return;
    const invoiceId = actionEl.dataset.id;
    if (invoiceId && window.confirm(t("confirm.markSentInvoice"))) {
      markInvoiceSent(invoiceId)
        .then(() => renderApp())
        .catch((err) => window.alert(err?.message || t("common.loadError")));
    }
    return;
  }

  if (action === "open-invoice-pdf") {
    event.preventDefault();
    const invoiceId = actionEl.dataset.id;
    if (invoiceId) {
      getInvoicePdfBlob(invoiceId)
        .then((blob) => {
          const url = URL.createObjectURL(blob);
          window.open(url, "_blank");
          setTimeout(() => URL.revokeObjectURL(url), 60000);
        })
        .catch((err) => window.alert(err?.message || t("common.loadError")));
    }
    return;
  }

  if (action === "cancel-visit") {
    event.preventDefault();
    const visitId = actionEl.dataset.id;
    if (visitId && window.confirm(t("confirm.cancelVisit"))) {
      // Cancellation notes are optional; an empty/cancelled prompt sends no notes.
      const notes = window.prompt(t("visits.cancelNotesPrompt")) || "";
      const payload = notes.trim() ? { notes: notes.trim() } : {};
      cancelVisit(visitId, payload)
        .then(() => renderApp())
        .catch((err) => window.alert(err?.message || t("common.loadError")));
    }
    return;
  }

  if (action === "delete-entity") {
    event.preventDefault();
    const entity = actionEl.dataset.entity;
    const id = actionEl.dataset.id;
    if (entity && id) deleteEntity(entity, id);
    return;
  }

  if (action === "archive-entity") {
    event.preventDefault();
    const entity = actionEl.dataset.entity;
    const id = actionEl.dataset.id;
    if (entity && id) archiveEntity(entity, id);
    return;
  }

  if (action === "retry-route") {
    event.preventDefault();
    renderApp();
    return;
  }

  if (action === "page-prev" || action === "page-next") {
    event.preventDefault();
    const entityKey = actionEl.dataset.entityKey;
    if (entityKey) {
      setListPage(entityKey, getListPage(entityKey) + (action === "page-prev" ? -1 : 1));
      renderApp();
    }
    return;
  }

  if (action === "load-recommendations") {
    event.preventDefault();
    const select = document.getElementById("recommendationsCustomerSelect");
    const resultsEl = document.getElementById("recommendationsResults");
    const customerId = select?.value;
    if (!customerId || !resultsEl) return;
    resultsEl.innerHTML = renderLoadingState();
    getCustomerRecommendations(customerId, { limit: 5, includeHistory: true })
      .then((data) => {
        resultsEl.innerHTML = renderRecommendationResults(data);
      })
      .catch((err) => {
        resultsEl.innerHTML = renderErrorState(err);
      });
    return;
  }

  if (action === "delete-price-item") {
    event.preventDefault();
    const priceListId = actionEl.dataset.priceListId;
    const itemIndex = actionEl.dataset.itemIndex;
    if (priceListId && itemIndex !== undefined && window.confirm(t("confirm.deleteRecord"))) {
      removePriceListItem(priceListId, Number(itemIndex))
        .then(() => renderApp())
        .catch((err) => window.alert(err?.message || t("common.loadError")));
    }
    return;
  }

  if (action === "nav-route") {
    event.preventDefault();
    const route = actionEl.dataset.route || "overview";
    window.location.hash = route;
  }
});

document.addEventListener("submit", (event) => {
  const form = event.target;
  if (!(form instanceof HTMLFormElement)) return;
  if (form.id !== "dashboardEntityForm") return;
  event.preventDefault();

  const submitBtn = form.closest(".modal-card")?.querySelector('button[type="submit"]');
  const originalLabel = submitBtn?.textContent;
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = t("common.saving");
  }

  Promise.resolve(handleEntityFormSubmit(form)).then((result) => {
    if (result === false) {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalLabel;
      }
      return;
    }
    closeModal();
    renderApp();
  });
});

window.addEventListener("hashchange", () => {
  closeModal();
  renderApp();
});

let searchDebounceTimer = null;
let searchRequestToken = 0;

function handleSearchInput(entityKey, rawValue) {
  clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(() => {
    const trimmed = rawValue.trim();
    // Start after 2 characters; empty resets. A lone character is ignored.
    if (trimmed.length === 1) return;
    if (getListSearch(entityKey) === trimmed) return;
    setListSearch(entityKey, trimmed);
    setListPage(entityKey, 1);
    reloadActivePageForSearch(entityKey);
  }, 350);
}

async function reloadActivePageForSearch(entityKey) {
  const allowedKeys = new Set(ROLE_PERMISSIONS[appState.userRoleKey] || []);
  const activeRoute = getRouteFromHash(allowedKeys);
  const currentRoute = routes.find((item) => item.key === activeRoute) || routes[0];
  const token = ++searchRequestToken;
  try {
    const result = currentRoute.render();
    const html = result instanceof Promise ? await result : result;
    if (token !== searchRequestToken) return; // a newer keystroke superseded this request
    pageMount.innerHTML = html;
  } catch (err) {
    if (token !== searchRequestToken) return;
    pageMount.innerHTML = renderErrorState(err, "retry-route");
  }
  const input = document.getElementById(`search-${entityKey}`);
  if (input) {
    input.focus();
    const value = input.value;
    input.value = "";
    input.value = value; // keep the caret at the end after re-render
  }
}

document.addEventListener("input", (event) => {
  const el = event.target;
  if (!(el instanceof HTMLInputElement)) return;
  // Local demo pages (Sales, Regions) keep client-side row filtering.
  if (el.classList.contains("table-filter")) {
    const table = el.dataset.table;
    if (table) filterTable(table, el.value);
    return;
  }
  // Backend-connected lists: debounced server-side search.
  const searchKey = el.dataset.search;
  if (searchKey) handleSearchInput(searchKey, el.value);
});

renderApp();

if (isAuthenticated()) {
  refreshCurrentUser().catch(() => {});
}
