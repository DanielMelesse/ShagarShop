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
