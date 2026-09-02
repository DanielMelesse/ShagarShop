import { NextResponse } from "next/server";
import { loginWithPhonePassword } from "@/lib/mobile-auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const phone = String(body.phone ?? "");
  const password = String(body.password ?? "");

  if (!phone || !password) {
    return NextResponse.json(
      { error: "Phone and password are required." },
      { status: 400 },
    );
  }

  const result = await loginWithPhonePassword(phone, password);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 401 });
  }

  return NextResponse.json(result);
}
