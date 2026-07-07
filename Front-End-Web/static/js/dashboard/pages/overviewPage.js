import { escapeHtml } from "../utils/html.js";
import { t } from "../../i18n/i18n.js";
import { appState } from "../state/appState.js";
import { getDashboardSummary, getSalesRepsPerformance, getRecentActivity } from "../../api/services/dashboardService.js";

// Sales-reps performance is restricted to these roles by the backend — don't even
// request it for others (it would 403 and blank an otherwise-healthy dashboard).
const SALES_REPS_ROLES = new Set(["administrator", "salesManager", "salesSupervisor"]);

export async function renderOverviewPage() {
  // The summary is the primary payload — let it surface a real error/retry state.
  const summary = await getDashboardSummary();

  // Secondary panels load independently so a single failure (e.g. 403) doesn't blank the page.
  const canSeeReps = SALES_REPS_ROLES.has(appState.userRoleKey);
  const [salesRepsRes, activityRes] = await Promise.allSettled([
    canSeeReps ? getSalesRepsPerformance() : Promise.resolve([]),
    getRecentActivity(10),
  ]);
  const salesReps = salesRepsRes.status === "fulfilled" ? salesRepsRes.value : [];
  const recentActivity = activityRes.status === "fulfilled" ? activityRes.value : [];

  // The PDF only documents the summary's top-level groups (customers/products/invoices/visits/recent),
  // not exact field names within each — read defensively until verified against a real backend.
  const kpis = [
    { label: t("overview.kpi.totalCustomers"), value: summary?.customers?.total ?? "—" },
    { label: t("overview.kpi.totalProducts"), value: summary?.products?.total ?? "—" },
    { label: t("overview.kpi.totalInvoices"), value: summary?.invoices?.total ?? "—" },
    { label: t("overview.kpi.totalVisits"), value: summary?.visits?.total ?? "—" },
  ];

  const kpiHtml = kpis
    .map(
      (item) => `
        <article class="kpi-card">
          <h3>${escapeHtml(item.label)}</h3>
          <p>${escapeHtml(item.value)}</p>
        </article>
      `
    )
    .join("");

  const repsList = Array.isArray(salesReps) ? salesReps : [];
  const repsHtml = repsList.length
    ? repsList
        .map(
          (rep) => `
            <li class="list-row">
              <div class="list-row__main">
                <span class="list-row__title">${escapeHtml(rep.name || rep.user?.name || "—")}</span>
                <span class="list-row__meta">${escapeHtml(rep.totalSales ?? rep.amount ?? "—")}</span>
              </div>
            </li>
          `
        )
        .join("")
    : `<li class="list-row"><span class="list-row__title">${escapeHtml(t("common.noData"))}</span></li>`;

  const activityList = Array.isArray(recentActivity) ? recentActivity : [];
  const activityHtml = activityList.length
    ? activityList
        .map(
          (item) => `
            <li class="list-row">
              <div class="list-row__main">
                <span class="list-row__title">${escapeHtml(item.description || item.message || item.type || "—")}</span>
                <span class="list-row__meta">${escapeHtml(item.createdAt ? new Date(item.createdAt).toLocaleString() : "")}</span>
              </div>
            </li>
          `
        )
        .join("")
    : `<li class="list-row"><span class="list-row__title">${escapeHtml(t("common.noData"))}</span></li>`;

  return `
    <section class="kpi-grid">${kpiHtml}</section>
    <section class="panel-grid">
      <article class="panel panel--tight">
        <div class="panel-head">
          <h3>${escapeHtml(t("overview.topReps"))}</h3>
        </div>
        <ul class="list list--rows">${repsHtml}</ul>
      </article>
      <article class="panel panel--tight">
        <div class="panel-head">
          <h3>${escapeHtml(t("overview.recentActivity"))}</h3>
        </div>
        <ul class="list list--rows">${activityHtml}</ul>
      </article>
    </section>
  `;
}
