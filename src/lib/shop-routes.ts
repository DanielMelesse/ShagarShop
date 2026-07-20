export const TODAYS_DEALS_HREF = "/";
export const ALL_PRODUCTS_HREF = "/shop?all=1";

export function isTodaysDealsPath(pathname: string, featured: boolean): boolean {
  return pathname === "/" || (pathname === "/shop" && featured);
}
