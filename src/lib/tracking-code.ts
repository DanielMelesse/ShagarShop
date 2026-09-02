/** System-generated package tracking codes (unique per order item; QR-ready later). */

const TRACKING_CODE_RE = /^SHG-[A-Z0-9]{4}-[A-Z0-9]{6,12}$/;

/** Normalize a scanned or typed tracking code. */
export function normalizeTrackingCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}

/** Validate a ShegerShop tracking code. */
export function isValidTrackingCode(raw: string): boolean {
  return TRACKING_CODE_RE.test(normalizeTrackingCode(raw));
}

function shopSlug(shopName: string | null | undefined): string {
  const alnum = (shopName ?? "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase();
  const slug = alnum.slice(0, 4);
  return slug.length >= 2 ? slug.padEnd(4, "X") : "SHOP";
}

function itemSuffix(orderItemId: string): string {
  const alnum = orderItemId.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  return alnum.slice(-8).padStart(8, "0");
}

/** Create a deterministic tracking code for an order item. */
export function createOrderItemTrackingCode(params: {
  orderItemId: string;
  shopName?: string | null;
  /** Bump on collision retry (appended to suffix). */
  retry?: number;
}): string {
  const shop = shopSlug(params.shopName);
  let suffix = itemSuffix(params.orderItemId);
  if (params.retry && params.retry > 0) {
    suffix = `${suffix.slice(0, 6)}${String(params.retry).padStart(2, "0")}`;
  }
  return `SHG-${shop}-${suffix}`;
}

/**
 * Payload for future QR codes (not rendered until QR upgrade).
 * Swap to `trackingTrackUrl(code)` when a public /track route ships.
 */
export function trackingQrPayload(code: string): string {
  return normalizeTrackingCode(code);
}

/** Public tracking URL for QR deep links (future /track page). */
export function trackingTrackUrl(
  code: string,
  baseUrl = typeof window !== "undefined" ? window.location.origin : "",
): string {
  const base = baseUrl.replace(/\/$/, "");
  const normalized = normalizeTrackingCode(code);
  return base ? `${base}/track/${encodeURIComponent(normalized)}` : normalized;
}
