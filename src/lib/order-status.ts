import {
  FULFILLMENT_STATUS_STYLES,
  type FulfillmentStatus,
  isFulfillmentStatus,
} from "@/lib/seller-orders";

export const BUYER_FULFILLMENT_STATUS_LABELS: Record<FulfillmentStatus, string> = {
  pending: "Working on it",
  shipped: "On delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const BUYER_FULFILLMENT_STATUS_HINTS: Record<FulfillmentStatus, string> = {
  pending: "The seller is preparing your items.",
  shipped: "Your order is on the way.",
  delivered: "This order has been delivered.",
  cancelled: "This item was cancelled.",
};

export function normalizeFulfillmentStatus(value: string): FulfillmentStatus {
  return isFulfillmentStatus(value) ? value : "pending";
}

export function getBuyerFulfillmentLabel(status: string): string {
  return BUYER_FULFILLMENT_STATUS_LABELS[normalizeFulfillmentStatus(status)];
}

export function getBuyerFulfillmentHint(status: string): string {
  return BUYER_FULFILLMENT_STATUS_HINTS[normalizeFulfillmentStatus(status)];
}

export function getFulfillmentStatusStyle(status: string): string {
  return FULFILLMENT_STATUS_STYLES[normalizeFulfillmentStatus(status)];
}

/** Roll up line-item statuses into one order status for the buyer. */
export function deriveOrderFulfillmentStatus(
  items: { fulfillmentStatus: string }[],
): FulfillmentStatus {
  if (items.length === 0) return "pending";

  const statuses = items.map((item) => normalizeFulfillmentStatus(item.fulfillmentStatus));

  if (statuses.every((s) => s === "cancelled")) return "cancelled";
  if (statuses.every((s) => s === "delivered")) return "delivered";
  if (statuses.some((s) => s === "shipped")) return "shipped";
  return "pending";
}
