import type { ShippingLineInput } from "@/lib/shipping";
import { calculateCartShipping, ORDER_BASE_SHIPPING_BIRR } from "@/lib/shipping";
import type { Category, Product, ProductListItem } from "./types";
import {
  departments,
  getDepartmentBySlug,
  getDepartmentProductCategory,
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

export const CLOTHING_SIZES = ["XS", "S", "M", "L", "XL", "XXL"] as const;
export const SHOE_SIZES = [
  "36",
  "37",
  "38",
  "39",
  "40",
  "41",
  "42",
  "43",
  "44",
  "45",
  "46",
] as const;
export const SPORTS_SIZES = [...SHOE_SIZES, "One Size"] as const;
export const SIZE_ALL = "All";

export function categoryNeedsSize(category: Category): boolean {
  return category === "fashion" || category === "sports";
}

export function getSizeOptions(category: Category): readonly string[] {
  if (category === "sports") return [SIZE_ALL, ...SPORTS_SIZES];
  if (category === "fashion") return [SIZE_ALL, ...CLOTHING_SIZES];
  return [];
}

function resolveSizeCategory(categoryValue: string): Category | null {
  const legacy = categories.find((c) => c.id === categoryValue);
  if (legacy) return legacy.id;
  return getDepartmentProductCategory(categoryValue) ?? null;
}

/** Sizes a shopper can pick on the product page. */
export function getCustomerSizeOptions(
  product: Pick<Product, "category" | "size"> | Pick<ProductListItem, "category" | "size">,
): readonly string[] {
  const category = resolveSizeCategory(product.category);
  if (!category || !categoryNeedsSize(category)) return [];

  const options = getSizeOptions(category).filter((s) => s !== SIZE_ALL);
  if (product.size && product.size !== SIZE_ALL) {
    return [product.size];
  }
  return options;
}

export function productNeedsSizeSelection(
  product: Pick<Product, "category" | "size"> | Pick<ProductListItem, "category" | "size">,
): boolean {
  return getCustomerSizeOptions(product).length > 0;
}

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
export const TAX_RATE = 0.15;
/** Flat shipping base added once per order at checkout (Birr). */
export { ORDER_BASE_SHIPPING_BIRR as LISTING_SHIPPING_BIRR };

/** Listed price with 15% VAT from the seller's entered amount. */
export function calculateListedProductPrice(sellerPrice: number): number {
  return Math.round(sellerPrice * (1 + TAX_RATE) * 100) / 100;
}

/** Seller-entered price from a VAT-inclusive listed price (for edit forms). */
export function sellerPriceFromListed(listedPrice: number): number {
  return Math.max(0, Math.round((listedPrice / (1 + TAX_RATE)) * 100) / 100);
}

export function getShippingCost(subtotal: number): number {
  if (subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD) return 0;
  return SHIPPING_COST;
}

export function getTaxAmount(subtotal: number): number {
  if (subtotal <= 0) return 0;
  return Math.round(subtotal * TAX_RATE * 100) / 100;
}

/** VAT is in product prices; shipping uses cart line tiers and bulk rules. */
export function calculateOrderTotals(
  subtotal: number,
  shippingLines: ShippingLineInput[] = [],
) {
  if (subtotal <= 0) {
    return { subtotal: 0, shipping: 0, tax: 0, total: 0 };
  }
  const shipping = calculateCartShipping(shippingLines);
  const tax = Math.round((subtotal - subtotal / (1 + TAX_RATE)) * 100) / 100;
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
