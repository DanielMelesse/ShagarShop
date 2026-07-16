export const ADMIN_HOME = "/admin";
export const ADMIN_ORDERS = "/admin/orders";
export const ADMIN_PRODUCTS = "/admin/products";
export const ADMIN_CUSTOMERS = "/admin/customers";
export const ADMIN_SELLERS = "/admin/sellers";
export const ADMIN_DELIVERY = "/admin/delivery";

export function isAdminAppPath(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}
