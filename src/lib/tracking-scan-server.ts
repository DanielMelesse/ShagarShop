import { prisma } from "@/lib/db";
import {
  claimDeliveryJob,
  completeDeliveryJob,
} from "@/lib/delivery-server";
import {
  canTransitionFulfillment,
  isFulfillmentStatus,
} from "@/lib/seller-orders";
import { setSellerOrderItemStatus } from "@/lib/seller-orders-server";
import { notifyOrderItemStatus } from "@/lib/sms/order-notify";
import {
  createOrderItemTrackingCode,
  isValidTrackingCode,
  normalizeTrackingCode,
} from "@/lib/tracking-code";
import {
  fulfillmentLabel,
  type TrackingScanAction,
  type TrackingScanActionOption,
  type TrackingScanPackage,
  type TrackingScanRole,
} from "@/lib/tracking-scan";

const packageInclude = {
  product: {
    select: {
      sellerId: true,
      image: true,
    },
  },
  order: {
    select: {
      id: true,
      shippingName: true,
      address: true,
      city: true,
      zip: true,
    },
  },
  delivery: {
    select: {
      id: true,
      name: true,
    },
  },
} as const;

type PackageRow = {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  fulfillmentStatus: string;
  trackingCode: string | null;
  deliveryId: string | null;
  product: { sellerId: string | null; image: string };
  order: {
    id: string;
    shippingName: string;
    address: string;
    city: string;
    zip: string;
  };
  delivery: { id: string; name: string | null } | null;
};

/** Assign a unique tracking code if the line does not have one yet. */
export async function assignTrackingCodeIfMissing(
  orderItemId: string,
  shopName: string | null,
): Promise<string | null> {
  const item = await prisma.orderItem.findUnique({
    where: { id: orderItemId },
    select: { trackingCode: true, fulfillmentStatus: true },
  });
  if (!item || item.fulfillmentStatus === "cancelled") return null;

  const existing = item.trackingCode?.trim()
    ? normalizeTrackingCode(item.trackingCode)
    : "";
  if (existing && isValidTrackingCode(existing)) return existing;

  let retry = 0;
  while (retry < 6) {
    const candidate = createOrderItemTrackingCode({
      orderItemId,
      shopName,
      retry: retry > 0 ? retry : undefined,
    });
    const taken = await prisma.orderItem.findFirst({
      where: {
        trackingCode: candidate,
        NOT: { id: orderItemId },
      },
      select: { id: true },
    });
    if (!taken) {
      await prisma.orderItem.update({
        where: { id: orderItemId },
        data: { trackingCode: candidate },
      });
      return candidate;
    }
    retry += 1;
  }
  return null;
}

function resolveScanActions(
  item: PackageRow,
  userId: string,
  role: TrackingScanRole,
): TrackingScanActionOption[] {
  const status = isFulfillmentStatus(item.fulfillmentStatus)
    ? item.fulfillmentStatus
    : "pending";
  const sellerOwned = item.product.sellerId === userId;
  const deliveryAssigned = Boolean(item.deliveryId);
  const deliveryAssignedToSelf = item.deliveryId === userId;
  const actions: TrackingScanActionOption[] = [];

  if (role === "SELLER" && sellerOwned) {
    if (status === "pending") {
      actions.push({
        action: "mark_ready",
        label: "Mark ready for delivery",
        description: "Package is labeled and ready for courier pickup.",
      });
    }
    if (status === "shipped" && !deliveryAssigned) {
      actions.push({
        action: "cancel",
        label: "Cancel order",
        description: "Cancel before a courier claims this package.",
      });
    }
  }

  if (role === "DELIVERY") {
    if (status === "shipped" && !deliveryAssigned) {
      actions.push({
        action: "claim",
        label: "Claim for delivery",
        description: "Assign this stop to you.",
      });
    }
    if (status === "shipped" && deliveryAssignedToSelf) {
      actions.push({
        action: "deliver",
        label: "Mark delivered",
        description: "Confirm delivery to the buyer.",
      });
    }
  }

  if (role === "ADMIN") {
    if (status === "pending") {
      actions.push({
        action: "mark_ready",
        label: "Mark ready for delivery",
        description: "Employee override — mark package ready.",
      });
    }
    if (status === "shipped") {
      actions.push({
        action: "deliver",
        label: "Mark delivered",
        description: "Employee override — complete delivery.",
      });
      actions.push({
        action: "cancel",
        label: "Cancel order",
        description: "Employee override — cancel this line.",
      });
    }
  }

  return actions;
}

function toScanPackage(
  item: PackageRow,
  userId: string,
  role: TrackingScanRole,
  shopName: string | null,
): TrackingScanPackage {
  const status = isFulfillmentStatus(item.fulfillmentStatus)
    ? item.fulfillmentStatus
    : "pending";

  return {
    orderItemId: item.id,
    trackingCode: item.trackingCode ?? "",
    fulfillmentStatus: status,
    fulfillmentLabel: fulfillmentLabel(status),
    productName: item.productName,
    productImage: item.product.image,
    quantity: item.quantity,
    orderId: item.order.id,
    orderRef: item.order.id.slice(-8).toUpperCase(),
    shippingName: item.order.shippingName,
    address: item.order.address,
    city: item.order.city,
    zip: item.order.zip,
    shopName,
    deliveryAssigned: Boolean(item.deliveryId),
    deliveryAssignedToSelf: item.deliveryId === userId,
    courierName: item.delivery?.name ?? null,
    sellerOwned: item.product.sellerId === userId,
    actions: resolveScanActions(item, userId, role),
  };
}

