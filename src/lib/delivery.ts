import type { CourierPayoutBreakdown } from "@/lib/shipping";

export const DELIVERY_VEHICLE_TYPES = [
  "motorcycle",
  "bicycle",
  "car",
  "on_foot",
] as const;

export type DeliveryVehicleType = (typeof DELIVERY_VEHICLE_TYPES)[number];

export const DELIVERY_VEHICLE_LABELS: Record<DeliveryVehicleType, string> = {
  motorcycle: "Motorcycle",
  bicycle: "Bicycle",
  car: "Car / van",
  on_foot: "On foot",
};

export function isDeliveryVehicleType(
  value: string,
): value is DeliveryVehicleType {
  return (DELIVERY_VEHICLE_TYPES as readonly string[]).includes(value);
}

/** One product line inside a delivery stop. */
export interface DeliveryJobItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  quantity: number;
  lineTotal: number;
  shippingTier: string;
}

/**
 * One courier stop = all claimable items for the same order/address.
 * Multi-item same-address orders are one stop.
 */
export interface DeliveryJob {
  /** Primary item id (used for claim/deliver API). */
  id: string;
  orderId: string;
  itemIds: string[];
  items: DeliveryJobItem[];
  itemCount: number;
  /** Summary label for the stop. */
  productName: string;
  productImage: string;
  quantity: number;
  lineTotal: number;
  /** Buyer delivery fee allocated to this stop's items. */
  deliveryFee: number;
  /** Courier payout for the whole stop. */
  courierEarning: number;
  /** Breakdown shown to couriers (bulk first + extras). */
  courierPayout: CourierPayoutBreakdown;
  /** ShegerShop margin: deliveryFee − courierEarning. */
  platformFee: number;
  fulfillmentStatus: "shipped" | "delivered";
  orderDate: string;
  shippingName: string;
  address: string;
  city: string;
  zip: string;
  deliveryId: string | null;
  deliveryAssignedAt: string | null;
}

export interface DeliveryStats {
  /** Distinct stops waiting to be claimed. */
  available: number;
  /** Distinct stops currently assigned to this courier. */
  active: number;
  /** Distinct stops completed today. */
  deliveredToday: number;
  /** Sum of per-stop courier payouts completed today. */
  earningsToday: number;
}

/** Courier-facing job payload — no product/order item prices. */
export type CourierDeliveryJobItem = Omit<DeliveryJobItem, "lineTotal">;
export type CourierDeliveryJob = Omit<DeliveryJob, "lineTotal" | "items"> & {
  items: CourierDeliveryJobItem[];
};

export function toCourierDeliveryJob(job: DeliveryJob): CourierDeliveryJob {
  const { lineTotal: _jobTotal, items, ...rest } = job;
  return {
    ...rest,
    items: items.map(({ lineTotal: _lineTotal, ...item }) => item),
  };
}
