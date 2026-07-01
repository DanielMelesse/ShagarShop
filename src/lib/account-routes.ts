export const ACCOUNT_HOME = "/account";
export const ACCOUNT_PROFILE = "/account/profile";
export const ACCOUNT_ORDERS = "/account/orders";
export const ACCOUNT_SHOP = "/account/shop";

export function isAccountPath(pathname: string): boolean {
  return pathname === ACCOUNT_HOME || pathname.startsWith(`${ACCOUNT_HOME}/`);
}
