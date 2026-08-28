import {
  commissionRateForSeller,
  daysLeftInCommissionPromo,
  isSellerInCommissionPromo,
  SELLER_COMMISSION_RATE,
} from "@/lib/commission";
import {
  createShopPackageBarcode,
  isValidPackageBarcode,
  normalizePackageBarcode,
} from "@/lib/barcode";
import { prisma } from "@/lib/db";
import {
  type FulfillmentStatus,
  isFulfillmentStatus,
  type SellerDashboardStats,
  type SellerOrderLine,
} from "@/lib/seller-orders";

const orderItemInclude = {
  product: { select: { image: true, sellerId: true } },
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

function toOrderLine(
  row: {
    id: string;
    productId: string;
    productName: string;
    quantity: number;
    priceAtPurchase: number;
    commissionRate: number;
    commissionAmount: number;
    sellerEarnings: number;
    fulfillmentStatus: string;
    trackingCode: string | null;
    product: { image: string; sellerId?: string | null };
    order: {
      id: string;
      createdAt: Date;
      shippingName: string;
      address: string;
      city: string;
      zip: string;
    };
  },
  shopName: string | null = null,
): SellerOrderLine {
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
    trackingCode: row.trackingCode,
    shopName,
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
  const [rows, profile] = await Promise.all([
    prisma.orderItem.findMany({
      where: {
        product: { sellerId },
        order: {
          OR: [
            { paymentStatus: { in: ["paid", "cod"] } },
            { paymentMethod: "demo", status: "placed" },
          ],
        },
      },
      include: orderItemInclude,
      orderBy: { order: { createdAt: "desc" } },
      take: options?.take ?? 50,
    }),
    prisma.sellerProfile.findUnique({
      where: { userId: sellerId },
      select: { shopName: true },
    }),
  ]);

  const shopName = profile?.shopName ?? null;
  return rows.map((row) => toOrderLine(row, shopName));
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
  trackingCode?: string | null,
): Promise<
  | { ok: true; order: SellerOrderLine }
  | { ok: false; error: string; status: number }
> {
  const item = await getSellerOrderItem(sellerId, orderItemId);
  if (!item) {
    return { ok: false, error: "Order item not found.", status: 404 };
  }

  const profile = await prisma.sellerProfile.findUnique({
    where: { userId: sellerId },
    select: { shopName: true },
  });
  const shopName = profile?.shopName ?? null;

  let codeToStore: string | null = null;
  if (status === "shipped") {
    const provided = trackingCode?.trim()
      ? normalizePackageBarcode(trackingCode)
      : "";
    if (provided && !isValidPackageBarcode(provided)) {
      return {
        ok: false,
        error: "Invalid package barcode format.",
        status: 400,
      };
    }

    codeToStore =
      provided ||
      createShopPackageBarcode({
        sellerId,
        productId: item.productId,
        orderItemId: item.id,
        shopName,
      });

    // Extremely unlikely collision — bump with a short suffix and retry once.
    for (let attempt = 0; attempt < 3; attempt++) {
      const candidate =
        attempt === 0
          ? codeToStore
          : normalizePackageBarcode(
              `${codeToStore.slice(0, 40)}-${(attempt + 1).toString(36).toUpperCase()}`,
            );
      const taken = await prisma.orderItem.findFirst({
        where: {
          trackingCode: candidate,
          NOT: { id: orderItemId },
        },
        select: { id: true },
      });
      if (!taken) {
        codeToStore = candidate;
        break;
      }
      if (attempt === 2) {
        return {
          ok: false,
          error: "Could not allocate a unique package barcode. Try again.",
          status: 409,
        };
      }
    }
  }

  try {
    const updated = await prisma.orderItem.update({
      where: { id: orderItemId },
      data: {
        fulfillmentStatus: status,
        ...(status === "shipped" && codeToStore
          ? { trackingCode: codeToStore }
          : {}),
        ...(status === "cancelled" || status === "pending"
          ? {
              deliveryId: null,
              deliveryAssignedAt: null,
              trackingCode: null,
            }
          : {}),
      },
      include: orderItemInclude,
    });

    return { ok: true, order: toOrderLine(updated, shopName) };
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("Unique constraint") || message.includes("trackingCode")) {
      return {
        ok: false,
        error: "That barcode is already assigned to another package.",
        status: 409,
      };
    }
    throw error;
  }
}

export { SELLER_COMMISSION_RATE };
