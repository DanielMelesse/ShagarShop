import { NextResponse } from "next/server";
import { verifyChapaPayment } from "@/lib/chapa";
import { finalizeOnlinePaidOrder } from "@/lib/order-payment";

/**
 * Chapa server callback (webhook). Also accepts GET with ?trx_ref= / ?tx_ref=
 * Idempotent: safe if the return page already verified the payment.
 */
export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") ?? "";
    let txRef = "";

    if (contentType.includes("application/json")) {
      const body = (await request.json()) as {
        tx_ref?: string;
        trx_ref?: string;
      };
      txRef = String(body.tx_ref ?? body.trx_ref ?? "").trim();
    } else {
      const form = await request.formData();
      txRef = String(form.get("tx_ref") ?? form.get("trx_ref") ?? "").trim();
    }

    if (!txRef) {
      return NextResponse.json({ error: "Missing tx_ref." }, { status: 400 });
    }

    return verifyAndFinalize(txRef);
  } catch {
    return NextResponse.json({ error: "Webhook failed." }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const txRef = String(
    searchParams.get("tx_ref") ?? searchParams.get("trx_ref") ?? "",
  ).trim();

  if (!txRef) {
    return NextResponse.json({ error: "Missing tx_ref." }, { status: 400 });
  }

  return verifyAndFinalize(txRef);
}

async function verifyAndFinalize(txRef: string) {
  const verified = await verifyChapaPayment(txRef);
  if (!verified.success) {
    return NextResponse.json(
      { error: "Payment not successful.", status: verified.status },
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
  });
}
