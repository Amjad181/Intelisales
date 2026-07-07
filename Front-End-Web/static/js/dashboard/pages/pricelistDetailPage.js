import { escapeHtml } from "../utils/html.js";
import { t } from "../../i18n/i18n.js";
import { renderErrorState } from "../components/asyncState.js";
import { getPriceList } from "../../api/services/priceListsService.js";
import { listProductsForPriceList } from "../../api/services/productsService.js";

export async function renderPricelistDetailPage() {
  const hash = window.location.hash.replace("#", "").trim();
  const pricelistId = hash.split("/")[1] || "";

  if (!pricelistId) {
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

  let pricelist;
  let productsById;
  try {
    const [pl, productsRes] = await Promise.all([
      getPriceList(pricelistId),
      listProductsForPriceList({ limit: 100 }),
    ]);
    pricelist = pl;
    productsById = new Map((productsRes.items || []).map((p) => [p.id || p._id, p.name]));
  } catch (err) {
    return renderErrorState(err, "retry-route");
  }

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

  const items = pricelist.items || [];
  const itemRows = items.length > 0
    ? items.map((item, index) => `
        <tr>
          <td>${escapeHtml(productsById.get(item.productId) || item.productId)}</td>
          <td>${escapeHtml(item.price)}</td>
          <td>${escapeHtml(item.currency || "")}</td>
          <td>
            <div class="table-actions">
              <button type="button" class="btn-text btn-text--edit" data-action="open-entity-form" data-entity="priceItem" data-mode="edit" data-price-list-id="${escapeHtml(pricelistId)}" data-item-index="${index}">${escapeHtml(t("common.edit"))}</button>
              <button type="button" class="btn-text btn-text--danger" data-action="delete-price-item" data-price-list-id="${escapeHtml(pricelistId)}" data-item-index="${index}">${escapeHtml(t("common.delete"))}</button>
            </div>
          </td>
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
                <td>${escapeHtml(pricelist.name)}</td>
              </tr>
              <tr>
                <th>${escapeHtml(t("form.priceList.desc"))}</th>
                <td>${escapeHtml(pricelist.description || "—")}</td>
              </tr>
              <tr>
                <th>${escapeHtml(t("form.priceList.customerType"))}</th>
                <td>${escapeHtml(pricelist.customerType || "—")}</td>
              </tr>
              <tr>
                <th>${escapeHtml(t("form.priceList.status"))}</th>
                <td>${escapeHtml(pricelist.status)}</td>
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
                <th>${escapeHtml(t("form.priceItem.currency"))}</th>
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
