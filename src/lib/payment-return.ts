import { appBaseUrl } from "@/lib/chapa";

export const MOBILE_APP_SCHEME = "shegershop";

export type PaymentReturnVia = "telebirr" | "chapa";

/** Web return URL for payment providers. */
export function webPaymentReturnUrl(via: PaymentReturnVia, txRef?: string): string {
  const base = appBaseUrl();
  const params = new URLSearchParams({ via });
  if (txRef) params.set("tx_ref", txRef);
  return `${base}/checkout/result?${params.toString()}`;
}

/** Deep link for Capacitor native app after Telebirr/Chapa checkout. */
export function mobilePaymentReturnUrl(via: PaymentReturnVia, txRef?: string): string {
  const params = new URLSearchParams({ via });
  if (txRef) params.set("tx_ref", txRef);
  return `${MOBILE_APP_SCHEME}://payment/result?${params.toString()}`;
}

/** Prefer mobile deep link when request indicates native app. */
export function resolvePaymentReturnUrl(
  via: PaymentReturnVia,
  options?: { mobile?: boolean; txRef?: string },
): string {
  if (options?.mobile) {
    return mobilePaymentReturnUrl(via, options.txRef);
  }
  return webPaymentReturnUrl(via, options?.txRef);
}

export function isMobileAppRequest(request: Request): boolean {
  const client = request.headers.get("x-sheger-client")?.toLowerCase();
  return client === "capacitor" || client === "mobile";
}

export function parseMobilePaymentDeepLink(url: string): {
  via: PaymentReturnVia;
  txRef: string | null;
} | null {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== `${MOBILE_APP_SCHEME}:`) return null;
    if (parsed.hostname !== "payment" || !parsed.pathname.startsWith("/result")) {
      return null;
    }
    const via = parsed.searchParams.get("via");
    if (via !== "telebirr" && via !== "chapa") return null;
    return {
      via,
      txRef: parsed.searchParams.get("tx_ref"),
    };
  } catch {
    return null;
  }
}
