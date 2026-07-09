import type { Locale } from "./config";
import { am } from "./messages/am";
import { en, type Messages } from "./messages/en";

const catalogs: Record<Locale, Messages> = {
  en,
  am,
};

export function getMessages(locale: Locale): Messages {
  return catalogs[locale] ?? en;
}

export function createTranslator(messages: Messages) {
  return function t(
    key: string,
    params?: Record<string, string | number>,
  ): string {
    const parts = key.split(".");
    let current: unknown = messages;

    for (const part of parts) {
      if (current && typeof current === "object" && part in current) {
        current = (current as Record<string, unknown>)[part];
      } else {
        return key;
      }
    }

    if (typeof current !== "string") {
      return key;
    }

    if (!params) {
      return current;
    }

    return Object.entries(params).reduce(
      (text, [paramKey, value]) =>
        text.replaceAll(`{${paramKey}}`, String(value)),
      current,
    );
  };
}

export type { Locale, Messages };
export {
  LOCALES,
  DEFAULT_LOCALE,
  LOCALE_LABELS,
  LOCALE_STORAGE_KEY,
  isLocale,
} from "./config";
