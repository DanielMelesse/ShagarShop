import { prisma } from "@/lib/db";
import { isOnlinePaymentMethod } from "@/lib/payment";
import { notifyOrderPlaced } from "@/lib/sms/order-notify";

/**
 * Mark an online (Chapa / Telebirr merchant) order as paid, decrement stock once, notify buyer.
 * Safe to call multiple times (webhook + return URL).
 */
export async function finalizeOnlinePaidOrder(
  txRef: string,
  paymentRef?: string | null,
) {
  const existing = await prisma.order.findUnique({
    where: { paymentTxRef: txRef },
    include: { items: true },
  });

  if (!existing) {
    return { ok: false as const, error: "Order not found.", status: 404 };
  }

  if (existing.paymentStatus === "paid" && existing.status === "placed") {
    return { ok: true as const, order: existing, alreadyPaid: true };
  }

  if (!isOnlinePaymentMethod(existing.paymentMethod)) {
    return {
      ok: false as const,
      error: "Order is not an online payment.",
      status: 400,
    };
  }

  const order = await prisma.$transaction(async (tx) => {
    const current = await tx.order.findUnique({
      where: { id: existing.id },
      include: { items: true },
    });
    if (!current) return null;

    if (current.paymentStatus === "paid" && current.status === "placed") {
      return current;
    }

    for (const item of current.items) {
      const product = await tx.product.findUnique({
        where: { id: item.productId },
        select: { stock: true, name: true },
      });
      if (!product || product.stock < item.quantity) {
        throw new Error(
          `Insufficient stock for ${product?.name ?? item.productName}.`,
        );
      }
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    return tx.order.update({
      where: { id: current.id },
      data: {
        status: "placed",
        paymentStatus: "paid",
        paymentRef: paymentRef ?? current.paymentRef,
        paidAt: new Date(),
      },
      include: { items: true },
    });
  });

  if (!order) {
    return { ok: false as const, error: "Order not found.", status: 404 };
  }

  if (existing.paymentStatus !== "paid" && order.userId) {
    notifyOrderPlaced({
      userId: order.userId,
      orderId: order.id,
      total: order.total,
      itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
    });
  }

  return { ok: true as const, order, alreadyPaid: false };
}

/** @deprecated Use finalizeOnlinePaidOrder */
export const finalizeChapaPaidOrder = finalizeOnlinePaidOrder;

export function createPaymentTxRef(orderId: string): string {
  const suffix = Math.random().toString(36).slice(2, 8);
  return `ss-${orderId}-${suffix}`;
}
