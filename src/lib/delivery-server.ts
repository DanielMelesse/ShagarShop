import { prisma } from "@/lib/db";
import type { DeliveryJob, DeliveryJobItem, DeliveryStats } from "@/lib/delivery";
import {
  calculateLineShippingFees,
  courierPayoutForDeliveryStop,
  isSingleShopOrder,
  settleDeliveryFee,
  type ShippingLineInput,
} from "@/lib/shipping";

const jobInclude = {
  product: { select: { image: true, shippingTier: true } },
  order: {
    select: {
      id: true,
      createdAt: true,
      shipping: true,
      shippingName: true,
      address: true,
      city: true,
      zip: true,
      items: {
        select: {
          id: true,
          quantity: true,
          product: {
            select: {
              shippingTier: true,
              extraShippingBirr: true,
              sellerId: true,
            },
          },
        },
      },
    },
  },
} as const;

type JobRow = {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  priceAtPurchase: number;
  fulfillmentStatus: string;
  trackingCode: string | null;
  deliveryId: string | null;
  deliveryAssignedAt: Date | null;
  deliveredAt?: Date | null;
  product: { image: string; shippingTier: string };
  order: {
    id: string;
    createdAt: Date;
    shipping: number;
    shippingName: string;
    address: string;
    city: string;
    zip: string;
    items: {
      id: string;
      quantity: number;
      product: {
        shippingTier: string;
        extraShippingBirr: number;
        sellerId: string | null;
      };
    }[];
  };
};

function toJobItem(row: JobRow): DeliveryJobItem {
  return {
    id: row.id,
    productId: row.productId,
    productName: row.productName,
    productImage: row.product.image,
    quantity: row.quantity,
    lineTotal: Math.round(row.priceAtPurchase * row.quantity * 100) / 100,
    shippingTier: row.product.shippingTier,
    trackingCode: row.trackingCode ?? "",
  };
}

/** Bundle order-item rows that share an order into one courier stop. */
export function rowsToStop(rows: JobRow[]): DeliveryJob | null {
  if (rows.length === 0) return null;

  const sorted = [...rows].sort((a, b) => a.id.localeCompare(b.id));
  const primary = sorted[0];
  const items = sorted.map(toJobItem);
  const stopQty = items.reduce((sum, i) => sum + i.quantity, 0);
  const orderShippingLines: ShippingLineInput[] = primary.order.items.map(
    (row) => ({
      quantity: row.quantity,
      shippingTier: row.product.shippingTier,
      extraShippingBirr: row.product.extraShippingBirr,
      sellerId: row.product.sellerId,
    }),
  );
  const lineFees = calculateLineShippingFees(orderShippingLines);
  const feeByItemId = new Map(
    primary.order.items.map((row, index) => [row.id, lineFees[index] ?? 0]),
  );
  const deliveryFee = Math.round(
    items.reduce((sum, item) => sum + (feeByItemId.get(item.id) ?? 0), 0) * 100,
  ) / 100;
  const stopShippingLines: ShippingLineInput[] = sorted.map((row) => {
    const line = primary.order.items.find((i) => i.id === row.id);
    return {
      quantity: row.quantity,
      shippingTier: line?.product.shippingTier,
      extraShippingBirr: line?.product.extraShippingBirr,
      sellerId: line?.product.sellerId,
    };
  });
  const singleShopStop = isSingleShopOrder(stopShippingLines);
  const payout = courierPayoutForDeliveryStop(
    items.length,
    deliveryFee,
    singleShopStop,
    stopQty,
  );
  const { courier, platform } = settleDeliveryFee(deliveryFee, payout.total);

  const allDelivered = sorted.every((r) => r.fulfillmentStatus === "delivered");
  const productName =
    items.length === 1
      ? items[0].productName
      : `${items[0].productName} + ${items.length - 1} more`;

  return {
    id: primary.id,
    orderId: primary.order.id,
    itemIds: items.map((i) => i.id),
    items,
    itemCount: items.length,
    productName,
    productImage: items[0].productImage,
    quantity: stopQty,
    lineTotal: Math.round(items.reduce((sum, i) => sum + i.lineTotal, 0) * 100) / 100,
    trackingCode: items[0].trackingCode || items.map((i) => i.trackingCode).find(Boolean) || "",
    deliveryFee,
    courierEarning: courier,
    courierPayout: payout,
    platformFee: platform,
    fulfillmentStatus: allDelivered ? "delivered" : "shipped",
    orderDate: primary.order.createdAt.toISOString(),
    shippingName: primary.order.shippingName,
    address: primary.order.address,
    city: primary.order.city,
    zip: primary.order.zip,
    deliveryId: primary.deliveryId,
    deliveryAssignedAt: primary.deliveryAssignedAt?.toISOString() ?? null,
  };
}

