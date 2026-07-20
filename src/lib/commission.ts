/** ShegerShop seller commission after free promo period. */
export const SELLER_COMMISSION_RATE = 0.1;
export const SELLER_COMMISSION_PROMO_DAYS = 30;

export function sellerPromoEndsAt(completedAt: Date): Date {
  const end = new Date(completedAt);
  end.setDate(end.getDate() + SELLER_COMMISSION_PROMO_DAYS);
  return end;
}

export function isSellerInCommissionPromo(
  completedAt: Date,
  at: Date = new Date(),
): boolean {
  return at < sellerPromoEndsAt(completedAt);
}

export function daysLeftInCommissionPromo(
  completedAt: Date,
  at: Date = new Date(),
): number {
  if (!isSellerInCommissionPromo(completedAt, at)) return 0;
  const ms = sellerPromoEndsAt(completedAt).getTime() - at.getTime();
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}

/** 0% during first 30 days after seller onboarding; then 10%. */
export function commissionRateForSeller(
  completedAt: Date | null | undefined,
  at: Date = new Date(),
): number {
  if (completedAt && isSellerInCommissionPromo(completedAt, at)) return 0;
  return SELLER_COMMISSION_RATE;
}

export function settleLineCommission(
  lineTotal: number,
  rate: number,
): {
  commissionRate: number;
  commissionAmount: number;
  sellerEarnings: number;
} {
  const safeTotal = Math.max(0, lineTotal);
  const commissionAmount = Math.round(safeTotal * rate * 100) / 100;
  const sellerEarnings = Math.round((safeTotal - commissionAmount) * 100) / 100;
  return {
    commissionRate: rate,
    commissionAmount,
    sellerEarnings,
  };
}
