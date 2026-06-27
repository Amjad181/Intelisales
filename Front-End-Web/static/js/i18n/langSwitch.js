import { t, getLocale } from "./i18n.js";

export function renderLangSwitch(className = "lang-switch") {
  const cur = getLocale();
  const label = t("lang.switchLabel");
  return `
    <div class="${className}" role="group" aria-label="${label}">
      <button type="button" class="lang-switch__btn ${cur === "en" ? "is-active" : ""}" data-action="set-locale" data-lang="en">${t("lang.en")}</button>
      <button type="button" class="lang-switch__btn ${cur === "ar" ? "is-active" : ""}" data-action="set-locale" data-lang="ar">${t("lang.ar")}</button>
    </div>
  `;
}
