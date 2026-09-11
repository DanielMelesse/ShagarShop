import { NextResponse } from "next/server";
import { requireSellerSession } from "@/lib/require-seller";
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
  const orders = await getSellerOrderLines(sellerId);
  const stats = await getSellerDashboardStats(sellerId, orders);

  return NextResponse.json({ stats, orders });
}
