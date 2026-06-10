import {
  defaultHomeForRole,
  isSellerRole,
  isShopOnlyPath,
  type UserRole,
} from "@/lib/user-role";

const DEFAULT_AFTER_AUTH = "/shop?featured=1";

/** Only allow same-origin relative paths after login/signup. */
export function safeCallbackUrl(raw: string | null | undefined): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) {
    return DEFAULT_AFTER_AUTH;
  }
  return raw;
}

export function resolveAfterAuth(
  raw: string | null | undefined,
  role: UserRole | string | null | undefined,
): string {
  const callbackUrl = safeCallbackUrl(raw);
  if (isSellerRole(role) && isShopOnlyPath(callbackUrl)) {
    return defaultHomeForRole(role);
  }
  return callbackUrl;
}

export { DEFAULT_AFTER_AUTH };
