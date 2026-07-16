/** Strip to digits for storage and lookup. */
export function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, "");
}

export function isValidPhone(raw: string): boolean {
  const digits = normalizePhone(raw);
  return digits.length >= 9 && digits.length <= 15;
}

/**
 * Convert stored/local phone numbers to E.164 for SMS gateways.
 * Ethiopian mobiles like 0911234567 / 911234567 become +251911234567.
 */
export function toE164(raw: string, defaultCountry = "ET"): string | null {
  const digits = normalizePhone(raw);
  if (!digits) return null;

  if (digits.startsWith("251") && digits.length === 12) {
    return `+${digits}`;
  }

  if (defaultCountry === "ET") {
    if (digits.length === 10 && digits.startsWith("0")) {
      return `+251${digits.slice(1)}`;
    }
    if (digits.length === 9 && digits.startsWith("9")) {
      return `+251${digits}`;
    }
  }

  if (digits.length >= 10 && digits.length <= 15) {
    return `+${digits}`;
  }

  return null;
}
