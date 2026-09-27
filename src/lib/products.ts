import type { ShippingLineInput } from "@/lib/shipping";
import { calculateCartShipping, ORDER_BASE_SHIPPING_BIRR } from "@/lib/shipping";
import type { Category } from "./types";
import {
  departments,
  getDepartmentBySlug,
  getDepartmentSearchOptions,
  type DepartmentSlug,
} from "./departments";
import { TODAYS_DEALS_HREF } from "./shop-routes";

export const categories: { id: Category; label: string }[] = [
  { id: "home", label: "Home" },
  { id: "electronics", label: "Electronics" },
  { id: "fashion", label: "Fashion" },
  { id: "sports", label: "Sports" },
  { id: "books", label: "Books" },
];

export type SearchDepartment = "all" | DepartmentSlug;

export const searchDepartments = getDepartmentSearchOptions();

export {
  CLOTHING_SIZES,
  SHOE_SIZES,
  ONE_SIZE,
  SPORTS_SIZES,
  SIZE_ALL,
  SIZE_CHARTS,
  SIZE_CHART_LABELS,
  isSizeChart,
  getSizesForChart,
  inferSizeChartFromSize,
  categoryNeedsSize,
  getSizeOptions,
  getCustomerSizeOptions,
  productNeedsSizeSelection,
  sizeChartLabelForBuyer,
  type SizeChart,
} from "./size-charts";

export function buildShopSearchUrl(options: {
  q?: string;
  department?: SearchDepartment;
}) {
  const params = new URLSearchParams();
  const term = options.q?.trim();
  if (term) params.set("q", term);
  if (options.department && options.department !== "all") {
    params.set("department", options.department);
  }
  const query = params.toString();
  return query ? `/shop?${query}` : TODAYS_DEALS_HREF;
}

export function searchCategories(
  query: string,
  department: SearchDepartment = "all",
) {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  let list = departments;
  if (department !== "all") {
    const match = getDepartmentBySlug(department);
    list = match ? [match] : [];
  }
  return list
    .filter((d) => d.label.toLowerCase().includes(q))
    .map((d) => ({ id: d.slug, label: d.label }));
}

export function formatPrice(amount: number): string {
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return `${formatted} Birr`;
}

export const FREE_SHIPPING_THRESHOLD = 5000;
export const SHIPPING_COST = 5.99;
/** Flip to `true` to bake 15% VAT into listing prices and order tax again. */
export const TAX_ENABLED = false;
export const TAX_RATE = 0.15;
/** Flat shipping base added once per order at checkout (Birr). */
export { ORDER_BASE_SHIPPING_BIRR as LISTING_SHIPPING_BIRR };

/** Listed price (optionally with VAT from the seller's entered amount). */
export function calculateListedProductPrice(sellerPrice: number): number {
  const rounded = Math.round(sellerPrice * 100) / 100;
  if (!TAX_ENABLED) return rounded;
  return Math.round(sellerPrice * (1 + TAX_RATE) * 100) / 100;
}

/** Seller-entered price from a listed price (for edit forms). */
export function sellerPriceFromListed(listedPrice: number): number {
  const rounded = Math.max(0, Math.round(listedPrice * 100) / 100);
  if (!TAX_ENABLED) return rounded;
  return Math.max(0, Math.round((listedPrice / (1 + TAX_RATE)) * 100) / 100);
}

export function getShippingCost(subtotal: number): number {
  if (subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD) return 0;
  return SHIPPING_COST;
}

export function getTaxAmount(subtotal: number): number {
  if (!TAX_ENABLED || subtotal <= 0) return 0;
  return Math.round(subtotal * TAX_RATE * 100) / 100;
}

/** Shipping uses cart line tiers and bulk rules. Tax is off while TAX_ENABLED is false. */
export function calculateOrderTotals(
  subtotal: number,
  shippingLines: ShippingLineInput[] = [],
) {
  if (subtotal <= 0) {
    return { subtotal: 0, shipping: 0, tax: 0, total: 0 };
  }
  const shipping = calculateCartShipping(shippingLines);
  const tax = TAX_ENABLED
    ? Math.round((subtotal - subtotal / (1 + TAX_RATE)) * 100) / 100
    : 0;
  const total = Math.round((subtotal + shipping) * 100) / 100;
  return { subtotal, shipping, tax, total };
}

export function shippingLinesFromCart(
  items: {
    quantity: number;
    product: {
      shippingTier?: string;
      extraShippingBirr?: number;
      sellerId?: string | null;
    };
  }[],
): ShippingLineInput[] {
  return items.map((item) => ({
    quantity: item.quantity,
    shippingTier: item.product.shippingTier,
    extraShippingBirr: item.product.extraShippingBirr,
    sellerId: item.product.sellerId,
  }));
}
