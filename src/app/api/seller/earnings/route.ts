import { NextResponse } from "next/server";
import { requireSellerSession } from "@/lib/require-seller";
import { getSellerEarnings } from "@/lib/seller-earnings-server";

export async function GET(request: Request) {
  const auth = await requireSellerSession(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const earnings = await getSellerEarnings(auth.session.user.id);
  return NextResponse.json({ earnings });
}
