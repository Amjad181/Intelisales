import { MESSAGES } from "./translations.js";

const STORAGE_KEY = "intellisales_locale";

function readStored() {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "ar" || v === "en") return v;
  } catch {
    /* ignore */
  }
  return null;
}

let locale = readStored() || "en";

function getNested(obj, path) {
  return path.split(".").reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined), obj);
}

export function getLocale() {
  return locale;
}

export function setLocale(next) {
  if (next !== "en" && next !== "ar") return;
  locale = next;
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    /* ignore */
  }
  applyDocumentLang();
  window.dispatchEvent(new CustomEvent("app:localechange", { detail: { locale: next } }));
}

export function applyDocumentLang() {
  const root = document.documentElement;
  root.lang = locale === "ar" ? "ar" : "en";
  root.dir = locale === "ar" ? "rtl" : "ltr";
}

export function t(key, params = {}) {
  const fromLocale = getNested(MESSAGES[locale], key);
  const fromEn = getNested(MESSAGES.en, key);
  let str = typeof fromLocale === "string" ? fromLocale : typeof fromEn === "string" ? fromEn : key;
  if (typeof str !== "string") return key;
  Object.entries(params).forEach(([k, v]) => {
    str = str.split(`{${k}}`).join(String(v));
  });
  return str;
}

export function initI18n() {
  applyDocumentLang();
}
