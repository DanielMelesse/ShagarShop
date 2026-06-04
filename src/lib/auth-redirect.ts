const DEFAULT_AFTER_AUTH = "/shop?featured=1";

/** Only allow same-origin relative paths after login/signup. */
export function safeCallbackUrl(raw: string | null | undefined): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) {
    return DEFAULT_AFTER_AUTH;
  }
  return raw;
}

export { DEFAULT_AFTER_AUTH };
