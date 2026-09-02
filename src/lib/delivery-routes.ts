export const DELIVERY_SCAN = "/delivery/scan";
export const DELIVERY_HOME = "/delivery";
export const DELIVERY_AVAILABLE = "/delivery/available";
export const DELIVERY_MINE = "/delivery/mine";
export const DELIVERY_REGISTER = "/deliver/register";
export const DELIVER_LANDING = "/deliver";

export function isDeliveryAppPath(pathname: string): boolean {
  return pathname === "/delivery" || pathname.startsWith("/delivery/");
}
