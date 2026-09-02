import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { finalizeOnlinePaidOrder } from "@/lib/order-payment";
import { requireAuthSession } from "@/lib/require-auth";
import { getTelebirrMode, verifyTelebirrPayment } from "@/lib/telebirr";

/**
 * Buyer return-url / polling verification for native Telebirr H5 C2B.
 */
export async function POST(request: Request) {
  try {
    const auth = await requireAuthSession(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = (await request.json()) as {
      txRef?: string;
      merchOrderId?: string;
      mock?: boolean;
    };
    const merchOrderId = String(
      body.merchOrderId ?? body.txRef ?? "",
    ).trim();
    if (!merchOrderId) {
      return NextResponse.json(
        { error: "Missing merchOrderId." },
        { status: 400 },
      );
    }

    const order = await prisma.order.findUnique({
      where: { paymentTxRef: merchOrderId },
      select: {
        id: true,
        userId: true,
        total: true,
        paymentStatus: true,
        paymentMethod: true,
        status: true,
      },
    });

    if (!order || order.userId !== auth.session.user.id) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    if (order.paymentMethod !== "telebirr") {
      return NextResponse.json(
        { error: "Order is not a Telebirr payment." },
        { status: 400 },
      );
    }

    if (order.paymentStatus === "paid" && order.status === "placed") {
      return NextResponse.json({
        ok: true,
        alreadyPaid: true,
        orderId: order.id,
        total: order.total,
      });
    }

    const allowMock = getTelebirrMode() === "mock" || body.mock === true;
    if (body.mock && !allowMock && process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "Mock payment is disabled." },
        { status: 403 },
      );
    }

    const verified = await verifyTelebirrPayment(merchOrderId);
    if (!verified.success) {
      return NextResponse.json(
        {
          ok: false,
          pending: verified.pending,
          status: verified.status,
          error: "Payment still pending.",
        },
        { status: 202 },
      );
    }

    if (
      verified.amount != null &&
      Math.abs(verified.amount - order.total) > 0.5
    ) {
      return NextResponse.json(
        { error: "Paid amount does not match order total." },
        { status: 400 },
      );
    }

    const result = await finalizeOnlinePaidOrder(
      merchOrderId,
      verified.paymentRef,
    );
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({
      ok: true,
      alreadyPaid: result.alreadyPaid,
      orderId: result.order.id,
      total: result.order.total,
      mode: getTelebirrMode(),
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not verify Telebirr payment.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
