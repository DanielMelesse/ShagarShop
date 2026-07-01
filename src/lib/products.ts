import type { Category, Product } from "./types";
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
export function getCustomerSizeOptions(product: Product): readonly string[] {
  const category = resolveSizeCategory(product.category);
  if (!category || !categoryNeedsSize(category)) return [];

  const options = getSizeOptions(category).filter((s) => s !== SIZE_ALL);
  if (product.size && product.size !== SIZE_ALL) {
    return [product.size];
  }
  return options;
}

export function productNeedsSizeSelection(product: Product): boolean {
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
/** Flat shipping included in every seller-listed product price (Birr). */
export const LISTING_SHIPPING_BIRR = 200;

/** Buyer-facing price from the amount the seller enters (before fees). */
export function calculateListedProductPrice(sellerPrice: number): number {
  const withShipping = sellerPrice + LISTING_SHIPPING_BIRR;
  return Math.round(withShipping * (1 + TAX_RATE) * 100) / 100;
}

/** Seller-entered price from a stored listed price (for edit forms). */
export function sellerPriceFromListed(listedPrice: number): number {
  const withShipping = listedPrice / (1 + TAX_RATE);
  return Math.max(0, Math.round((withShipping - LISTING_SHIPPING_BIRR) * 100) / 100);
}

export function getShippingCost(subtotal: number): number {
  if (subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD) return 0;
  return SHIPPING_COST;
}

export function getTaxAmount(subtotal: number): number {
  if (subtotal <= 0) return 0;
  return Math.round(subtotal * TAX_RATE * 100) / 100;
}

/** Cart/checkout total — product prices already include shipping and VAT. */
export function calculateOrderTotals(subtotal: number) {
  const total = Math.round(subtotal * 100) / 100;
  return { subtotal, shipping: 0, tax: 0, total };
}
