import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSellerSession } from "@/lib/require-seller";
import { parseSellerProfileInput } from "@/lib/seller-profile";

export async function POST(request: Request) {
  try {
    const auth = await requireSellerSession(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const existing = await prisma.sellerProfile.findUnique({
      where: { userId: auth.session.user.id },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Seller registration is already complete." },
        { status: 409 },
      );
    }

    const body = await request.json();
    const parsed = parseSellerProfileInput(body);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const profile = await prisma.sellerProfile.create({
      data: {
        userId: auth.session.user.id,
        shopName: parsed.data.shopName,
        location: parsed.data.location,
        licenseUrl: parsed.data.licenseUrl,
        category: parsed.data.category,
      },
    });

    return NextResponse.json(
      {
        profile: {
          shopName: profile.shopName,
          location: profile.location,
          category: profile.category,
          licenseUrl: profile.licenseUrl,
          completedAt: profile.completedAt.toISOString(),
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[seller/register/profile POST]", error);
    return NextResponse.json(
      { error: "Could not save shop details." },
      { status: 500 },
    );
  }
}
