import {
  defaultHomeForRole,
  isAdminRole,
  isDeliveryRole,
  isSellerRole,
  type UserRole,
} from "@/lib/user-role";
import { isDeliveryAppPath } from "@/lib/delivery-routes";
import {
  isSellerAppPath,
  isSellerRegisterPath,
} from "@/lib/seller-routes";
import { TODAYS_DEALS_HREF } from "@/lib/shop-routes";

const DEFAULT_AFTER_AUTH = TODAYS_DEALS_HREF;

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
  // Role dashboards win over generic shop callbacks.
  if (isAdminRole(role)) {
    return defaultHomeForRole(role);
  }
  if (isDeliveryRole(role)) {
    return defaultHomeForRole(role);
  }
  if (isSellerRole(role)) {
    const callbackUrl = safeCallbackUrl(raw);
    // Keep deep links (e.g. /myshop/orders) or continue registration.
    if (isSellerAppPath(callbackUrl) || isSellerRegisterPath(callbackUrl)) {
      return callbackUrl;
    }
    return defaultHomeForRole(role);
  }

  const callbackUrl = safeCallbackUrl(raw);

  // Gated courier app — never send buyers there.
  if (isDeliveryAppPath(callbackUrl)) {
    return DEFAULT_AFTER_AUTH;
  }

  // Gated seller tools — buyers should not land on /myshop/listings etc.
  // Marketing `/myshop` and `/myshop/register` are allowed.
  if (isSellerAppPath(callbackUrl)) {
    return DEFAULT_AFTER_AUTH;
  }

  return callbackUrl;
}

export { DEFAULT_AFTER_AUTH };
