import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuthSession } from "@/lib/require-auth";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  const auth = await requireAuthSession(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;
  const order = await prisma.order.findFirst({
    where: { id, userId: auth.session.user.id },
    include: {
      items: {
        include: {
          product: { select: { id: true, image: true } },
        },
        orderBy: { id: "asc" },
      },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  return NextResponse.json({
    order: {
      id: order.id,
      status: order.status,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      paidAt: order.paidAt?.toISOString() ?? null,
      subtotal: order.subtotal,
      shipping: order.shipping,
      tax: order.tax,
      total: order.total,
      shippingName: order.shippingName,
      address: order.address,
      city: order.city,
      zip: order.zip,
      createdAt: order.createdAt.toISOString(),
      items: order.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        priceAtPurchase: item.priceAtPurchase,
        fulfillmentStatus: item.fulfillmentStatus,
        trackingCode: item.trackingCode,
        deliveredAt: item.deliveredAt?.toISOString() ?? null,
        image: item.product?.image ?? null,
      })),
    },
  });
}
