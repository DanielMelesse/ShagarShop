import { prisma } from "@/lib/db";
import type { DeliveryJob, DeliveryStats } from "@/lib/delivery";

const jobInclude = {
  product: { select: { image: true } },
  order: {
    select: {
      id: true,
      createdAt: true,
      shippingName: true,
      address: true,
      city: true,
      zip: true,
    },
  },
} as const;

function toJob(row: {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  priceAtPurchase: number;
  fulfillmentStatus: string;
  deliveryId: string | null;
  deliveryAssignedAt: Date | null;
  product: { image: string };
  order: {
    id: string;
    createdAt: Date;
    shippingName: string;
    address: string;
    city: string;
    zip: string;
  };
}): DeliveryJob {
  const status =
    row.fulfillmentStatus === "delivered" ? "delivered" : "shipped";

  return {
    id: row.id,
    productId: row.productId,
    productName: row.productName,
    productImage: row.product.image,
    quantity: row.quantity,
    lineTotal: Math.round(row.priceAtPurchase * row.quantity * 100) / 100,
    fulfillmentStatus: status,
    orderId: row.order.id,
    orderDate: row.order.createdAt.toISOString(),
    shippingName: row.order.shippingName,
    address: row.order.address,
    city: row.order.city,
    zip: row.order.zip,
    deliveryId: row.deliveryId,
    deliveryAssignedAt: row.deliveryAssignedAt?.toISOString() ?? null,
  };
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
  return rows.map(toJob);
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
  return rows.map(toJob);
}

export async function getDeliveryStats(deliveryId: string): Promise<DeliveryStats> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [available, active, deliveredToday] = await Promise.all([
    prisma.orderItem.count({
      where: { fulfillmentStatus: "shipped", deliveryId: null },
    }),
    prisma.orderItem.count({
      where: { fulfillmentStatus: "shipped", deliveryId },
    }),
    prisma.orderItem.count({
      where: {
        deliveryId,
        fulfillmentStatus: "delivered",
        deliveryAssignedAt: { gte: startOfDay },
      },
    }),
  ]);

  return { available, active, deliveredToday };
}

export async function claimDeliveryJob(deliveryId: string, orderItemId: string) {
  const result = await prisma.orderItem.updateMany({
    where: {
      id: orderItemId,
      fulfillmentStatus: "shipped",
      deliveryId: null,
    },
    data: {
      deliveryId,
      deliveryAssignedAt: new Date(),
    },
  });

  if (result.count === 0) return null;

  const row = await prisma.orderItem.findUnique({
    where: { id: orderItemId },
    include: jobInclude,
  });
  return row ? toJob(row) : null;
}

export async function completeDeliveryJob(
  deliveryId: string,
  orderItemId: string,
) {
  const result = await prisma.orderItem.updateMany({
    where: {
      id: orderItemId,
      deliveryId,
      fulfillmentStatus: "shipped",
    },
    data: {
      fulfillmentStatus: "delivered",
      deliveredAt: new Date(),
    },
  });

  if (result.count === 0) return null;

  const row = await prisma.orderItem.findUnique({
    where: { id: orderItemId },
    include: jobInclude,
  });
  return row ? toJob(row) : null;
}

export async function getDeliveryProfile(userId: string) {
  return prisma.deliveryProfile.findUnique({ where: { userId } });
}
