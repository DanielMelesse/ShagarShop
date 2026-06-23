export const TODAYS_DEALS_HREF = "/shop?featured=1";
export const ALL_PRODUCTS_HREF = "/shop?all=1";

export function isTodaysDealsPath(pathname: string, featured: boolean): boolean {
  return pathname === "/shop" && featured;
}
