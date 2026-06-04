import type { Category } from "./types";

export const categories: { id: Category; label: string }[] = [
  { id: "home", label: "Home" },
  { id: "electronics", label: "Electronics" },
  { id: "fashion", label: "Fashion" },
  { id: "sports", label: "Sports" },
  { id: "books", label: "Books" },
];

export type SearchDepartment = "all" | Category;

export const searchDepartments: { value: SearchDepartment; label: string }[] = [
  { value: "all", label: "All" },
  { value: "home", label: "Home" },
  { value: "electronics", label: "Electronics" },
  { value: "fashion", label: "Fashion" },
  { value: "sports", label: "Sports" },
  { value: "books", label: "Books" },
];

export function buildShopSearchUrl(options: {
  q?: string;
  department?: SearchDepartment;
}) {
  const params = new URLSearchParams();
  const term = options.q?.trim();
  if (term) params.set("q", term);
  if (options.department && options.department !== "all") {
    params.set("category", options.department);
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
  let list = categories;
  if (department !== "all") {
    list = list.filter((c) => c.id === department);
  }
  return list.filter((c) => c.label.toLowerCase().includes(q));
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
