export const PAYMENT_METHODS = ["telebirr", "chapa", "cod"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const ONLINE_PAYMENT_METHODS = ["telebirr", "chapa"] as const;
export type OnlinePaymentMethod = (typeof ONLINE_PAYMENT_METHODS)[number];

export const PAYMENT_STATUSES = [
  "pending",
  "paid",
  "cod",
  "failed",
  "cancelled",
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const ORDER_STATUSES = [
  "awaiting_payment",
  "placed",
  "cancelled",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export function isPaymentMethod(value: unknown): value is PaymentMethod {
  return (
    typeof value === "string" &&
    (PAYMENT_METHODS as readonly string[]).includes(value)
  );
}

export function isOnlinePaymentMethod(
  value: unknown,
): value is OnlinePaymentMethod {
  return (
    typeof value === "string" &&
    (ONLINE_PAYMENT_METHODS as readonly string[]).includes(value)
  );
}

export function paymentMethodLabel(method: string): string {
  switch (method) {
    case "telebirr":
      return "Telebirr (Ethio Telecom merchant)";
    case "chapa":
      return "Chapa (merchant checkout)";
    case "cod":
      return "Cash on delivery";
    case "demo":
      return "Demo card (legacy)";
    default:
      return method || "Unknown";
  }
}

export function paymentStatusLabel(status: string): string {
  switch (status) {
    case "pending":
      return "Awaiting payment";
    case "paid":
      return "Paid";
    case "cod":
      return "Cash on delivery";
    case "failed":
      return "Payment failed";
    case "cancelled":
      return "Cancelled";
    default:
      return status || "Unknown";
  }
}

/** Orders sellers/couriers/admin revenue should treat as real sales. */
export function isPayableOrderFilter() {
  return {
    OR: [
      { paymentStatus: "paid" },
      { paymentStatus: "cod" },
      // Legacy demo orders before payment fields existed
      { paymentMethod: "demo", status: "placed" },
    ],
  };
}
