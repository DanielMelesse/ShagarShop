export const SELL_LANDING = "/sell";
export const SELLER_REGISTER = "/sell/register";
export const SELLER_HOME = "/seller";
export const SELLER_LISTINGS = "/seller/listings";
export const SELLER_ORDERS = "/seller/orders";
export const SELLER_EARNINGS = "/seller/earnings";
export const SELLER_ADD = "/seller/add";
export const SELLER_EDIT = "/seller/edit";
export const SELLER_VIEW = "/seller/view";

export function sellerEditPath(productId: string): string {
  return `${SELLER_EDIT}/${productId}`;
}

export function sellerViewPath(productId: string): string {
  return `${SELLER_VIEW}/${productId}`;
}

export function isSellerAppPath(pathname: string): boolean {
  return pathname === SELLER_HOME || pathname.startsWith(`${SELLER_HOME}/`);
}

export function isSellLandingPath(pathname: string): boolean {
  return pathname === SELL_LANDING || pathname.startsWith(`${SELL_LANDING}/`);
}

/** Seller landing (/sell) or seller app (/seller/*). */
export function isSellSurfacePath(pathname: string): boolean {
  return isSellLandingPath(pathname) || isSellerAppPath(pathname);
}
