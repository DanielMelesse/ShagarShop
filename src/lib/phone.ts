/** Strip to digits for storage and lookup. */
export function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, "");
}

export function isValidPhone(raw: string): boolean {
  const digits = normalizePhone(raw);
  return digits.length >= 9 && digits.length <= 15;
}
