/** Package barcode helpers (seller assigns when marking ready for pickup). */

const PACKAGE_BARCODE_RE = /^[A-Z0-9][A-Z0-9\-_]{3,47}$/;

/** Normalize a scanned or typed package barcode. */
export function normalizePackageBarcode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}

/** Validate seller-assigned package barcode. */
export function isValidPackageBarcode(raw: string): boolean {
  return PACKAGE_BARCODE_RE.test(normalizePackageBarcode(raw));
}
