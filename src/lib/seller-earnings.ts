import type { FulfillmentStatus } from "@/lib/seller-orders";

export interface SellerEarningLine {
  id: string;
  orderId: string;
  orderDate: string;
  productName: string;
  quantity: number;
  lineTotal: number;
  commissionRate: number;
  commissionAmount: number;
  sellerEarnings: number;
  fulfillmentStatus: FulfillmentStatus;
  deliveredAt: string | null;
  /** Held until the item is marked delivered. */
  payoutStatus: "held" | "available" | "cancelled";
}

export interface SellerEarningsSummary {
  grossSales: number;
  commissionPaid: number;
  netEarnings: number;
  /** Delivered lines — ready for weekly payout. */
  availableForPayout: number;
  /** Preparing / on delivery — released when delivered. */
  heldUntilDelivered: number;
  deliveredCount: number;
  heldCount: number;
  inCommissionPromo: boolean;
  promoDaysLeft: number;
  commissionRate: number;
  promoEndsAt: string | null;
  recentLines: SellerEarningLine[];
}
