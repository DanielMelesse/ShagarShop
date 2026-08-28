/** Package barcode helpers — unique per shop + order item. */

const PACKAGE_BARCODE_RE = /^[A-Z0-9][A-Z0-9\-_]{3,47}$/;

/** Normalize a scanned or typed package barcode. */
export function normalizePackageBarcode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}

/** Validate package barcode format. */
export function isValidPackageBarcode(raw: string): boolean {
  return PACKAGE_BARCODE_RE.test(normalizePackageBarcode(raw));
}

function alnumTail(id: string, len: number): string {
  const cleaned = id.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  if (cleaned.length <= len) return cleaned.padStart(len, "0");
  return cleaned.slice(-len);
}

/** Short shop prefix from shop name + seller id (unique per seller). */
export function shopBarcodePrefix(
  shopName: string | null | undefined,
  sellerId: string,
): string {
  const fromName = (shopName ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 4);
  const seller = alnumTail(sellerId, 4);
  return `${fromName || "SHOP"}${seller}`;
}

/**
 * Build a package barcode unique to the shop and this order line.
 * Format: SHG-{SHOP}{SELLER}-{PRODUCT}-{ITEM}
 * Example: SHG-BIGB5MUQ-OXR8-QDOXR83A
 */
export function createShopPackageBarcode(input: {
  sellerId: string;
  productId: string;
  orderItemId: string;
  shopName?: string | null;
}): string {
  const shop = shopBarcodePrefix(input.shopName, input.sellerId);
  const product = alnumTail(input.productId, 4);
  const item = alnumTail(input.orderItemId, 8);
  return normalizePackageBarcode(`SHG-${shop}-${product}-${item}`);
}
