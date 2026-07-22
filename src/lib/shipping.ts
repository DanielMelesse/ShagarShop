export const ORDER_BASE_SHIPPING_BIRR = 200;

/** Single-shop orders with more than this many units pay base shipping only 3×. */
export const SINGLE_SHOP_BASE_CHARGE_CAP = 3;

/** Single-shop orders above this unit count add a per-item surcharge. */
export const SINGLE_SHOP_LARGE_ORDER_MIN_UNITS = 5;

/** Extra Birr per unit when one shop sells more than 5 items in one order. */
export const SINGLE_SHOP_LARGE_ORDER_SURCHARGE_PER_UNIT = 100;

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
  sellerId?: string | null;
}

export function isShippingTier(value: string): value is ShippingTier {
  return (SHIPPING_TIERS as readonly string[]).includes(value);
}

export function normalizeShippingTier(value?: string): ShippingTier {
  const normalized = value ?? "";
  return isShippingTier(normalized) ? normalized : "standard";
}

export function countTotalUnits(lines: ShippingLineInput[]): number {
  return lines.reduce((sum, line) => sum + line.quantity, 0);
}

/** All lines from one seller (and seller is known). */
export function isSingleShopOrder(lines: ShippingLineInput[]): boolean {
  if (lines.length === 0) return false;
  const sellerIds = new Set(
    lines.map((line) => line.sellerId).filter((id): id is string => Boolean(id)),
  );
  if (sellerIds.size !== 1) return false;
  return lines.every((line) => line.sellerId === lines[0].sellerId);
}

export function perUnitExtras(line: ShippingLineInput): number {
  const tierFee = SHIPPING_TIER_FEES[normalizeShippingTier(line.shippingTier)];
  return tierFee + Math.max(0, line.extraShippingBirr ?? 0);
}

/**
 * Per cart/order line shipping (base + tier extras × quantity).
 * Default: each unit pays full base (200) + extras.
 * Single shop, >3 units: only 3× base (200) for the whole order, split by quantity;
 * tier/extras still apply per unit.
 * Single shop, >5 units: +100 Birr per unit.
 */
export function calculateLineShippingFees(lines: ShippingLineInput[]): number[] {
  if (lines.length === 0) return [];

  const totalUnits = countTotalUnits(lines);
  const singleShop = isSingleShopOrder(lines);
  const singleShopBulk =
    singleShop && totalUnits > SINGLE_SHOP_BASE_CHARGE_CAP;
  const cappedBaseTotal = singleShopBulk
    ? SINGLE_SHOP_BASE_CHARGE_CAP * ORDER_BASE_SHIPPING_BIRR
    : totalUnits * ORDER_BASE_SHIPPING_BIRR;
  const largeOrderSurchargeTotal =
    singleShop && totalUnits > SINGLE_SHOP_LARGE_ORDER_MIN_UNITS
      ? totalUnits * SINGLE_SHOP_LARGE_ORDER_SURCHARGE_PER_UNIT
      : 0;

  return lines.map((line) => {
    const baseShare = singleShopBulk
      ? (line.quantity / totalUnits) * cappedBaseTotal
      : line.quantity * ORDER_BASE_SHIPPING_BIRR;
    const extras = line.quantity * perUnitExtras(line);
    const largeShare =
      largeOrderSurchargeTotal > 0
        ? (line.quantity / totalUnits) * largeOrderSurchargeTotal
        : 0;
    return Math.round((baseShare + extras + largeShare) * 100) / 100;
  });
}

/** Sum of per-line shipping fees. */
export function calculateCartShipping(lines: ShippingLineInput[]): number {
  const lineFees = calculateLineShippingFees(lines);
  return Math.round(lineFees.reduce((sum, fee) => sum + fee, 0) * 100) / 100;
}

/** Kept for admin display of legacy large/oversized reference rates. */
export const COURIER_PAYOUT_BIRR: Record<ShippingTier, number> = {
  standard: 140,
  large: 180,
  oversized: 250,
};

/** Single-item trip: courier share of buyer delivery fee. */
export const COURIER_SHARE_SINGLE = 0.7;

/** Bulk trip: courier share per extra item (50% of base 200). */
export const COURIER_SHARE_EXTRA = 0.5;

/** Bulk trip — first item shown to courier (70% of base 200). */
export const COURIER_BULK_FIRST_BIRR =
  Math.round(ORDER_BASE_SHIPPING_BIRR * COURIER_SHARE_SINGLE * 100) / 100;

/** Bulk trip — each extra item shown to courier (50% of base 200). */
export const COURIER_BULK_EXTRA_BIRR =
  Math.round(ORDER_BASE_SHIPPING_BIRR * COURIER_SHARE_EXTRA * 100) / 100;

