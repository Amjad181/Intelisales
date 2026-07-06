import { t, setLocale, initI18n } from "../i18n/i18n.js";
import { renderLangSwitch } from "../i18n/langSwitch.js";
import { login } from "../api/authService.js";
import { roleKeyFromBackend } from "../api/roleMap.js";

const USER_ROLE_STORAGE_KEY = "intellisalesUserRole";

initI18n();

const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const emailError = document.getElementById("emailError");
const passwordError = document.getElementById("passwordError");
const submitButton = document.getElementById("submitButton");
const togglePasswordButton = document.getElementById("togglePassword");
const formStatus = document.getElementById("formStatus");
const loginLangMount = document.getElementById("loginLangMount");

function applyLoginTranslations() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n;
    if (key) el.textContent = t(key);
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.dataset.i18nPlaceholder;
    if (key && el instanceof HTMLInputElement) el.placeholder = t(key);
  });
  document.title = t("meta.loginTitle");

  const brandPanel = document.querySelector(".brand-panel");
  if (brandPanel) brandPanel.setAttribute("aria-label", t("login.brandAria"));

  togglePasswordButton.setAttribute(
    "aria-label",
    passwordInput.type === "password" ? t("login.showPassword") : t("login.hidePassword")
  );
  togglePasswordButton.textContent = passwordInput.type === "password" ? t("login.show") : t("login.hide");
  submitButton.textContent = t("login.submit");

  if (loginLangMount) loginLangMount.innerHTML = renderLangSwitch("lang-switch lang-switch--login");
}

document.addEventListener("click", (event) => {
  const btn = event.target.closest('[data-action="set-locale"]');
  if (!btn) return;
  event.preventDefault();
  const lang = btn.dataset.lang;
  if (lang === "en" || lang === "ar") {
    setLocale(lang);
    applyLoginTranslations();
  }
});

togglePasswordButton.addEventListener("click", () => {
  const hidden = passwordInput.type === "password";
  passwordInput.type = hidden ? "text" : "password";
  togglePasswordButton.textContent = hidden ? t("login.hide") : t("login.show");
  togglePasswordButton.setAttribute("aria-label", hidden ? t("login.hidePassword") : t("login.showPassword"));
});

function clearErrors() {
  emailError.textContent = "";
  passwordError.textContent = "";
  formStatus.textContent = "";
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearErrors();

  let hasError = false;
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email) {
    emailError.textContent = t("login.errEmail");
    hasError = true;
  }

  if (!password) {
    passwordError.textContent = t("login.errPassword");
    hasError = true;
  }

  if (hasError) {
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = t("login.signingIn");

  try {
    const data = await login(email, password);
    const roleKey = roleKeyFromBackend(data?.user?.role);
    if (!roleKey) {
      formStatus.textContent = t("login.errUnsupportedRole");
      return;
    }

    localStorage.setItem(USER_ROLE_STORAGE_KEY, roleKey);
    window.location.href = "./dashboard.html";
  } catch (err) {
    formStatus.textContent = err?.message || t("login.errGeneric");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = t("login.submit");
  }
});

applyLoginTranslations();
