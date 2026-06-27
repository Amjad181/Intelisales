import { dataStore, getUserName, getPricelistItems } from "../state/dataStore.js";
import { escapeHtml } from "../utils/html.js";
import { t } from "../../i18n/i18n.js";
import { renderRowActions } from "../components/tableActions.js";

export function renderPricelistDetailPage() {
  const hash = window.location.hash.replace("#", "").trim();
  const pricelistId = hash.split("/")[1] || "";
  const pricelist = dataStore.priceLists.find((pl) => pl.id === pricelistId);

  if (!pricelist) {
    return `
      <section class="panel panel--flush">
        <div class="toolbar">
          <button class="secondary-btn" type="button" data-action="nav-route" data-route="pricelists">${escapeHtml(t("common.list"))}</button>
        </div>
        <div class="panel-body">
          <p>${escapeHtml(t("common.notFound"))}</p>
        </div>
      </section>
    `;
  }

  const items = getPricelistItems(pricelistId);
  const itemRows = items.length > 0
    ? items.map((item) => `
        <tr>
          <td>${escapeHtml(item.product_name)}</td>
          <td>${escapeHtml(item.price)}</td>
          <td>${escapeHtml(new Date(item.created_at).toLocaleDateString())}</td>
          <td>${renderRowActions("priceItem", item.id)}</td>
        </tr>
      `).join("")
    : `<tr><td colspan="4" class="text-center">${escapeHtml(t("common.noData"))}</td></tr>`;

  return `
    <section class="panel panel--flush">
      <div class="toolbar">
        <button class="secondary-btn" type="button" data-action="nav-route" data-route="pricelists">${escapeHtml(t("common.list"))}</button>
        <button class="primary-btn" type="button" data-action="open-entity-form" data-entity="priceList" data-mode="edit" data-id="${escapeHtml(pricelistId)}">${escapeHtml(t("common.edit"))}</button>
      </div>

      <div class="table-shell">
        <div class="table-wrap">
          <table class="data-table">
            <tbody>
              <tr>
                <th>${escapeHtml(t("form.priceList.name"))}</th>
                <td><div class="modal-field"><input id="fld-name" name="name" type="text" value="${escapeHtml(pricelist.name)}" readonly /></div></td>
              </tr>
              <tr>
                <th>${escapeHtml(t("form.priceList.desc"))}</th>
                <td><div class="modal-field"><input id="fld-desc" name="desc" type="text" value="${escapeHtml(pricelist.desc)}" readonly /></div></td>
              </tr>
              <tr>
                <th>${escapeHtml(t("form.priceList.createdBy"))}</th>
                <td><div class="modal-field"><input id="fld-created_by" name="created_by" type="text" value="${escapeHtml(getUserName(pricelist.created_by))}" readonly /></div></td>
              </tr>
              <tr>
                <th>${escapeHtml(t("form.priceList.createdAt"))}</th>
                <td><div class="modal-field"><input id="fld-created_at" name="created_at" type="text" value="${escapeHtml(new Date(pricelist.created_at).toLocaleDateString())}" readonly /></div></td>
              </tr>
              <tr>
                <th>${escapeHtml(t("form.priceList.status"))}</th>
                <td><div class="modal-field"><input id="fld-status" name="status" type="text" value="${escapeHtml(pricelist.status)}" readonly /></div></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="toolbar" style="margin-top:1.5rem; justify-content:space-between; align-items:center;">
        <h3>${escapeHtml(t("pricelists.sectionItems"))}</h3>
        <button class="secondary-btn" type="button" data-action="open-entity-form" data-entity="priceItem" data-mode="add" data-price-list-id="${escapeHtml(pricelistId)}">${escapeHtml(t("inventory.addItem"))}</button>
      </div>

      <div class="table-shell">
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>${escapeHtml(t("pricelists.thProduct"))}</th>
                <th>${escapeHtml(t("pricelists.thPrice"))}</th>
                <th>${escapeHtml(t("pricelists.thCreatedAt"))}</th>
                <th>${escapeHtml(t("common.actions"))}</th>
              </tr>
            </thead>
            <tbody>${itemRows}</tbody>
          </table>
        </div>
      </div>
    </section>
  `;
}