/** Courier share of the single-shop large-order surcharge (50/50). */
export const COURIER_SHARE_LARGE_ORDER_SURCHARGE = 0.5;

export interface CourierPayoutBreakdown {
  total: number;
  /** Courier share of the base / first portion. */
  bulkFirst: number;
  /** Courier share per extra unit (or mixed-shop bulk extra). */
  extraPerItem: number;
  extraCount: number;
  isBulk: boolean;
}

/** @deprecated Use calculateLineShippingFees and sum by line id instead. */
export function allocateLineShippingFee(
  orderShipping: number,
  lineQuantity: number,
  orderQuantity: number,
): number {
  if (orderShipping <= 0 || orderQuantity <= 0 || lineQuantity <= 0) return 0;
  return Math.round((orderShipping * (lineQuantity / orderQuantity)) * 100) / 100;
}

export function courierPayoutForTier(shippingTier?: string): number {
  return COURIER_PAYOUT_BIRR[normalizeShippingTier(shippingTier)];
}

export function singleShopLargeOrderSurcharge(totalUnits: number): number {
  if (totalUnits > SINGLE_SHOP_LARGE_ORDER_MIN_UNITS) {
    return totalUnits * SINGLE_SHOP_LARGE_ORDER_SURCHARGE_PER_UNIT;
  }
  return 0;
}

/**
 * Courier pay for one delivery stop.
 * Same shop → 70% of base stop fee + 50% of the 6+ item surcharge.
 * Mixed shops → bulk: 140 + 100 per extra line.
 */
export function courierPayoutForDeliveryStop(
  itemCount: number,
  buyerDeliveryFee: number,
  singleShop: boolean,
  totalUnits = itemCount,
): CourierPayoutBreakdown {
  const fee = Math.max(0, buyerDeliveryFee);

  if (singleShop) {
    const surcharge = Math.min(fee, singleShopLargeOrderSurcharge(totalUnits));
    const baseFee = Math.max(0, fee - surcharge);
    const baseCourier = baseFee * COURIER_SHARE_SINGLE;
    const surchargeCourier = surcharge * COURIER_SHARE_LARGE_ORDER_SURCHARGE;
    const total = Math.round((baseCourier + surchargeCourier) * 100) / 100;
    const extraCount =
      surcharge > 0 ? Math.max(0, totalUnits) : 0;

    return {
      total,
      bulkFirst: Math.round(baseCourier * 100) / 100,
      extraPerItem:
        Math.round(
          SINGLE_SHOP_LARGE_ORDER_SURCHARGE_PER_UNIT *
            COURIER_SHARE_LARGE_ORDER_SURCHARGE *
            100,
        ) / 100,
      extraCount,
      isBulk: surcharge > 0,
    };
  }

  return courierPayoutBreakdown(Math.max(1, itemCount), fee);
}

/**
 * Courier pay by line count (admin / legacy).
 * Prefer courierPayoutForDeliveryStop when shop grouping is known.
 */
export function courierPayoutBreakdown(
  itemCount: number,
  buyerDeliveryFee: number,
): CourierPayoutBreakdown {
  const n = Math.max(1, itemCount);
  if (n === 1) {
    const total =
      Math.round(Math.max(0, buyerDeliveryFee) * COURIER_SHARE_SINGLE * 100) /
      100;
    return {
      total,
      bulkFirst: total,
      extraPerItem: 0,
      extraCount: 0,
      isBulk: false,
    };
  }

  const extraCount = n - 1;
  const total =
    Math.round(
      (COURIER_BULK_FIRST_BIRR + extraCount * COURIER_BULK_EXTRA_BIRR) * 100,
    ) / 100;

  return {
    total,
    bulkFirst: COURIER_BULK_FIRST_BIRR,
    extraPerItem: COURIER_BULK_EXTRA_BIRR,
    extraCount,
    isBulk: true,
  };
}

export function courierPayoutForStop(
  itemCount: number,
  buyerDeliveryFee: number,
  singleShop = false,
  totalUnits = itemCount,
): number {
  return courierPayoutForDeliveryStop(
    itemCount,
    buyerDeliveryFee,
    singleShop,
    totalUnits,
  ).total;
}

/** Buyer delivery fee vs courier payout → ShegerShop margin. */
export function settleDeliveryFee(
  buyerDeliveryFee: number,
  courierPayout: number,
): { courier: number; platform: number } {
  const courier = Math.max(0, Math.round(courierPayout * 100) / 100);
  const fee = Math.max(0, buyerDeliveryFee);
  const platform = Math.round((fee - courier) * 100) / 100;
  return { courier, platform };
}
