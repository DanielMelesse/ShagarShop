import type { Category, Product } from "./types";
import {
  departments,
  getDepartmentBySlug,
  getDepartmentProductCategory,
  getDepartmentSearchOptions,
  type DepartmentSlug,
} from "./departments";

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
  return query ? `/shop?${query}` : "/shop";
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

export function getShippingCost(subtotal: number): number {
  if (subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD) return 0;
  return SHIPPING_COST;
}
