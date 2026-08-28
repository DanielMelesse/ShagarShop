import { TODAYS_DEALS_HREF } from "@/lib/shop-routes";

export const USER_ROLES = ["BUYER", "SELLER", "DELIVERY", "ADMIN"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export function isSellerRole(role: string | null | undefined): role is "SELLER" {
  return role === "SELLER";
}

export function isDeliveryRole(
  role: string | null | undefined,
): role is "DELIVERY" {
  return role === "DELIVERY";
}

export function isAdminRole(role: string | null | undefined): role is "ADMIN" {
  return role === "ADMIN";
}

export function isBuyerRole(role: string | null | undefined): role is "BUYER" {
  return role === "BUYER" || !role;
}

export function parseSignupRole(raw: string | null | undefined): UserRole {
  if (raw === "seller") return "SELLER";
  if (raw === "delivery") return "DELIVERY";
  return "BUYER";
}

const SHOP_ONLY_PREFIXES = [
  "/shop",
  "/cart",
  "/checkout",
  "/product",
  "/account",
] as const;

export function isShopOnlyPath(pathname: string): boolean {
  if (pathname === "/") return true;
  return SHOP_ONLY_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function defaultHomeForRole(role: string | null | undefined): string {
  if (isAdminRole(role)) return "/admin";
  if (isSellerRole(role)) return "/seller";
  /** Courier dashboard (gated), not the public /deliver marketing page. */
  if (isDeliveryRole(role)) return "/delivery";
  return TODAYS_DEALS_HREF;
}
