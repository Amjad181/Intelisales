import { escapeHtml } from "../utils/html.js";
import { renderRowActions } from "../components/tableActions.js";
import { renderPager, renderSearchInput } from "../components/asyncState.js";
import { t } from "../../i18n/i18n.js";
import { labelUserStatus } from "../../i18n/labels.js";
import { roleKeyFromBackend } from "../../api/roleMap.js";
import { getListPage, getListSearch } from "../state/appState.js";
import { listUsers } from "../../api/services/usersService.js";

function labelBackendRole(role) {
  const key = roleKeyFromBackend(role);
  return key ? t(`labels.role.${key}`) : role;
}

export async function renderUsersPage() {
  const page = getListPage("users");
  const search = getListSearch("users");
  const { items, pagination } = await listUsers({ page, limit: 20, search });

  const rows = items
    .map((u) => {
      const id = u.id || u._id;
      return `
        <tr>
          <td>
            <div class="cell-stack">
              <span class="td-strong">${escapeHtml(u.name)}</span>
              <span class="td-sub">${escapeHtml(u.email)}</span>
            </div>
          </td>
          <td>${escapeHtml(labelBackendRole(u.role))}</td>
          <td><span class="badge ${u.status === "Active" ? "badge--ok" : u.status === "On Leave" ? "badge--warn" : "badge--neutral"}">${escapeHtml(labelUserStatus(u.status))}</span></td>
          <td class="td-actions">${renderRowActions("user", id)}</td>
        </tr>
      `;
    })
    .join("");

  return `
    <section class="panel panel--flush">
      <div class="toolbar">
        ${renderSearchInput("users", t("users.searchPh"), search)}
        <button class="primary-btn toolbar-primary" type="button" data-action="open-entity-form" data-entity="user" data-mode="add">${escapeHtml(t("users.add"))}</button>
      </div>
      <div class="table-shell">
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>${escapeHtml(t("users.thUser"))}</th>
                <th>${escapeHtml(t("users.thRole"))}</th>
                <th>${escapeHtml(t("users.thStatus"))}</th>
                <th class="th-actions">${escapeHtml(t("common.actions"))}</th>
              </tr>
            </thead>
            <tbody id="usersTableBody">${rows || `<tr><td colspan="4" class="text-center">${escapeHtml(t("common.noData"))}</td></tr>`}</tbody>
          </table>
        </div>
      </div>
      ${renderPager(pagination, "users")}
    </section>
  `;
}
