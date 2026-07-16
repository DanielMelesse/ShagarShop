import { formatPrice } from "@/lib/products";
import type { FulfillmentStatus } from "@/lib/seller-orders";

const BRAND = "ShegerShop";

function shortOrderId(orderId: string): string {
  return orderId.slice(-8).toUpperCase();
}

export function orderPlacedSms(input: {
  orderId: string;
  total: number;
  itemCount: number;
}): string {
  const items =
    input.itemCount === 1 ? "1 item" : `${input.itemCount} items`;
  return `${BRAND}: Order #${shortOrderId(input.orderId)} placed (${items}, ${formatPrice(input.total)}). We'll text you when it's on the way.`;
}

export function orderItemStatusSms(input: {
  orderId: string;
  productName: string;
  status: Exclude<FulfillmentStatus, "pending">;
}): string {
  const orderRef = shortOrderId(input.orderId);
  const name =
    input.productName.length > 40
      ? `${input.productName.slice(0, 37)}...`
      : input.productName;

  switch (input.status) {
    case "shipped":
      return `${BRAND}: "${name}" from order #${orderRef} is ready for delivery.`;
    case "delivered":
      return `${BRAND}: "${name}" from order #${orderRef} has been delivered. Thank you!`;
    case "cancelled":
      return `${BRAND}: "${name}" from order #${orderRef} was cancelled. Contact support if you have questions.`;
  }
}
