import {
  getTelebirrMode,
  parseTelebirrNotify,
  telebirrNotifyErrorResponse,
  telebirrNotifySuccessResponse,
  verifyTelebirrPayment,
} from "@/lib/telebirr";
import { finalizeOnlinePaidOrder } from "@/lib/order-payment";

/**
 * Ethio Telecom Telebirr server-to-server notify URL.
 * Must acknowledge with Telebirr's expected response shape.
 */
export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") ?? "";
    let body: unknown;

    if (contentType.includes("application/json")) {
      body = await request.json();
    } else {
      const text = await request.text();
      try {
        body = JSON.parse(text);
      } catch {
        body = Object.fromEntries(new URLSearchParams(text).entries());
      }
    }

    const parsed = parseTelebirrNotify(body);
    if (!parsed.isSuccess) {
      if (getTelebirrMode() === "mock") {
        return Response.json({ error: "Payment not successful." }, { status: 400 });
      }
      return telebirrNotifyErrorResponse("Payment not successful.");
    }

    // Confirm with Telebirr query API before fulfilling (except mock).
    const verified = await verifyTelebirrPayment(parsed.merchOrderId);
    if (!verified.success) {
      if (getTelebirrMode() === "mock") {
        return Response.json({ error: "Not paid yet." }, { status: 400 });
      }
      return telebirrNotifyErrorResponse("Payment not confirmed.");
    }

    const result = await finalizeOnlinePaidOrder(
      parsed.merchOrderId,
      verified.paymentRef ?? parsed.paymentRef,
    );

    if (!result.ok) {
      if (getTelebirrMode() === "mock") {
        return Response.json({ error: result.error }, { status: result.status });
      }
      return telebirrNotifyErrorResponse(result.error, result.status);
    }

    if (getTelebirrMode() === "mock") {
      return Response.json({
        ok: true,
        alreadyPaid: result.alreadyPaid,
        orderId: result.order.id,
      });
    }

    return telebirrNotifySuccessResponse();
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Telebirr webhook failed.";
    if (getTelebirrMode() === "mock") {
      return Response.json({ error: message }, { status: 500 });
    }
    return telebirrNotifyErrorResponse(message, 500);
  }
}
