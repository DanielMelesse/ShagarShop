import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/require-admin";
import { getAdminSellerDetail } from "@/lib/admin-server";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  const auth = await requireAdminSession(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;
  const seller = await getAdminSellerDetail(id);
  if (!seller) {
    return NextResponse.json({ error: "Seller not found." }, { status: 404 });
  }

  return NextResponse.json({ seller });
}
