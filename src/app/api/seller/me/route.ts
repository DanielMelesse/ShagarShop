import { NextResponse } from "next/server";
import { requireSellerSession } from "@/lib/require-seller";
import { getSellerProfileForUser } from "@/lib/seller-profile";
import {
  getSellerDashboardStats,
  getSellerOrderLines,
} from "@/lib/seller-orders-server";

export async function GET(request: Request) {
  const auth = await requireSellerSession(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const sellerId = auth.session.user.id;
  const [profile, orders] = await Promise.all([
    getSellerProfileForUser(sellerId),
    getSellerOrderLines(sellerId, { take: 50 }),
  ]);
  const stats = await getSellerDashboardStats(sellerId, orders);

  return NextResponse.json({
    user: auth.session.user,
    profile: profile
      ? {
          shopName: profile.shopName,
          location: profile.location,
          category: profile.category,
          licenseUrl: profile.licenseUrl,
          completedAt: profile.completedAt.toISOString(),
        }
      : null,
    registrationComplete: profile !== null,
    stats,
  });
}
