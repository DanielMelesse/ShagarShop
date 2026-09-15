import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuthSession } from "@/lib/require-auth";
import { isBuyerRole } from "@/lib/user-role";

/** Mark buyer shop-home onboarding as completed (finish or skip). */
export async function PATCH(request: Request) {
  const auth = await requireAuthSession(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  if (!isBuyerRole(auth.session.user.role)) {
    return NextResponse.json(
      { error: "Buyer onboarding is only for shopper accounts." },
      { status: 403 },
    );
  }

  const user = await prisma.user.update({
    where: { id: auth.session.user.id },
    data: {
      buyerOnboardingCompletedAt: new Date(),
    },
    select: {
      id: true,
      buyerOnboardingCompletedAt: true,
    },
  });

  return NextResponse.json({
    ok: true,
    buyerOnboardingDone: true,
    buyerOnboardingCompletedAt:
      user.buyerOnboardingCompletedAt?.toISOString() ?? null,
  });
}
