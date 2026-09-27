import {
  defaultHomeForRole,
  isAdminRole,
  isBuyerMarketplacePath,
  isDeliveryRole,
  isSellerRole,
  type UserRole,
} from "@/lib/user-role";
import { DELIVERY_HOME, isDeliveryAppPath } from "@/lib/delivery-routes";
import { isAccountPath } from "@/lib/account-routes";
import {
  isSellerAppPath,
  isSellerRegisterPath,
  SELLER_HOME,
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

/**
 * Where to send the user after login/signup.
 * Sellers → /myshop (dashboard), couriers → /delivery, admins → /admin.
 * Seller/courier accounts never land on the buyer marketplace.
 */
export function resolveAfterAuth(
  raw: string | null | undefined,
  role: UserRole | string | null | undefined,
): string {
  if (isAdminRole(role)) {
    return defaultHomeForRole(role);
  }

  if (isDeliveryRole(role)) {
    const callbackUrl = safeCallbackUrl(raw);
    // Keep courier deep links; never buyer shop (/, /shop, /cart, …).
    if (isDeliveryAppPath(callbackUrl) && !isBuyerMarketplacePath(callbackUrl)) {
      return callbackUrl;
    }
    return DELIVERY_HOME;
  }

  if (isSellerRole(role)) {
    const callbackUrl = safeCallbackUrl(raw);
    // Keep seller tools, registration, or account details — not the shop.
    if (
      (isSellerAppPath(callbackUrl) ||
        isSellerRegisterPath(callbackUrl) ||
        isAccountPath(callbackUrl)) &&
      !isBuyerMarketplacePath(callbackUrl)
    ) {
      return callbackUrl;
    }
    // Marketing /myshop and any shop callback → seller dashboard home.
    return SELLER_HOME;
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
