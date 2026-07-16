import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/require-admin";
import { listAdminProducts } from "@/lib/admin-server";

export async function GET(request: Request) {
  const auth = await requireAdminSession(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const products = await listAdminProducts();
  return NextResponse.json({ products });
}
