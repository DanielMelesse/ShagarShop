import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parseSellerProfileUpdate } from "@/lib/seller-profile";
import { requireAuthSession } from "@/lib/require-auth";
import { isSellerRole } from "@/lib/user-role";

export async function PATCH(request: Request) {
  const auth = await requireAuthSession(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  if (!isSellerRole(auth.session.user.role)) {
    return NextResponse.json({ error: "Seller account required." }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = parseSellerProfileUpdate(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const existing = await prisma.sellerProfile.findUnique({
    where: { userId: auth.session.user.id },
  });
  if (!existing) {
    return NextResponse.json(
      { error: "Complete seller registration before updating shop details." },
      { status: 400 },
    );
  }

  const profile = await prisma.sellerProfile.update({
    where: { userId: auth.session.user.id },
    data: parsed.data,
  });

  return NextResponse.json({
    profile: {
      shopName: profile.shopName,
      location: profile.location,
      category: profile.category,
      licenseUrl: profile.licenseUrl,
      completedAt: profile.completedAt.toISOString(),
    },
  });
}
