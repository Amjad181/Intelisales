import { t } from "../../i18n/i18n.js";
import { escapeHtml } from "../utils/html.js";

const REPORT_TYPES = ["daily", "monthly", "aging", "repPerf"];

function renderReportOverview() {
  return `
    <section class="panel">
      <h3>${escapeHtml(t("reports.title"))}</h3>
      <p>${escapeHtml(t("reports.intro"))}</p>
      <div class="actions">
        <button type="button" class="secondary-btn" data-action="nav-route" data-route="reports/daily">${escapeHtml(t("reports.daily"))}</button>
        <button type="button" class="secondary-btn" data-action="nav-route" data-route="reports/monthly">${escapeHtml(t("reports.monthly"))}</button>
        <button type="button" class="secondary-btn" data-action="nav-route" data-route="reports/aging">${escapeHtml(t("reports.aging"))}</button>
        <button type="button" class="secondary-btn" data-action="nav-route" data-route="reports/repPerf">${escapeHtml(t("reports.repPerf"))}</button>
      </div>
    </section>
  `;
}

function renderReportDetail(reportType) {
  const reportKey = REPORT_TYPES.includes(reportType) ? reportType : "daily";
  return `
    <section class="panel">
      <h3>${escapeHtml(t(`reports.${reportKey}ReportTitle`))}</h3>
      <p>${escapeHtml(t(`reports.${reportKey}ReportIntro`))}</p>
      <div class="panel-body">
        <p>${escapeHtml(t("reports.reportComingSoon"))}</p>
      </div>
      <div class="actions">
        <button type="button" class="secondary-btn" data-action="nav-route" data-route="reports">${escapeHtml(t("common.list"))}</button>
      </div>
    </section>
  `;
}

export function renderReportsPage() {
  const hash = window.location.hash.replace("#", "").trim();
  const parts = hash.split("/");
  const reportType = parts[1] || "";

  if (!reportType) {
    return renderReportOverview();
  }

  return renderReportDetail(reportType);
}
