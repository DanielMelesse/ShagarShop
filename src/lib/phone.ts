/** Strip non-digits, then canonicalize Ethiopian mobiles to `09…` / `07…`. */
export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");

  // +2519XXXXXXXX / 2519XXXXXXXX → 09XXXXXXXX
  if (digits.startsWith("251") && digits.length === 12) {
    return `0${digits.slice(3)}`;
  }

  // 9XXXXXXXX / 7XXXXXXXX → 09XXXXXXXX / 07XXXXXXXX
  if (digits.length === 9 && /^[79]/.test(digits)) {
    return `0${digits}`;
  }

  return digits;
}

/**
 * Ethiopian mobile numbers only:
 * - 09XXXXXXXX (Ethio telecom)
 * - 07XXXXXXXX (Safaricom Ethiopia)
 * Also accepts +251… / 251… / without leading 0.
 */
export function isValidPhone(raw: string): boolean {
  return /^0[79]\d{8}$/.test(normalizePhone(raw));
}

/**
 * Convert stored/local phone numbers to E.164 for SMS gateways.
 * Ethiopian mobiles like 0911234567 / 911234567 become +251911234567.
 */
export function toE164(raw: string, defaultCountry = "ET"): string | null {
  if (defaultCountry === "ET") {
    if (!isValidPhone(raw)) return null;
    return `+251${normalizePhone(raw).slice(1)}`;
  }

  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;

  if (digits.length >= 10 && digits.length <= 15) {
    return `+${digits}`;
  }

  return null;
}
