import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/require-admin";
import { getAdminCourierDetail } from "@/lib/admin-server";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  const auth = await requireAdminSession(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;
  const courier = await getAdminCourierDetail(id);
  if (!courier) {
    return NextResponse.json({ error: "Courier not found." }, { status: 404 });
  }

  return NextResponse.json({ courier });
}
