import { escapeHtml } from "../utils/html.js";
import { renderRowActions } from "../components/tableActions.js";
import { renderPager, renderSearchInput } from "../components/asyncState.js";
import { t } from "../../i18n/i18n.js";
import { labelProductStatus } from "../../i18n/labels.js";
import { getListPage, getListSearch } from "../state/appState.js";
import { listProducts } from "../../api/services/productsService.js";

export async function renderInventoryPage() {
  const page = getListPage("inventory");
  const search = getListSearch("inventory");
  const { items, pagination } = await listProducts({ page, limit: 20, search });

  const rows = items
    .map((row) => {
      const id = row.id || row._id;
      return `
        <tr>
          <td class="td-muted">${escapeHtml(row.productCode || row.sku || "—")}</td>
          <td class="td-strong">${escapeHtml(row.name)}</td>
          <td>${escapeHtml(row.category || "—")}</td>
          <td>${escapeHtml(row.unit)}</td>
          <td>${escapeHtml(row.basePrice)} ${escapeHtml(row.currency || "")}</td>
          <td><span class="badge badge--${row.status === 'Active' ? 'ok' : row.status === 'Inactive' ? 'warning' : row.status === 'Archived' ? 'secondary' : 'danger'}">${escapeHtml(labelProductStatus(row.status))}</span></td>
          <td class="td-actions">${renderRowActions("inventory", id)}</td>
        </tr>
      `;
    })
    .join("");

  return `
    <section class="panel panel--flush">
      <div class="toolbar">
        ${renderSearchInput("inventory", t("inventory.searchPh"), search)}
        <button class="primary-btn toolbar-primary" type="button" data-action="open-entity-form" data-entity="inventory" data-mode="add">${escapeHtml(t("inventory.addItem"))}</button>
      </div>
      <div class="table-shell">
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>${escapeHtml(t("inventory.thProductCode"))}</th>
                <th>${escapeHtml(t("inventory.thProductName"))}</th>
                <th>${escapeHtml(t("inventory.thCategory"))}</th>
                <th>${escapeHtml(t("inventory.thUnit"))}</th>
                <th>${escapeHtml(t("inventory.thPrice"))}</th>
                <th>${escapeHtml(t("inventory.thStatus"))}</th>
                <th class="th-actions">${escapeHtml(t("common.actions"))}</th>
              </tr>
            </thead>
            <tbody id="inventoryTableBody">${rows || `<tr><td colspan="7" class="text-center">${escapeHtml(t("common.noData"))}</td></tr>`}</tbody>
          </table>
        </div>
      </div>
      ${renderPager(pagination, "inventory")}
    </section>
  `;
}
