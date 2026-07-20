"use client";

import { useEffect } from "react";
import { useLocale } from "@/context/LocaleContext";

const FONT_LINK_ID = "sheger-noto-ethiopic";

/** Loads Noto Sans Ethiopic only when locale is Amharic (saves bytes on English). */
export function AmharicFontLoader() {
  const { locale } = useLocale();

  useEffect(() => {
    if (locale !== "am") {
      document.documentElement.classList.remove("locale-am");
      document.getElementById(FONT_LINK_ID)?.remove();
      return;
    }

    document.documentElement.classList.add("locale-am");
    if (document.getElementById(FONT_LINK_ID)) return;

    const link = document.createElement("link");
    link.id = FONT_LINK_ID;
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Noto+Sans+Ethiopic:wght@400;700&display=swap";
    document.head.appendChild(link);
  }, [locale]);

  return null;
}
