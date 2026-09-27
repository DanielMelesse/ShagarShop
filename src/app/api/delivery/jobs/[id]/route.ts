import { NextResponse } from "next/server";
import { requireDeliverySession } from "@/lib/require-delivery";
import { toCourierDeliveryJob } from "@/lib/delivery";
import {
  claimDeliveryJob,
  completeDeliveryJob,
  returnDeliveryJob,
} from "@/lib/delivery-server";
import { notifyOrderItemStatus } from "@/lib/sms/order-notify";

interface RouteContext {
  params: Promise<{ id: string }>;
}

function notifyStopItems(
  job: { id: string; itemIds: string[] },
  status: "delivered" | "returned",
) {
  notifyOrderItemStatus({ orderItemId: job.id, status });
  for (const itemId of job.itemIds) {
    if (itemId !== job.id) {
      notifyOrderItemStatus({ orderItemId: itemId, status });
    }
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireDeliverySession(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  const action = String(body.action ?? "");

  if (action === "claim") {
    const job = await claimDeliveryJob(auth.session.user.id, id);
    if (!job) {
      return NextResponse.json(
        { error: "Job is no longer available." },
        { status: 409 },
      );
    }
    return NextResponse.json({ job: toCourierDeliveryJob(job) });
  }

  if (action === "deliver") {
    const job = await completeDeliveryJob(auth.session.user.id, id);
    if (!job) {
      return NextResponse.json(
        { error: "Could not mark this delivery complete." },
        { status: 409 },
      );
    }
    notifyStopItems(job, "delivered");
    return NextResponse.json({ job: toCourierDeliveryJob(job) });
  }

  if (action === "return") {
    const job = await returnDeliveryJob(auth.session.user.id, id);
    if (!job) {
      return NextResponse.json(
        { error: "Could not mark this delivery as returned." },
        { status: 409 },
      );
    }
    notifyStopItems(job, "returned");
    return NextResponse.json({ job: toCourierDeliveryJob(job) });
  }

  return NextResponse.json(
    { error: "Action must be claim, deliver, or return." },
    { status: 400 },
  );
}
