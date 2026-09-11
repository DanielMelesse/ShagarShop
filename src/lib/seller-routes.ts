export const SELL_LANDING = "/myshop";
export const SELLER_REGISTER = "/myshop/register";
export const SELLER_SCAN = "/myshop/scan";
export const SELLER_HOME = "/myshop";
export const SELLER_LISTINGS = "/myshop/listings";
export const SELLER_ORDERS = "/myshop/orders";
export const SELLER_EARNINGS = "/myshop/earnings";
export const SELLER_ADD = "/myshop/add";
export const SELLER_EDIT = "/myshop/edit";
export const SELLER_VIEW = "/myshop/view";

export function sellerEditPath(productId: string): string {
  return `${SELLER_EDIT}/${productId}`;
}

export function sellerViewPath(productId: string): string {
  return `${SELLER_VIEW}/${productId}`;
}

/** Public marketing home (exact `/myshop`). */
export function isSellLandingPath(pathname: string): boolean {
  return pathname === SELL_LANDING;
}

export function isSellerRegisterPath(pathname: string): boolean {
  return (
    pathname === SELLER_REGISTER || pathname.startsWith(`${SELLER_REGISTER}/`)
  );
}

/** Gated seller app under `/myshop/*` (not marketing home or register). */
export function isSellerAppPath(pathname: string): boolean {
  if (isSellerRegisterPath(pathname)) return false;
  if (pathname === SELLER_HOME) return false;
  return pathname.startsWith(`${SELLER_HOME}/`);
}

/** Marketing, register, or seller app under `/myshop`. */
export function isSellSurfacePath(pathname: string): boolean {
  return pathname === "/myshop" || pathname.startsWith("/myshop/");
}
