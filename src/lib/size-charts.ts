import type { Category, Product, ProductListItem } from "./types";
import { getDepartmentProductCategory } from "./departments";

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
export const ONE_SIZE = "One Size";
export const SPORTS_SIZES = [...SHOE_SIZES, ONE_SIZE] as const;
export const SIZE_ALL = "All";

export const SIZE_CHARTS = ["clothing", "shoes", "onesize"] as const;
export type SizeChart = (typeof SIZE_CHARTS)[number];

export const SIZE_CHART_LABELS: Record<SizeChart, string> = {
  clothing: "Clothing (S–XXL)",
  shoes: "Shoes (EU 36–46)",
  onesize: "One size",
};

export function isSizeChart(value: string | null | undefined): value is SizeChart {
  return SIZE_CHARTS.includes(value as SizeChart);
}

export function getSizesForChart(chart: SizeChart): readonly string[] {
  if (chart === "clothing") return CLOTHING_SIZES;
  if (chart === "shoes") return SHOE_SIZES;
  return [ONE_SIZE];
}

export function inferSizeChartFromSize(
  size: string | null | undefined,
): SizeChart | null {
  if (!size || size === SIZE_ALL) return null;
  if ((SHOE_SIZES as readonly string[]).includes(size)) return "shoes";
  if ((CLOTHING_SIZES as readonly string[]).includes(size)) return "clothing";
  if (size === ONE_SIZE) return "onesize";
  return null;
}

export function categoryNeedsSize(category: Category): boolean {
  return category === "fashion" || category === "sports";
}

/** @deprecated Prefer getSizesForChart — kept for legacy fashion/sports filters. */
export function getSizeOptions(category: Category): readonly string[] {
  if (category === "sports") return [SIZE_ALL, ...SPORTS_SIZES];
  if (category === "fashion") return [SIZE_ALL, ...CLOTHING_SIZES];
  return [];
}

const LEGACY_CATEGORIES: Category[] = [
  "home",
  "electronics",
  "fashion",
  "sports",
  "books",
];

function resolveSizeCategory(categoryValue: string): Category | null {
  if (LEGACY_CATEGORIES.includes(categoryValue as Category)) {
    return categoryValue as Category;
  }
  return getDepartmentProductCategory(categoryValue) ?? null;
}

type SizeAwareProduct = Pick<Product, "category" | "size"> &
  Partial<Pick<Product, "sizeChart" | "availableSizes">>;

/** Sizes a shopper can pick on the product page. */
export function getCustomerSizeOptions(
  product:
    | SizeAwareProduct
    | Pick<
        ProductListItem,
        "category" | "size" | "sizeChart" | "availableSizes"
      >,
): readonly string[] {
  const available = (product.availableSizes ?? []).filter(Boolean);
  if (available.length > 0) return available;

  if (product.size && product.size !== SIZE_ALL) {
    return [product.size];
  }

  if (isSizeChart(product.sizeChart)) {
    return getSizesForChart(product.sizeChart);
  }

  const category = resolveSizeCategory(product.category);
  if (!category || !categoryNeedsSize(category)) return [];
  return getSizeOptions(category).filter((s) => s !== SIZE_ALL);
}

export function productNeedsSizeSelection(
  product:
    | SizeAwareProduct
    | Pick<
        ProductListItem,
        "category" | "size" | "sizeChart" | "availableSizes"
      >,
): boolean {
  return getCustomerSizeOptions(product).length > 0;
}

export function sizeChartLabelForBuyer(
  chart: string | null | undefined,
): string {
  if (chart === "shoes") return "Shoe size (EU)";
  if (chart === "clothing") return "Clothing size";
  if (chart === "onesize") return "Size";
  return "Size";
}
