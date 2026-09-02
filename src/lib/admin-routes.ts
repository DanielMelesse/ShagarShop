export const ADMIN_SCAN = "/admin/scan";
export const ADMIN_HOME = "/admin";
export const ADMIN_ORDERS = "/admin/orders";
export const ADMIN_PRODUCTS = "/admin/products";
export const ADMIN_CUSTOMERS = "/admin/customers";
export const ADMIN_SELLERS = "/admin/sellers";
export const ADMIN_DELIVERY = "/admin/delivery";

export function adminOrderHref(orderId: string): string {
  return `${ADMIN_ORDERS}/${orderId}`;
}

export function adminProductHref(productId: string): string {
  return `${ADMIN_PRODUCTS}/${productId}`;
}

export function adminCustomerHref(customerId: string): string {
  return `${ADMIN_CUSTOMERS}/${customerId}`;
}

export function adminSellerHref(sellerId: string): string {
  return `${ADMIN_SELLERS}/${sellerId}`;
}

export function adminCourierHref(courierId: string): string {
  return `${ADMIN_DELIVERY}/${courierId}`;
}

export function isAdminAppPath(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}
