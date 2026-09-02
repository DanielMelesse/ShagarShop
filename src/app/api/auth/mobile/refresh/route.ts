import { NextResponse } from "next/server";
import { refreshMobileTokens, revokeRefreshToken } from "@/lib/mobile-auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const refreshToken = String(body.refreshToken ?? "");

  if (!refreshToken) {
    return NextResponse.json(
      { error: "refreshToken is required." },
      { status: 400 },
    );
  }

  const result = await refreshMobileTokens(refreshToken);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 401 });
  }

  return NextResponse.json(result);
}

export async function DELETE(request: Request) {
  const body = await request.json().catch(() => ({}));
  const refreshToken = String(body.refreshToken ?? "");
  if (refreshToken) {
    await revokeRefreshToken(refreshToken);
  }
  return NextResponse.json({ ok: true });
}
