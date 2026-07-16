import { NextResponse } from "next/server";
import { requireDeliverySession } from "@/lib/require-delivery";
import {
  getAvailableDeliveryJobs,
  getMyDeliveryJobs,
} from "@/lib/delivery-server";

export async function GET(request: Request) {
  const auth = await requireDeliverySession(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const scope = searchParams.get("scope") ?? "available";

  if (scope === "mine") {
    const jobs = await getMyDeliveryJobs(auth.session.user.id, {
      includeDelivered: searchParams.get("history") === "1",
    });
    return NextResponse.json({ jobs });
  }

  const jobs = await getAvailableDeliveryJobs();
  return NextResponse.json({ jobs });
}
