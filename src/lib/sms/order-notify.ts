import { prisma } from "@/lib/db";
import type { FulfillmentStatus } from "@/lib/seller-orders";
import { orderItemStatusSms, orderPlacedSms } from "./order-messages";
import { sendSms } from "./send";

/** Fire-and-forget so SMS never blocks checkout or seller actions. */
export function notifyOrderPlaced(input: {
  userId: string;
  orderId: string;
  total: number;
  itemCount: number;
}): void {
  void (async () => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: input.userId },
        select: { phone: true },
      });
      if (!user?.phone) return;

      const result = await sendSms(
        user.phone,
        orderPlacedSms({
          orderId: input.orderId,
          total: input.total,
          itemCount: input.itemCount,
        }),
      );

      if (!result.ok && !result.skipped) {
        console.error("[sms] order placed notify failed:", result.error);
      }
    } catch (error) {
      console.error("[sms] order placed notify error:", error);
    }
  })();
}

export function notifyOrderItemStatus(input: {
  orderItemId: string;
  status: FulfillmentStatus;
}): void {
  if (input.status === "pending") return;
  const status = input.status;

  void (async () => {
    try {
      const item = await prisma.orderItem.findUnique({
        where: { id: input.orderItemId },
        select: {
          productName: true,
          order: {
            select: {
              id: true,
              user: { select: { phone: true } },
            },
          },
        },
      });

      const phone = item?.order.user?.phone;
      if (!phone || !item) return;

      const result = await sendSms(
        phone,
        orderItemStatusSms({
          orderId: item.order.id,
          productName: item.productName,
          status,
        }),
      );

      if (!result.ok && !result.skipped) {
        console.error("[sms] fulfillment notify failed:", result.error);
      }
    } catch (error) {
      console.error("[sms] fulfillment notify error:", error);
    }
  })();
}
