"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { parseMobilePaymentDeepLink } from "@/lib/payment-return";
import { closePaymentBrowser } from "@/lib/mobile-payment";
import { hydrateMobileTokens, isNativeApp } from "@/lib/mobile-auth-client";

/** Listen for Capacitor deep links (payment return, tracking). */
export function MobileShell() {
  const router = useRouter();

  useEffect(() => {
    if (!isNativeApp()) return;
    void hydrateMobileTokens();

    let removeListener: (() => void) | undefined;

    void (async () => {
      try {
        const { App } = await import("@capacitor/app");
        const handle = await App.addListener("appUrlOpen", (event) => {
          const parsed = parseMobilePaymentDeepLink(event.url);
          if (parsed) {
            void closePaymentBrowser();
            const params = new URLSearchParams({ via: parsed.via });
            if (parsed.txRef) params.set("tx_ref", parsed.txRef);
            router.push(`/checkout/result?${params.toString()}`);
            return;
          }

          if (event.url.includes("/track/")) {
            const code = event.url.split("/track/")[1]?.split("?")[0];
            if (code) router.push(`/seller/scan?code=${encodeURIComponent(code)}`);
          }
        });
        removeListener = () => {
          void handle.remove();
        };
      } catch {
        /* Capacitor not available in web build */
      }
    })();

    return () => {
      removeListener?.();
    };
  }, [router]);

  useEffect(() => {
    document.documentElement.dataset.nativeApp = isNativeApp() ? "true" : "false";
  }, []);

  return null;
}
