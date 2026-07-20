import type { Locale } from "./config";
import { en, type Messages } from "./messages/en";

/** Sync fallback (English). Amharic is loaded via `loadMessages` on the client. */
export function getMessages(locale: Locale): Messages {
  if (locale === "en") return en;
  return en;
}

export async function loadMessages(locale: Locale): Promise<Messages> {
  if (locale === "am") {
    const mod = await import("./messages/am");
    return mod.am;
  }
  return en;
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