async function findPackageByCode(code: string): Promise<PackageRow | null> {
  const normalized = normalizeTrackingCode(code);
  if (!isValidTrackingCode(normalized)) return null;

  return prisma.orderItem.findUnique({
    where: { trackingCode: normalized },
    include: packageInclude,
  });
}

export async function lookupTrackingByCode(
  code: string,
  userId: string,
  role: TrackingScanRole,
): Promise<
  | { ok: true; package: TrackingScanPackage }
  | { ok: false; error: string; status: number }
> {
  const normalized = normalizeTrackingCode(code);
  if (!isValidTrackingCode(normalized)) {
    return {
      ok: false,
      error: "Enter a valid ShegerShop tracking code (SHG-XXXX-XXXXXXXX).",
      status: 400,
    };
  }

  const item = await findPackageByCode(normalized);
  if (!item) {
    return { ok: false, error: "Tracking code not found.", status: 404 };
  }

  const shopName = item.product.sellerId
    ? (
        await prisma.sellerProfile.findUnique({
          where: { userId: item.product.sellerId },
          select: { shopName: true },
        })
      )?.shopName ?? null
    : null;

  return {
    ok: true,
    package: toScanPackage(item, userId, role, shopName),
  };
}

export async function applyTrackingScanAction(
  code: string,
  action: TrackingScanAction,
  userId: string,
  role: TrackingScanRole,
): Promise<
  | { ok: true; package: TrackingScanPackage }
  | { ok: false; error: string; status: number }
> {
  const lookup = await lookupTrackingByCode(code, userId, role);
  if (!lookup.ok) return lookup;

  const pkg = lookup.package;
  const allowed = pkg.actions.some((a) => a.action === action);
  if (!allowed) {
    return {
      ok: false,
      error: "This action is not allowed for this package.",
      status: 403,
    };
  }

  const status = pkg.fulfillmentStatus;

  if (action === "mark_ready") {
    if (!canTransitionFulfillment(status, "shipped")) {
      return { ok: false, error: "Cannot mark this package ready.", status: 409 };
    }
    const sellerId =
      role === "SELLER"
        ? userId
        : (
            await prisma.orderItem.findUnique({
              where: { id: pkg.orderItemId },
              select: { product: { select: { sellerId: true } } },
            })
          )?.product.sellerId;
    if (!sellerId) {
      return { ok: false, error: "Seller not found for this item.", status: 404 };
    }
    const result = await setSellerOrderItemStatus(
      sellerId,
      pkg.orderItemId,
      "shipped",
    );
    if (!result.ok) {
      return { ok: false, error: result.error, status: result.status };
    }
    notifyOrderItemStatus({ orderItemId: pkg.orderItemId, status: "shipped" });
  }

  if (action === "claim") {
    const job = await claimDeliveryJob(userId, pkg.orderItemId);
    if (!job) {
      return {
        ok: false,
        error: "This delivery is no longer available to claim.",
        status: 409,
      };
    }
  }

  if (action === "deliver") {
    if (role === "DELIVERY") {
      const job = await completeDeliveryJob(userId, pkg.orderItemId);
      if (!job) {
        return {
          ok: false,
          error: "Could not mark this delivery complete.",
          status: 409,
        };
      }
      notifyOrderItemStatus({ orderItemId: pkg.orderItemId, status: "delivered" });
      for (const itemId of job.itemIds) {
        if (itemId !== pkg.orderItemId) {
          notifyOrderItemStatus({ orderItemId: itemId, status: "delivered" });
        }
      }
    } else if (role === "ADMIN") {
      const item = await prisma.orderItem.findUnique({
        where: { id: pkg.orderItemId },
        select: { orderId: true },
      });
      if (!item) {
        return { ok: false, error: "Order item not found.", status: 404 };
      }
      const deliveredAt = new Date();
      await prisma.orderItem.updateMany({
        where: { orderId: item.orderId, fulfillmentStatus: "shipped" },
        data: { fulfillmentStatus: "delivered", deliveredAt },
      });
      notifyOrderItemStatus({ orderItemId: pkg.orderItemId, status: "delivered" });
    }
  }

  if (action === "cancel") {
    if (!canTransitionFulfillment(status, "cancelled")) {
      return { ok: false, error: "Cannot cancel this package.", status: 409 };
    }
    const sellerId =
      role === "SELLER"
        ? userId
        : (
            await prisma.orderItem.findUnique({
              where: { id: pkg.orderItemId },
              select: { product: { select: { sellerId: true } } },
            })
          )?.product.sellerId;
    if (!sellerId) {
      return { ok: false, error: "Seller not found for this item.", status: 404 };
    }
    const result = await setSellerOrderItemStatus(
      sellerId,
      pkg.orderItemId,
      "cancelled",
    );
    if (!result.ok) {
      return { ok: false, error: result.error, status: result.status };
    }
    notifyOrderItemStatus({ orderItemId: pkg.orderItemId, status: "cancelled" });
  }

  const refreshed = await lookupTrackingByCode(code, userId, role);
  if (!refreshed.ok) {
    return {
      ok: false,
      error: "Action completed but could not refresh package details.",
      status: 500,
    };
  }
  return refreshed;
}
