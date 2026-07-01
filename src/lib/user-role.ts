import { TODAYS_DEALS_HREF } from "@/lib/shop-routes";

export const USER_ROLES = ["BUYER", "SELLER"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export function isSellerRole(role: string | null | undefined): role is "SELLER" {
  return role === "SELLER";
}

export function isBuyerRole(role: string | null | undefined): role is "BUYER" {
  return role === "BUYER" || !role;
}

export function parseSignupRole(raw: string | null | undefined): UserRole {
  return raw === "seller" ? "SELLER" : "BUYER";
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
  return isSellerRole(role) ? "/seller" : TODAYS_DEALS_HREF;
}
