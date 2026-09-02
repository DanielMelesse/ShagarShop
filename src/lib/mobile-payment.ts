"use client";

import { isNativeApp } from "@/lib/mobile-auth-client";

/** Open Telebirr/Chapa checkout — in-app browser on native, full redirect on web. */
export async function openPaymentCheckout(checkoutUrl: string): Promise<void> {
  if (!isNativeApp()) {
    window.location.href = checkoutUrl;
    return;
  }

  try {
    const { Browser } = await import("@capacitor/browser");
    await Browser.open({ url: checkoutUrl, presentationStyle: "popover" });
  } catch {
    window.location.href = checkoutUrl;
  }
}

export async function closePaymentBrowser() {
  if (!isNativeApp()) return;
  try {
    const { Browser } = await import("@capacitor/browser");
    await Browser.close();
  } catch {
    /* ignore */
  }
}
