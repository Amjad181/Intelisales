import { getUserName } from "../state/dataStore.js";
import { escapeHtml } from "../utils/html.js";
import { renderRowActions } from "../components/tableActions.js";
import { renderPager } from "../components/asyncState.js";
import { t } from "../../i18n/i18n.js";
import { getListPage } from "../state/appState.js";
import { listCustomers } from "../../api/services/customersService.js";

export async function renderCustomersPage() {
  const page = getListPage("customers");
  const { items, pagination } = await listCustomers({ page, limit: 20 });

  const rows = items
    .map((row) => {
      const id = row.id || row._id;
      return `
        <tr>
          <td class="td-strong">${escapeHtml(row.name)}</td>
          <td>${escapeHtml(row.contactName || "—")}</td>
          <td>${escapeHtml(row.phone || "—")}</td>
          <td>${escapeHtml(row.email || "—")}</td>
          <td>${escapeHtml(getUserName(row.assignedSalesRep))}</td>
          <td><span class="badge badge--${row.customerType === 'Retail' ? 'ok' : 'info'}">${escapeHtml(row.customerType)}</span></td>
          <td class="td-actions">${renderRowActions("customer", id)}</td>
        </tr>
      `;
    })
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
                <th>${escapeHtml(t("customers.thName"))}</th>
                <th>${escapeHtml(t("customers.thContactName"))}</th>
                <th>${escapeHtml(t("customers.thPhone"))}</th>
                <th>${escapeHtml(t("customers.thEmail"))}</th>
                <th>${escapeHtml(t("customers.thAssignedUser"))}</th>
                <th>${escapeHtml(t("customers.thType"))}</th>
                <th class="th-actions">${escapeHtml(t("common.actions"))}</th>
              </tr>
            </thead>
            <tbody id="customersTableBody">${rows || `<tr><td colspan="7" class="text-center">${escapeHtml(t("common.noData"))}</td></tr>`}</tbody>
          </table>
        </div>
      </div>
      ${renderPager(pagination, "customers")}
    </section>
  `;
}
