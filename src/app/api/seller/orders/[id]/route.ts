import { NextResponse } from "next/server";
import {
  isValidPackageBarcode,
  normalizePackageBarcode,
} from "@/lib/barcode";
import { requireSellerSession } from "@/lib/require-seller";
import {
  canTransitionFulfillment,
  isFulfillmentStatus,
  type FulfillmentStatus,
} from "@/lib/seller-orders";
import { getSellerOrderItem, setSellerOrderItemStatus } from "@/lib/seller-orders-server";
import { notifyOrderItemStatus } from "@/lib/sms/order-notify";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireSellerSession(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  const nextStatus = String(body.fulfillmentStatus ?? "");

  if (!isFulfillmentStatus(nextStatus)) {
    return NextResponse.json({ error: "Invalid fulfillment status." }, { status: 400 });
  }

  const existing = await getSellerOrderItem(auth.session.user.id, id);
  if (!existing) {
    return NextResponse.json({ error: "Order item not found." }, { status: 404 });
  }

  const currentStatus = isFulfillmentStatus(existing.fulfillmentStatus)
    ? existing.fulfillmentStatus
    : "pending";

  if (
    nextStatus !== currentStatus &&
    !canTransitionFulfillment(currentStatus, nextStatus)
  ) {
    return NextResponse.json(
      { error: `Cannot change status from ${currentStatus} to ${nextStatus}.` },
      { status: 400 },
    );
  }

  if (nextStatus === currentStatus) {
    return NextResponse.json({
      order: {
        id: existing.id,
        fulfillmentStatus: currentStatus,
        trackingCode: existing.trackingCode,
      },
    });
  }

  let trackingCode: string | null = null;
  if (nextStatus === "shipped") {
    const raw = typeof body.trackingCode === "string" ? body.trackingCode : "";
    const normalized = normalizePackageBarcode(raw);
    if (!isValidPackageBarcode(normalized)) {
      return NextResponse.json(
        {
          error:
            "A valid package barcode is required (scan or type) before marking ready for delivery.",
        },
        { status: 400 },
      );
    }
    trackingCode = normalized;
  }

  const result = await setSellerOrderItemStatus(
    auth.session.user.id,
    id,
    nextStatus as FulfillmentStatus,
    trackingCode,
  );

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  notifyOrderItemStatus({
    orderItemId: result.order.id,
    status: nextStatus as FulfillmentStatus,
  });

  return NextResponse.json({ order: result.order });
}
