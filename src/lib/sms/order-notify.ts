import { prisma } from "@/lib/db";
import { sendPushToUser } from "@/lib/push-notify";
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
      if (!user?.phone) {
        /* SMS skipped — still send push below */
      } else {
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
      }
    } catch (error) {
      console.error("[sms] order placed notify error:", error);
    }

    void sendPushToUser(input.userId, {
      title: "Order placed",
      body: orderPlacedSms({
        orderId: input.orderId,
        total: input.total,
        itemCount: input.itemCount,
      }),
    });
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
              userId: true,
              user: { select: { phone: true } },
            },
          },
        },
      });

      if (!item) return;

      const phone = item.order.user?.phone;
      if (phone) {
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
      }

      const buyerId = item.order.userId;
      if (buyerId) {
        void sendPushToUser(buyerId, {
          title: "Order update",
          body: orderItemStatusSms({
            orderId: item.order.id,
            productName: item.productName,
            status,
          }),
        });
      }
    } catch (error) {
      console.error("[sms] fulfillment notify error:", error);
    }
  })();
}
