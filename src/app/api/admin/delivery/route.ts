import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/require-admin";
import { listAdminCouriers } from "@/lib/admin-server";
import { getAvailableDeliveryJobs } from "@/lib/delivery-server";

export async function GET(request: Request) {
  const auth = await requireAdminSession(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const [couriers, availableJobs] = await Promise.all([
    listAdminCouriers(),
    getAvailableDeliveryJobs(),
  ]);

  return NextResponse.json({
    couriers,
    availableJobs: availableJobs.slice(0, 20),
  });
}
