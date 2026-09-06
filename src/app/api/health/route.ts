import { NextResponse } from "next/server";

/** Public health endpoint for Railway (bypasses site lock). */
export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "shegershop",
    time: new Date().toISOString(),
  });
}
