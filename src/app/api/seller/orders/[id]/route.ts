import { NextResponse } from "next/server";
import { requireSellerSession } from "@/lib/require-seller";
import {
  canTransitionFulfillment,
  isFulfillmentStatus,
  type FulfillmentStatus,
} from "@/lib/seller-orders";
import { getSellerOrderItem, setSellerOrderItemStatus } from "@/lib/seller-orders-server";

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
      order: { id: existing.id, fulfillmentStatus: currentStatus },
    });
  }

  const updated = await setSellerOrderItemStatus(
    auth.session.user.id,
    id,
    nextStatus as FulfillmentStatus,
  );

  if (!updated) {
    return NextResponse.json({ error: "Could not update order." }, { status: 500 });
  }

  return NextResponse.json({ order: updated });
}
