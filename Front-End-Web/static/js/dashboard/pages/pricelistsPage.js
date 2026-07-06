import { escapeHtml } from "../utils/html.js";
import { renderRowActions } from "../components/tableActions.js";
import { renderPager } from "../components/asyncState.js";
import { t } from "../../i18n/i18n.js";
import { getListPage } from "../state/appState.js";
import { listPriceLists } from "../../api/services/priceListsService.js";

export async function renderPricelistsPage() {
  const page = getListPage("priceLists");
  const { items, pagination } = await listPriceLists({ page, limit: 20 });

  const listsRows = items
    .map((pl) => {
      const id = pl.id || pl._id;
      return `
        <tr>
          <td class="td-strong"><button type="button" class="btn-text btn-text--view" data-action="nav-route" data-route="pricelist/${escapeHtml(id)}">${escapeHtml(pl.name)}</button></td>
          <td>${escapeHtml(pl.description)}</td>
          <td><span class="badge badge--neutral">${escapeHtml(pl.status)}</span></td>
          <td class="td-muted">${(pl.items || []).length}</td>
          <td class="td-actions">${renderRowActions("priceList", id)}</td>
        </tr>
      `;
    })
    .join("");

  return `
    <section class="panel panel--flush">
      <div class="toolbar toolbar--split">
        <div>
          <h3 class="toolbar-title">${escapeHtml(t("pricelists.sectionLists"))}</h3>
          <p class="toolbar-desc">${escapeHtml(t("pricelists.sectionListsDesc"))}</p>
        </div>
        <div class="toolbar-filters toolbar-filters--inline">
          <input class="search-input table-filter" type="search" data-table="priceLists" placeholder="${escapeHtml(t("pricelists.searchListsPh"))}" />
          <button class="primary-btn" type="button" data-action="open-entity-form" data-entity="priceList" data-mode="add">${escapeHtml(t("pricelists.addList"))}</button>
        </div>
      </div>
      <div class="table-shell">
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>${escapeHtml(t("pricelists.thName"))}</th>
                <th>${escapeHtml(t("pricelists.thDesc"))}</th>
                <th>${escapeHtml(t("pricelists.thStatus"))}</th>
                <th>${escapeHtml(t("pricelists.thProducts"))}</th>
                <th class="th-actions">${escapeHtml(t("common.actions"))}</th>
              </tr>
            </thead>
            <tbody id="priceListsTableBody">${listsRows || `<tr><td colspan="5" class="text-center">${escapeHtml(t("common.noData"))}</td></tr>`}</tbody>
          </table>
        </div>
      </div>
      ${renderPager(pagination, "priceLists")}
    </section>
  `;
}
