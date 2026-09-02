export const FULFILLMENT_STATUSES = [
  "pending",
  "shipped",
  "delivered",
  "cancelled",
] as const;

export type FulfillmentStatus = (typeof FULFILLMENT_STATUSES)[number];

export function isFulfillmentStatus(value: string): value is FulfillmentStatus {
  return (FULFILLMENT_STATUSES as readonly string[]).includes(value);
}

export const FULFILLMENT_STATUS_LABELS: Record<FulfillmentStatus, string> = {
  pending: "Preparing",
  shipped: "Ready for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const FULFILLMENT_STATUS_STYLES: Record<FulfillmentStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  shipped: "bg-blue-100 text-blue-800",
  delivered: "bg-brand-100 text-brand-800",
  cancelled: "bg-zinc-100 text-zinc-600",
};

const ALLOWED_TRANSITIONS: Record<FulfillmentStatus, FulfillmentStatus[]> = {
  pending: ["shipped", "cancelled"],
  shipped: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
};

export function canTransitionFulfillment(
  from: FulfillmentStatus,
  to: FulfillmentStatus,
): boolean {
  if (from === to) return true;
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export interface SellerOrderLine {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  quantity: number;
  lineTotal: number;
  commissionRate: number;
  commissionAmount: number;
  sellerEarnings: number;
  fulfillmentStatus: FulfillmentStatus;
  /** System tracking code (assigned when ready for delivery). */
  trackingCode: string | null;
  /** Seller shop name (for printable labels). */
  shopName: string | null;
  orderId: string;
  orderDate: string;
  shippingName: string;
  address: string;
  city: string;
  zip: string;
}

export interface SellerDashboardStats {
  listings: number;
  unitsInStock: number;
  featured: number;
  pendingOrders: number;
  /** Gross product sales (before commission). */
  totalRevenue: number;
  /** Net after ShegerShop commission. */
  netEarnings: number;
  /** Platform commission taken. */
  commissionPaid: number;
  /** Days left in 0% promo; 0 if promo ended. */
  promoDaysLeft: number;
  /** True while seller pays 0% commission. */
  inCommissionPromo: boolean;
  commissionRate: number;
}
