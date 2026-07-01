import { prisma } from "@/lib/db";
import {
  type FulfillmentStatus,
  isFulfillmentStatus,
  type SellerDashboardStats,
  type SellerOrderLine,
} from "@/lib/seller-orders";

const orderItemInclude = {
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

function toOrderLine(row: {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  priceAtPurchase: number;
  fulfillmentStatus: string;
  product: { image: string };
  order: {
    id: string;
    createdAt: Date;
    shippingName: string;
    address: string;
    city: string;
    zip: string;
  };
}): SellerOrderLine {
  const status = isFulfillmentStatus(row.fulfillmentStatus)
    ? row.fulfillmentStatus
    : "pending";

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
  };
}

export async function getSellerOrderLines(sellerId: string): Promise<SellerOrderLine[]> {
  const rows = await prisma.orderItem.findMany({
    where: { product: { sellerId } },
    include: orderItemInclude,
    orderBy: { order: { createdAt: "desc" } },
  });

  return rows.map(toOrderLine);
}

export async function getSellerDashboardStats(
  sellerId: string,
  orderLines: SellerOrderLine[],
): Promise<SellerDashboardStats> {
  const products = await prisma.product.findMany({
    where: { sellerId },
    select: { stock: true, featured: true },
  });

  const pendingOrders = orderLines.filter((l) => l.fulfillmentStatus === "pending").length;
  const totalRevenue = orderLines
    .filter((l) => l.fulfillmentStatus !== "cancelled")
    .reduce((sum, l) => sum + l.lineTotal, 0);

  return {
    listings: products.length,
    unitsInStock: products.reduce((sum, p) => sum + p.stock, 0),
    featured: products.filter((p) => p.featured).length,
    pendingOrders,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
  };
}

export async function getSellerOrderItem(sellerId: string, orderItemId: string) {
  return prisma.orderItem.findFirst({
    where: {
      id: orderItemId,
      product: { sellerId },
    },
    include: orderItemInclude,
  });
}

export async function setSellerOrderItemStatus(
  sellerId: string,
  orderItemId: string,
  status: FulfillmentStatus,
) {
  const item = await getSellerOrderItem(sellerId, orderItemId);
  if (!item) return null;

  const updated = await prisma.orderItem.update({
    where: { id: orderItemId },
    data: { fulfillmentStatus: status },
    include: orderItemInclude,
  });

  return toOrderLine(updated);
}
