export const LOCALES = ["en", "am"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_STORAGE_KEY = "sheger-locale";

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  am: "አማርኛ",
};

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}
