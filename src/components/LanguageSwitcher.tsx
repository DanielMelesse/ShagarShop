"use client";

import { LOCALE_LABELS, LOCALES, type Locale } from "@/i18n";
import { useLocale } from "@/context/LocaleContext";

export function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();

  return (
    <div
      className="flex items-center rounded-lg border border-zinc-200 bg-white p-0.5 text-xs font-medium"
      role="group"
      aria-label="Language"
    >
      {LOCALES.map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setLocale(code as Locale)}
          className={`rounded-md px-2 py-1 transition ${
            locale === code
              ? "bg-brand-600 text-white"
              : "text-zinc-600 hover:bg-zinc-100"
          }`}
          aria-pressed={locale === code}
        >
          {LOCALE_LABELS[code]}
        </button>
      ))}
    </div>
  );
}
