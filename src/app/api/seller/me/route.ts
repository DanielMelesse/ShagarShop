import { NextResponse } from "next/server";
import { requireSellerSession } from "@/lib/require-seller";

export async function GET(request: Request) {
  const auth = await requireSellerSession(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  return NextResponse.json({ user: auth.session.user });
}
