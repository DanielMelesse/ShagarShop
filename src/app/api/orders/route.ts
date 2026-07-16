import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { calculateOrderTotals } from "@/lib/products";
import type { ShippingLineInput } from "@/lib/shipping";
import { notifyOrderPlaced } from "@/lib/sms/order-notify";

interface OrderItemInput {
  productId: string;
  quantity: number;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ orders });
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const items = body.items as OrderItemInput[];
    const shippingName = String(body.shippingName ?? "").trim();
    const address = String(body.address ?? "").trim();
    const city = String(body.city ?? "").trim();
    const zip = String(body.zip ?? "").trim();

    if (!items?.length || !shippingName || !address || !city || !zip) {
      return NextResponse.json({ error: "Missing order details." }, { status: 400 });
    }

    const products = await prisma.product.findMany({
      where: { id: { in: items.map((i) => i.productId) } },
    });
    if (products.length !== items.length) {
      return NextResponse.json({ error: "Invalid product in cart." }, { status: 400 });
    }

    const productMap = new Map(products.map((p) => [p.id, p]));
    let subtotal = 0;
    const shippingLines: ShippingLineInput[] = [];
    const lineItems: {
      productId: string;
      quantity: number;
      priceAtPurchase: number;
      productName: string;
    }[] = [];

    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product || item.quantity < 1 || item.quantity > product.stock) {
        return NextResponse.json(
          { error: `Invalid quantity for ${product?.name ?? "product"}.` },
          { status: 400 },
        );
      }
      subtotal += product.price * item.quantity;
      shippingLines.push({
        quantity: item.quantity,
        shippingTier: product.shippingTier,
        extraShippingBirr: product.extraShippingBirr,
      });
      lineItems.push({
        productId: product.id,
        quantity: item.quantity,
        priceAtPurchase: product.price,
        productName: product.name,
      });
    }

    const { shipping, tax, total } = calculateOrderTotals(subtotal, shippingLines);

    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          userId: session.user.id,
          status: "placed",
          subtotal,
          shipping,
          tax,
          total,
          shippingName,
          address,
          city,
          zip,
          items: { create: lineItems },
        },
        include: { items: true },
      });
      for (const item of lineItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }
      return created;
    });

    notifyOrderPlaced({
      userId: session.user.id,
      orderId: order.id,
      total: order.total,
      itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
    });

    return NextResponse.json({ order });
  } catch {
    return NextResponse.json({ error: "Could not place order." }, { status: 500 });
  }
}
