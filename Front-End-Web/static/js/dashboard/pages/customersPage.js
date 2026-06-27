import { dataStore, getRegionName, getUserName } from "../state/dataStore.js";
import { escapeHtml } from "../utils/html.js";
import { renderRowActions } from "../components/tableActions.js";
import { t } from "../../i18n/i18n.js";

export function renderCustomersPage() {
  const rows = dataStore.customers
    .map(
      (row) => `
        <tr>
          <td class="td-muted">${escapeHtml(row.customer_id)}</td>
          <td class="td-strong">${escapeHtml(row.customer_name)}</td>
          <td>${escapeHtml(row.shop_name)}</td>
          <td>${escapeHtml(row.phone1)}${row.phone2 ? `, ${escapeHtml(row.phone2)}` : ''}</td>
          <td>${escapeHtml(getRegionName(row.region_id))}</td>
          <td>${escapeHtml(getUserName(row.assigned_user_id))}</td>
          <td><span class="badge badge--${row.customer_type === 'Retail' ? 'ok' : 'info'}">${escapeHtml(row.customer_type)}</span></td>
          <td class="td-actions">${renderRowActions("customer", row.id)}</td>
        </tr>
      `
    )
    .join("");

  return `
    <section class="panel panel--flush">
      <div class="toolbar">
        <input class="search-input table-filter" type="search" data-table="customers" placeholder="${escapeHtml(t("customers.searchPh"))}" />
        <button class="primary-btn toolbar-primary" type="button" data-action="open-entity-form" data-entity="customer" data-mode="add">${escapeHtml(t("customers.add"))}</button>
      </div>
      <div class="table-shell">
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>${escapeHtml(t("customers.thId"))}</th>
                <th>${escapeHtml(t("customers.thName"))}</th>
                <th>${escapeHtml(t("customers.thShopName"))}</th>
                <th>${escapeHtml(t("customers.thPhone"))}</th>
                <th>${escapeHtml(t("customers.thRegion"))}</th>
                <th>${escapeHtml(t("customers.thAssignedUser"))}</th>
                <th>${escapeHtml(t("customers.thType"))}</th>
                <th class="th-actions">${escapeHtml(t("common.actions"))}</th>
              </tr>
            </thead>
            <tbody id="customersTableBody">${rows}</tbody>
          </table>
        </div>
      </div>
    </section>
  `;
}
