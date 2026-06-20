import { NextResponse } from "next/server";
import { requireSellerSession } from "@/lib/require-seller";
import {
  getSellerProfileForUser,
  hasCompletedSellerRegistration,
} from "@/lib/seller-profile";

export async function GET(request: Request) {
  const auth = await requireSellerSession(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const profile = await getSellerProfileForUser(auth.session.user.id);

  return NextResponse.json({
    complete: profile !== null,
    profile: profile
      ? {
          shopName: profile.shopName,
          location: profile.location,
          category: profile.category,
          licenseUrl: profile.licenseUrl,
          completedAt: profile.completedAt.toISOString(),
        }
      : null,
  });
}

export async function HEAD(request: Request) {
  const auth = await requireSellerSession(request);
  if ("error" in auth) {
    return new NextResponse(null, { status: auth.status });
  }

  const complete = await hasCompletedSellerRegistration(auth.session.user.id);
  return new NextResponse(null, { status: complete ? 200 : 204 });
}
