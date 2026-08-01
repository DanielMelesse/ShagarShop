import {
  commissionRateForSeller,
  daysLeftInCommissionPromo,
  isSellerInCommissionPromo,
  sellerPromoEndsAt,
  SELLER_COMMISSION_RATE,
} from "@/lib/commission";
import { prisma } from "@/lib/db";
import { isFulfillmentStatus } from "@/lib/seller-orders";
import type {
  SellerEarningLine,
  SellerEarningsSummary,
} from "@/lib/seller-earnings";

function payoutStatusFor(
  status: string,
): SellerEarningLine["payoutStatus"] {
  if (status === "cancelled") return "cancelled";
  if (status === "delivered") return "available";
  return "held";
}

export async function getSellerEarnings(
  sellerId: string,
): Promise<SellerEarningsSummary> {
  const [profile, rows] = await Promise.all([
    prisma.sellerProfile.findUnique({
      where: { userId: sellerId },
      select: { completedAt: true },
    }),
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
      select: {
        id: true,
        productName: true,
        quantity: true,
        priceAtPurchase: true,
        commissionRate: true,
        commissionAmount: true,
        sellerEarnings: true,
        fulfillmentStatus: true,
        deliveredAt: true,
        order: { select: { id: true, createdAt: true } },
      },
      orderBy: { order: { createdAt: "desc" } },
      take: 100,
    }),
  ]);

  let grossSales = 0;
  let commissionPaid = 0;
  let netEarnings = 0;
  let availableForPayout = 0;
  let heldUntilDelivered = 0;
  let deliveredCount = 0;
  let heldCount = 0;

  const recentLines: SellerEarningLine[] = rows.map((row) => {
    const status = isFulfillmentStatus(row.fulfillmentStatus)
      ? row.fulfillmentStatus
      : "pending";
    const lineTotal =
      Math.round(row.priceAtPurchase * row.quantity * 100) / 100;
    const sellerEarnings =
      row.sellerEarnings > 0
        ? row.sellerEarnings
        : Math.round((lineTotal - row.commissionAmount) * 100) / 100;
    const payoutStatus = payoutStatusFor(status);

    if (status !== "cancelled") {
      grossSales += lineTotal;
      commissionPaid += row.commissionAmount;
      netEarnings += sellerEarnings;
      if (payoutStatus === "available") {
        availableForPayout += sellerEarnings;
        deliveredCount += 1;
      } else if (payoutStatus === "held") {
        heldUntilDelivered += sellerEarnings;
        heldCount += 1;
      }
    }

    return {
      id: row.id,
      orderId: row.order.id,
      orderDate: row.order.createdAt.toISOString(),
      productName: row.productName,
      quantity: row.quantity,
      lineTotal,
      commissionRate: row.commissionRate,
      commissionAmount: row.commissionAmount,
      sellerEarnings,
      fulfillmentStatus: status,
      deliveredAt: row.deliveredAt?.toISOString() ?? null,
      payoutStatus,
    };
  });

  const completedAt = profile?.completedAt ?? null;
  const inCommissionPromo = completedAt
    ? isSellerInCommissionPromo(completedAt)
    : false;

  return {
    grossSales: Math.round(grossSales * 100) / 100,
    commissionPaid: Math.round(commissionPaid * 100) / 100,
    netEarnings: Math.round(netEarnings * 100) / 100,
    availableForPayout: Math.round(availableForPayout * 100) / 100,
    heldUntilDelivered: Math.round(heldUntilDelivered * 100) / 100,
    deliveredCount,
    heldCount,
    inCommissionPromo,
    promoDaysLeft: completedAt ? daysLeftInCommissionPromo(completedAt) : 0,
    commissionRate: commissionRateForSeller(completedAt),
    promoEndsAt: completedAt
      ? sellerPromoEndsAt(completedAt).toISOString()
      : null,
    recentLines,
  };
}

export { SELLER_COMMISSION_RATE };
