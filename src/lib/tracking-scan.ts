import type { UserRole } from "@/lib/user-role";
import {
  FULFILLMENT_STATUS_LABELS,
  type FulfillmentStatus,
  isFulfillmentStatus,
} from "@/lib/seller-orders";

export type TrackingScanAction = "mark_ready" | "claim" | "deliver" | "cancel";

export interface TrackingScanActionOption {
  action: TrackingScanAction;
  label: string;
  description?: string;
}

export interface TrackingScanPackage {
  orderItemId: string;
  trackingCode: string;
  fulfillmentStatus: FulfillmentStatus;
  fulfillmentLabel: string;
  productName: string;
  productImage: string;
  quantity: number;
  orderId: string;
  orderRef: string;
  shippingName: string;
  address: string;
  city: string;
  zip: string;
  shopName: string | null;
  deliveryAssigned: boolean;
  deliveryAssignedToSelf: boolean;
  courierName: string | null;
  sellerOwned: boolean;
  actions: TrackingScanActionOption[];
}

export const TRACKING_SCAN_ACTION_LABELS: Record<TrackingScanAction, string> = {
  mark_ready: "Mark ready for delivery",
  claim: "Claim for delivery",
  deliver: "Mark delivered",
  cancel: "Cancel order",
};

export function isTrackingScanAction(value: string): value is TrackingScanAction {
  return (
    value === "mark_ready" ||
    value === "claim" ||
    value === "deliver" ||
    value === "cancel"
  );
}

export function fulfillmentLabel(status: string): string {
  return isFulfillmentStatus(status)
    ? FULFILLMENT_STATUS_LABELS[status]
    : status;
}

export type TrackingScanRole = Extract<UserRole, "SELLER" | "DELIVERY" | "ADMIN">;

export function isTrackingScanRole(role: string): role is TrackingScanRole {
  return role === "SELLER" || role === "DELIVERY" || role === "ADMIN";
}
