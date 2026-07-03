export const ORDER_BASE_SHIPPING_BIRR = 200;

export const SHIPPING_TIERS = ["standard", "large", "oversized"] as const;
export type ShippingTier = (typeof SHIPPING_TIERS)[number];

export const SHIPPING_TIER_FEES: Record<ShippingTier, number> = {
  standard: 0,
  large: 100,
  oversized: 300,
};

export const SHIPPING_TIER_LABELS: Record<ShippingTier, string> = {
  standard: "Standard",
  large: "Large item",
  oversized: "Oversized / heavy",
};

export interface ShippingLineInput {
  quantity: number;
  shippingTier?: string;
  extraShippingBirr?: number;
}

export function isShippingTier(value: string): value is ShippingTier {
  return (SHIPPING_TIERS as readonly string[]).includes(value);
}

export function normalizeShippingTier(value?: string): ShippingTier {
  return isShippingTier(value ?? "") ? value : "standard";
}

function bulkShippingFee(totalQuantity: number): number {
  if (totalQuantity >= 5) return 150;
  if (totalQuantity >= 3) return 75;
  return 0;
}

/** Base order shipping + per-item tier/extras + bulk quantity surcharge. */
export function calculateCartShipping(lines: ShippingLineInput[]): number {
  if (lines.length === 0) return 0;

  const itemExtras = lines.reduce((sum, line) => {
    const tierFee = SHIPPING_TIER_FEES[normalizeShippingTier(line.shippingTier)];
    const perUnit = tierFee + Math.max(0, line.extraShippingBirr ?? 0);
    return sum + perUnit * line.quantity;
  }, 0);

  const totalQty = lines.reduce((sum, line) => sum + line.quantity, 0);
  const bulkFee = bulkShippingFee(totalQty);

  return Math.round((ORDER_BASE_SHIPPING_BIRR + itemExtras + bulkFee) * 100) / 100;
}