function groupRowsByOrder(rows: JobRow[]): DeliveryJob[] {
  const byOrder = new Map<string, JobRow[]>();
  for (const row of rows) {
    const list = byOrder.get(row.order.id) ?? [];
    list.push(row);
    byOrder.set(row.order.id, list);
  }

  return [...byOrder.values()]
    .map((group) => rowsToStop(group))
    .filter((job): job is DeliveryJob => job !== null)
    .sort(
      (a, b) =>
        new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime(),
    );
}

export async function getAvailableDeliveryJobs(): Promise<DeliveryJob[]> {
  const rows = await prisma.orderItem.findMany({
    where: {
      fulfillmentStatus: "shipped",
      deliveryId: null,
    },
    include: jobInclude,
    orderBy: { order: { createdAt: "asc" } },
  });
  return groupRowsByOrder(rows);
}

export async function getMyDeliveryJobs(
  deliveryId: string,
  options?: { includeDelivered?: boolean },
): Promise<DeliveryJob[]> {
  const rows = await prisma.orderItem.findMany({
    where: {
      deliveryId,
      fulfillmentStatus: options?.includeDelivered
        ? { in: ["shipped", "delivered"] }
        : "shipped",
    },
    include: jobInclude,
    orderBy: [{ deliveryAssignedAt: "desc" }, { order: { createdAt: "desc" } }],
  });
  return groupRowsByOrder(rows);
}

export async function getDeliveryStats(deliveryId: string): Promise<DeliveryStats> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [availableRows, activeRows, deliveredTodayRows] = await Promise.all([
    prisma.orderItem.findMany({
      where: { fulfillmentStatus: "shipped", deliveryId: null },
      select: { orderId: true },
    }),
    prisma.orderItem.findMany({
      where: { fulfillmentStatus: "shipped", deliveryId },
      select: { orderId: true },
    }),
    prisma.orderItem.findMany({
      where: {
        deliveryId,
        fulfillmentStatus: "delivered",
        deliveredAt: { gte: startOfDay },
      },
      include: jobInclude,
    }),
  ]);

  const deliveredStops = groupRowsByOrder(deliveredTodayRows);
  const earningsToday =
    Math.round(
      deliveredStops.reduce((sum, job) => sum + job.courierEarning, 0) * 100,
    ) / 100;

  return {
    available: new Set(availableRows.map((r) => r.orderId)).size,
    active: new Set(activeRows.map((r) => r.orderId)).size,
    deliveredToday: deliveredStops.length,
    earningsToday,
  };
}

/** Claim every shipped, unassigned line on the same order (one stop). */
export async function claimDeliveryJob(deliveryId: string, orderItemId: string) {
  const seed = await prisma.orderItem.findFirst({
    where: {
      id: orderItemId,
      fulfillmentStatus: "shipped",
      deliveryId: null,
    },
    select: { orderId: true },
  });
  if (!seed) return null;

  const assignedAt = new Date();
  const result = await prisma.orderItem.updateMany({
    where: {
      orderId: seed.orderId,
      fulfillmentStatus: "shipped",
      deliveryId: null,
    },
    data: {
      deliveryId,
      deliveryAssignedAt: assignedAt,
    },
  });

  if (result.count === 0) return null;

  const rows = await prisma.orderItem.findMany({
    where: {
      orderId: seed.orderId,
      deliveryId,
      fulfillmentStatus: "shipped",
    },
    include: jobInclude,
  });
  return rowsToStop(rows);
}

/** Mark every active line on this stop delivered. */
export async function completeDeliveryJob(
  deliveryId: string,
  orderItemId: string,
) {
  const seed = await prisma.orderItem.findFirst({
    where: {
      id: orderItemId,
      deliveryId,
      fulfillmentStatus: "shipped",
    },
    select: { orderId: true },
  });
  if (!seed) return null;

  const deliveredAt = new Date();
  const result = await prisma.orderItem.updateMany({
    where: {
      orderId: seed.orderId,
      deliveryId,
      fulfillmentStatus: "shipped",
    },
    data: {
      fulfillmentStatus: "delivered",
      deliveredAt,
    },
  });

  if (result.count === 0) return null;

  const rows = await prisma.orderItem.findMany({
    where: {
      orderId: seed.orderId,
      deliveryId,
      fulfillmentStatus: "delivered",
    },
    include: jobInclude,
  });
  return rowsToStop(rows);
}

export async function getDeliveryProfile(userId: string) {
  return prisma.deliveryProfile.findUnique({ where: { userId } });
}
