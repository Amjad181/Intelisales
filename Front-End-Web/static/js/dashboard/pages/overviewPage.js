import { escapeHtml } from "../utils/html.js";
import { t } from "../../i18n/i18n.js";
import { appState } from "../state/appState.js";
import { getDashboardSummary, getSalesRepsPerformance } from "../../api/services/dashboardService.js";

// Sales-reps performance is restricted to these roles by the backend — don't even
// request it for others (it would 403 and blank an otherwise-healthy dashboard).
const SALES_REPS_ROLES = new Set(["administrator", "salesManager", "salesSupervisor"]);

function kpiCard({ label, value, route }) {
  const valueHtml = `<h3>${escapeHtml(label)}</h3><p>${escapeHtml(value)}</p>`;
  if (!route) {
    return `<article class="kpi-card">${valueHtml}</article>`;
  }
  return `
    <button type="button" class="kpi-card kpi-card--clickable" data-action="nav-route" data-route="${escapeHtml(route)}">
      ${valueHtml}
    </button>
  `;
}

export async function renderOverviewPage() {
  // The summary is the primary payload — let it surface a real error/retry state.
  const summary = await getDashboardSummary();

  // Sales-reps performance loads independently so a single failure (e.g. 403) doesn't blank the page.
  const canSeeReps = SALES_REPS_ROLES.has(appState.userRoleKey);
  const salesRepsRes = await Promise.allSettled([
    canSeeReps ? getSalesRepsPerformance() : Promise.resolve([]),
  ]);
  const salesReps = salesRepsRes[0].status === "fulfilled" ? salesRepsRes[0].value : [];

  const kpiHtml = [
    kpiCard({ label: t("overview.kpi.totalCustomers"), value: summary?.customers?.total ?? "—", route: "customers" }),
    kpiCard({ label: t("overview.kpi.totalProducts"), value: summary?.products?.total ?? "—", route: "inventory" }),
    kpiCard({ label: t("overview.kpi.totalInvoices"), value: summary?.invoices?.total ?? "—", route: "invoices" }),
  ].join("");

  // The backend sorts sales reps by this month's confirmed sales (descending), so the
  // first entry is the current top performer.
  const repsList = Array.isArray(salesReps) ? salesReps : [];
  const topRep = repsList[0] || null;
  const topRepHtml = topRep
    ? `
      <div class="top-rep-spotlight">
        <p class="top-rep-spotlight__name">${escapeHtml(topRep.name || "—")}</p>
        <p class="top-rep-spotlight__amount">${escapeHtml(topRep.totalSalesAmount ?? 0)} ${escapeHtml(topRep.currency || "SYP")}</p>
        <p class="top-rep-spotlight__meta">${escapeHtml(t("overview.topRepThisMonth"))}</p>
      </div>
    `
    : `<p class="modal-hint">${escapeHtml(t("common.noData"))}</p>`;

  const topRepsPanel = canSeeReps
    ? `
      <article class="panel panel--tight">
        <div class="panel-head">
          <h3>${escapeHtml(t("overview.topReps"))}</h3>
        </div>
        ${topRepHtml}
      </article>
    `
    : "";

  return `
    <section class="kpi-grid">${kpiHtml}</section>
    ${topRepsPanel}
  `;
}
