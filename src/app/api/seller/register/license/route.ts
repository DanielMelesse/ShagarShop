import { NextResponse } from "next/server";
import { requireSellerSession } from "@/lib/require-seller";
import { saveLicenseFile } from "@/lib/seller-license";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const auth = await requireSellerSession(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const formData = await request.formData();
    const entry = formData.get("file");

    if (!entry || typeof entry === "string") {
      return NextResponse.json({ error: "No license file provided." }, { status: 400 });
    }

    const file = entry as File;
    const saved = await saveLicenseFile(auth.session.user.id, file);
    if (!saved.ok) {
      return NextResponse.json({ error: saved.error }, { status: 400 });
    }

    return NextResponse.json({ url: saved.url });
  } catch (error) {
    console.error("[seller/register/license POST]", error);
    return NextResponse.json({ error: "Could not upload license." }, { status: 500 });
  }
}
