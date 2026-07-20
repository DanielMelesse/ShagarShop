import {
  commissionRateForSeller,
  daysLeftInCommissionPromo,
  isSellerInCommissionPromo,
  SELLER_COMMISSION_RATE,
} from "@/lib/commission";
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
  commissionRate: number;
  commissionAmount: number;
  sellerEarnings: number;
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
  const lineTotal = Math.round(row.priceAtPurchase * row.quantity * 100) / 100;

  return {
    id: row.id,
    productId: row.productId,
    productName: row.productName,
    productImage: row.product.image,
    quantity: row.quantity,
    lineTotal,
    commissionRate: row.commissionRate,
    commissionAmount: row.commissionAmount,
    sellerEarnings:
      row.sellerEarnings > 0
        ? row.sellerEarnings
        : Math.round((lineTotal - row.commissionAmount) * 100) / 100,
    fulfillmentStatus: status,
    orderId: row.order.id,
    orderDate: row.order.createdAt.toISOString(),
    shippingName: row.order.shippingName,
    address: row.order.address,
    city: row.order.city,
    zip: row.order.zip,
  };
}

export async function getSellerOrderLines(
  sellerId: string,
  options?: { take?: number },
): Promise<SellerOrderLine[]> {
  const rows = await prisma.orderItem.findMany({
    where: { product: { sellerId } },
    include: orderItemInclude,
    orderBy: { order: { createdAt: "desc" } },
    take: options?.take ?? 50,
  });

  return rows.map(toOrderLine);
}

export async function getSellerDashboardStats(
  sellerId: string,
  orderLines: SellerOrderLine[],
): Promise<SellerDashboardStats> {
  const [products, profile] = await Promise.all([
    prisma.product.findMany({
      where: { sellerId },
      select: { stock: true, featured: true },
    }),
    prisma.sellerProfile.findUnique({
      where: { userId: sellerId },
      select: { completedAt: true },
    }),
  ]);

  const active = orderLines.filter((l) => l.fulfillmentStatus !== "cancelled");
  const totalRevenue = active.reduce((sum, l) => sum + l.lineTotal, 0);
  const netEarnings = active.reduce((sum, l) => sum + l.sellerEarnings, 0);
  const commissionPaid = active.reduce((sum, l) => sum + l.commissionAmount, 0);
  const pendingOrders = orderLines.filter((l) => l.fulfillmentStatus === "pending").length;

  const completedAt = profile?.completedAt;
  const inCommissionPromo = completedAt
    ? isSellerInCommissionPromo(completedAt)
    : false;

  return {
    listings: products.length,
    unitsInStock: products.reduce((sum, p) => sum + p.stock, 0),
    featured: products.filter((p) => p.featured).length,
    pendingOrders,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    netEarnings: Math.round(netEarnings * 100) / 100,
    commissionPaid: Math.round(commissionPaid * 100) / 100,
    promoDaysLeft: completedAt ? daysLeftInCommissionPromo(completedAt) : 0,
    inCommissionPromo,
    commissionRate: commissionRateForSeller(completedAt),
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
    data: {
      fulfillmentStatus: status,
      ...(status === "cancelled" || status === "pending"
        ? { deliveryId: null, deliveryAssignedAt: null }
        : {}),
    },
    include: orderItemInclude,
  });

  return toOrderLine(updated);
}

export { SELLER_COMMISSION_RATE };
