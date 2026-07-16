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

export interface DeliveryJob {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  quantity: number;
  lineTotal: number;
  fulfillmentStatus: "shipped" | "delivered";
  orderId: string;
  orderDate: string;
  shippingName: string;
  address: string;
  city: string;
  zip: string;
  deliveryId: string | null;
  deliveryAssignedAt: string | null;
}

export interface DeliveryStats {
  available: number;
  active: number;
  deliveredToday: number;
}
