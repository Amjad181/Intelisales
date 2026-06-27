import { renderSidebar } from "./components/sidebar.js";
import { renderTopbar } from "./components/topbar.js";
import { buildModalMarkup, handleEntityFormSubmit, buildInvoiceItemsModalMarkup } from "./components/entityModal.js";
import { appState, setActiveRoute } from "./state/appState.js";
import {
  dataStore,
  removeCustomer,
  removeInventoryAlert,
  removePriceList,
  removePriceListItem,
  removeSale,
  removeTopRep,
  removeUser,
  removeInvoice,
  removeRegion,
  removeVisitSchedule,
  removeDailyVisit,
} from "./state/dataStore.js";
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
import { t, setLocale, initI18n } from "../i18n/i18n.js";

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
  dailyVisits: "dailyVisitsTableBody",
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
  ],
  salesRep: [
    "overview",
    "sales",
    "customers",
    "invoices",
    "invoice",
    "visits",
    "visit",
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

function openEntityModal(entity, mode, id, options = {}) {
  if (!modalMount) return;
  modalMount.innerHTML = buildModalMarkup(entity, mode, id || "", options);
}

function openInvoiceItemsModal(invoiceId) {
  if (!modalMount) return;
  modalMount.innerHTML = buildInvoiceItemsModalMarkup(invoiceId);
}

function deleteEntity(entity, id) {
  const message = entity === "priceList" ? t("confirm.deletePricelist") : t("confirm.deleteRecord");
  if (!window.confirm(message)) {
    return;
  }
  if (entity === "user") removeUser(id);
  else if (entity === "customer") removeCustomer(id);
  else if (entity === "sale") removeSale(id);
  else if (entity === "invoice") removeInvoice(id);
  else if (entity === "inventory") removeInventoryAlert(id);
  else if (entity === "topRep") removeTopRep(id);
  else if (entity === "priceList") removePriceList(id);
  else if (entity === "priceItem") removePriceListItem(id);
  else if (entity === "region") removeRegion(id);
  else if (entity === "visit") removeVisitSchedule(id);
  else if (entity === "dailyVisit") removeDailyVisit(id);
  renderApp();
}

function archiveEntity(entity, id) {
  if (entity === "invoice") {
    const message = t("confirm.archiveRecord") || "Archive this invoice? It will be moved to archived status.";
    if (!window.confirm(message)) {
      return;
    }
    // For demo purposes, we'll just update the status to "Archived"
    const invoice = dataStore.invoices.find(inv => inv.id === id);
    if (invoice) {
      invoice.status = "Archived";
      renderApp();
    }
  } else if (entity === "inventory") {
    const message = t("confirm.archiveRecord") || "Archive this product? It will be moved to archived status.";
    if (!window.confirm(message)) {
      return;
    }
    // For demo purposes, we'll just update the status to "Archived"
    const product = dataStore.inventoryAlerts.find(inv => inv.id === id);
    if (product) {
      product.status = "Archived";
      renderApp();
    }
  } else if (entity === "priceList") {
    const message = t("confirm.archivePricelist") || "Archive this pricelist? It will be moved to archived status.";
    if (!window.confirm(message)) {
      return;
    }
    const pricelist = dataStore.priceLists.find((pl) => pl.id === id);
    if (pricelist) {
      pricelist.status = "Archived";
      renderApp();
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
  const storedRole = localStorage.getItem(USER_ROLE_STORAGE_KEY);
  if (!storedRole || !ROLE_PERMISSIONS[storedRole]) {
    window.location.href = "./index.html";
    return null;
  }
  return storedRole;
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
  pageMount.innerHTML = currentRoute.render();
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
    window.location.href = "./index.html";
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
    const mode = actionEl.dataset.mode || "add";
    const id = actionEl.dataset.id || "";
    const options = {};
    if (entity === "priceItem") {
      const priceListId = actionEl.dataset.priceListId;
      if (priceListId) options.priceListId = priceListId;
    }
    if (entity) openEntityModal(entity, mode, id, options);
    return;
  }

  if (action === "view-invoice-items") {
    event.preventDefault();
    const invoiceId = actionEl.dataset.invoiceId;
    if (invoiceId) openInvoiceItemsModal(invoiceId);
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
  handleEntityFormSubmit(form);
  closeModal();
  renderApp();
});

window.addEventListener("hashchange", () => {
  closeModal();
  renderApp();
});

document.addEventListener("input", (event) => {
  const el = event.target;
  if (!(el instanceof HTMLInputElement)) return;
  if (!el.classList.contains("table-filter")) return;
  const table = el.dataset.table;
  if (table) filterTable(table, el.value);
});

renderApp();
