export const PRODUCT_CONDITIONS = [
  "new",
  "used",
  "refurbished",
  "bonda",
  "rent",
] as const;

export type ProductCondition = (typeof PRODUCT_CONDITIONS)[number];

export const PRODUCT_CONDITION_LABELS: Record<ProductCondition, string> = {
  new: "New",
  used: "Used",
  refurbished: "Refabrish",
  bonda: "Bonda",
  rent: "Rent",
};

export const PRODUCT_CONDITION_OPTIONS = PRODUCT_CONDITIONS.map((value) => ({
  value,
  label: PRODUCT_CONDITION_LABELS[value],
}));

export function isProductCondition(value: string): value is ProductCondition {
  return (PRODUCT_CONDITIONS as readonly string[]).includes(value);
}

export function normalizeProductCondition(value?: string): ProductCondition {
  const normalized = value ?? "";
  return isProductCondition(normalized) ? normalized : "new";
}

export function getProductConditionLabel(value?: string): string {
  return PRODUCT_CONDITION_LABELS[normalizeProductCondition(value)];
}
