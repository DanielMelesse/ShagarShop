import { NextResponse } from "next/server";
import { getChapaMode, verifyChapaPayment } from "@/lib/chapa";
import { prisma } from "@/lib/db";
import { finalizeOnlinePaidOrder } from "@/lib/order-payment";
import { requireAuthSession } from "@/lib/require-auth";

/**
 * Buyer return-url verification after Chapa checkout (or mock redirect).
 */
export async function POST(request: Request) {
  try {
    const auth = await requireAuthSession(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = (await request.json()) as {
      txRef?: string;
      mock?: boolean;
    };
    const txRef = String(body.txRef ?? "").trim();
    if (!txRef) {
      return NextResponse.json({ error: "Missing txRef." }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { paymentTxRef: txRef },
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

    if (order.paymentMethod !== "chapa") {
      return NextResponse.json(
        { error: "Order is not a Chapa payment." },
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

    const allowMock = getChapaMode() === "mock" || body.mock === true;
    if (body.mock && !allowMock && process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "Mock payment is disabled." },
        { status: 403 },
      );
    }

    const verified = await verifyChapaPayment(txRef);
    if (!verified.success) {
      const pendingStatuses = new Set([
        "pending",
        "ongoing",
        "processing",
        "unknown",
        "",
      ]);
      if (pendingStatuses.has(verified.status.toLowerCase())) {
        return NextResponse.json(
          {
            ok: false,
            pending: true,
            status: verified.status,
            error: "Payment still pending.",
          },
          { status: 202 },
        );
      }

      return NextResponse.json(
        {
          ok: false,
          pending: false,
          error: "Payment was not completed.",
          status: verified.status,
        },
        { status: 400 },
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

    const result = await finalizeOnlinePaidOrder(txRef, verified.paymentRef);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({
      ok: true,
      alreadyPaid: result.alreadyPaid,
      orderId: result.order.id,
      total: result.order.total,
      mode: getChapaMode(),
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not verify payment.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
