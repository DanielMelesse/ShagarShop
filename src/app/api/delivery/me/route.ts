import { NextResponse } from "next/server";
import { requireDeliverySession } from "@/lib/require-delivery";
import { getDeliveryProfile, getDeliveryStats } from "@/lib/delivery-server";

export async function GET(request: Request) {
  const auth = await requireDeliverySession(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const [profile, stats] = await Promise.all([
    getDeliveryProfile(auth.session.user.id),
    getDeliveryStats(auth.session.user.id),
  ]);

  return NextResponse.json({
    user: auth.session.user,
    profile,
    stats,
  });
}
