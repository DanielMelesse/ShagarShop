import { NextResponse } from "next/server";
import {
  chapaCustomerEmail,
  initializeChapaPayment,
  splitCustomerName,
  toChapaPhone,
} from "@/lib/chapa";
import {
  commissionRateForSeller,
  settleLineCommission,
} from "@/lib/commission";
import { prisma } from "@/lib/db";
import { createPaymentTxRef } from "@/lib/order-payment";
import { isOnlinePaymentMethod, isPaymentMethod } from "@/lib/payment";
import {
  isMobileAppRequest,
  resolvePaymentReturnUrl,
} from "@/lib/payment-return";
import { calculateOrderTotals } from "@/lib/products";
import { requireAuthSession } from "@/lib/require-auth";
import type { ShippingLineInput } from "@/lib/shipping";
import { notifyOrderPlaced } from "@/lib/sms/order-notify";
import {
  createTelebirrCheckout,
  createTelebirrMerchOrderId,
} from "@/lib/telebirr";

interface OrderItemInput {
  productId: string;
  quantity: number;
}

export async function GET(request: Request) {
  const auth = await requireAuthSession(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const orders = await prisma.order.findMany({
    where: { userId: auth.session.user.id },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ orders });
}

export async function POST(request: Request) {
  try {
    const auth = await requireAuthSession(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const session = auth.session;
    const mobileClient = isMobileAppRequest(request);

    const body = await request.json();
    const items = body.items as OrderItemInput[];
    const shippingName = String(body.shippingName ?? "").trim();
    const address = String(body.address ?? "").trim();
    const city = String(body.city ?? "").trim();
    const zip = String(body.zip ?? "").trim();
    const paymentMethodRaw = body.paymentMethod ?? "telebirr";

    if (!isPaymentMethod(paymentMethodRaw)) {
      return NextResponse.json(
        { error: "Choose Telebirr, Chapa, or cash on delivery." },
        { status: 400 },
      );
    }
    const paymentMethod = paymentMethodRaw;

    if (!items?.length || !shippingName || !address || !city || !zip) {
      return NextResponse.json({ error: "Missing order details." }, { status: 400 });
    }

    const products = await prisma.product.findMany({
      where: { id: { in: items.map((i) => i.productId) } },
      include: {
        seller: {
          select: {
            sellerProfile: { select: { completedAt: true } },
          },
        },
      },
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
      commissionRate: number;
      commissionAmount: number;
      sellerEarnings: number;
    }[] = [];

    const now = new Date();
    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product || item.quantity < 1 || item.quantity > product.stock) {
        return NextResponse.json(
          { error: `Invalid quantity for ${product?.name ?? "product"}.` },
          { status: 400 },
        );
      }
      const lineTotal = product.price * item.quantity;
      subtotal += lineTotal;
      shippingLines.push({
        quantity: item.quantity,
        shippingTier: product.shippingTier,
        extraShippingBirr: product.extraShippingBirr,
        sellerId: product.sellerId,
      });

      const rate = commissionRateForSeller(
        product.seller?.sellerProfile?.completedAt,
        now,
      );
      const settled = settleLineCommission(lineTotal, rate);

      lineItems.push({
        productId: product.id,
        quantity: item.quantity,
        priceAtPurchase: product.price,
        productName: product.name,
        commissionRate: settled.commissionRate,
        commissionAmount: settled.commissionAmount,
        sellerEarnings: settled.sellerEarnings,
      });
    }

    const { shipping, tax, total } = calculateOrderTotals(subtotal, shippingLines);

    if (paymentMethod === "cod") {
      const order = await prisma.$transaction(async (tx) => {
        for (const item of lineItems) {
          const updated = await tx.product.updateMany({
            where: { id: item.productId, stock: { gte: item.quantity } },
            data: { stock: { decrement: item.quantity } },
          });
          if (updated.count !== 1) {
            throw new Error(`Insufficient stock for ${item.productName}.`);
          }
        }

        return tx.order.create({
          data: {
            userId: session.user.id,
            status: "placed",
            paymentStatus: "cod",
            paymentMethod: "cod",
            paidAt: null,
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
      });

      notifyOrderPlaced({
        userId: session.user.id,
        orderId: order.id,
        total: order.total,
        itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
      });

      return NextResponse.json({
        order,
        payment: { method: "cod", checkoutUrl: null },
      });
    }

    if (!isOnlinePaymentMethod(paymentMethod)) {
      return NextResponse.json({ error: "Unsupported payment method." }, { status: 400 });
    }

    // Online (Telebirr / Chapa): unpaid until verified; no stock decrement yet.
    const draft = await prisma.order.create({
      data: {
        userId: session.user.id,
        status: "awaiting_payment",
        paymentStatus: "pending",
        paymentMethod,
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

    const txRef =
      paymentMethod === "telebirr"
        ? createTelebirrMerchOrderId(draft.id)
        : createPaymentTxRef(draft.id);
    await prisma.order.update({
      where: { id: draft.id },
      data: { paymentTxRef: txRef },
    });

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true, phone: true },
    });

    const { firstName, lastName } = splitCustomerName(
      user?.name ?? shippingName,
    );
    const accountPhone = toChapaPhone(user?.phone ?? "");

    try {
      if (paymentMethod === "telebirr") {
        const telebirrReturn = resolvePaymentReturnUrl("telebirr", {
          mobile: mobileClient,
          txRef,
        });
        const checkout = await createTelebirrCheckout({
          merchOrderId: txRef,
          title: `ShegerShop ${draft.id.slice(0, 8)}`,
          amount: total,
          returnUrl: telebirrReturn,
        });

        await prisma.order.update({
          where: { id: draft.id },
          data: {
            paymentTxRef: checkout.merchOrderId,
            paymentRef: checkout.prepayId,
          },
        });

        return NextResponse.json({
          order: {
            ...draft,
            paymentTxRef: checkout.merchOrderId,
            paymentRef: checkout.prepayId,
          },
          payment: {
            method: "telebirr",
            mode: checkout.mode,
            checkoutUrl: checkout.checkoutUrl,
            txRef: checkout.merchOrderId,
            prepayId: checkout.prepayId,
            message: "Complete payment in the Telebirr checkout window.",
          },
        });
      }

      const chapaReturn = resolvePaymentReturnUrl("chapa", {
        mobile: mobileClient,
        txRef,
      });
      const payment = await initializeChapaPayment({
        amount: total,
        txRef,
        email: chapaCustomerEmail(user?.email, user?.phone ?? "guest"),
        firstName,
        lastName,
        phone: accountPhone,
        title: "ShegerShop",
        description: `Order ${draft.id.slice(0, 8)}`,
        returnUrl: chapaReturn,
      });

      return NextResponse.json({
        order: { ...draft, paymentTxRef: txRef },
        payment: {
          method: "chapa",
          mode: payment.mode,
          checkoutUrl: payment.checkoutUrl,
          txRef,
        },
      });
    } catch (err) {
      await prisma.order.update({
        where: { id: draft.id },
        data: {
          status: "cancelled",
          paymentStatus: "failed",
        },
      });
      const message =
        err instanceof Error ? err.message : "Could not start payment.";
      return NextResponse.json({ error: message }, { status: 502 });
    }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not place order.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
