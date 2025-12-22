import i18next, { type TFunction, type i18n } from "i18next";
import zh from "./locales/zh.json";
import en from "./locales/en.json";
import ja from "./locales/ja.json";
import ko from "./locales/ko.json";

export type Locale = "zh" | "en" | "ja" | "ko";

export const SUPPORTED_LOCALES: Locale[] = ["zh", "en", "ja", "ko"];

export const DEFAULT_LOCALE: Locale = "en";

export function isValidLocale(locale: string): locale is Locale {
  return SUPPORTED_LOCALES.includes(locale as Locale);
}

// Initialize i18next
const i18nInstance: i18n = i18next.createInstance();

i18nInstance.init({
  lng: DEFAULT_LOCALE,
  fallbackLng: DEFAULT_LOCALE,
  supportedLngs: SUPPORTED_LOCALES,
  resources: {
    zh: { translation: zh },
    en: { translation: en },
    ja: { translation: ja },
    ko: { translation: ko },
  },
  interpolation: {
    escapeValue: false,
  },
});

/**
 * Get a translation function for the specified locale.
 * This creates a fixed-language translator that doesn't change global state.
 */
export function getTranslator(locale: Locale = DEFAULT_LOCALE): TFunction {
  return i18nInstance.getFixedT(locale);
}

/**
 * Change the current global locale
 */
export function setLocale(locale: Locale): void {
  i18nInstance.changeLanguage(locale);
}

/**
 * Get the current global locale
 */
export function getLocale(): Locale {
  return (i18nInstance.language as Locale) || DEFAULT_LOCALE;
}

/**
 * Translate a key using the current global locale
 */
export function t(key: string, options?: Record<string, unknown>): string {
  return i18nInstance.t(key, options);
}

export { i18nInstance as i18n };
