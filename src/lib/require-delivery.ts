import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { resolveSessionRole } from "@/lib/session-role";
import { isDeliveryRole, type UserRole } from "@/lib/user-role";

export async function requireDeliverySession(request: Request) {
  const token = await getToken({
    req: request as NextRequest,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token?.id) {
    return { error: "Unauthorized" as const, status: 401 as const };
  }

  const role = await resolveSessionRole(
    token.id as string,
    token.role as UserRole | undefined,
  );

  if (!isDeliveryRole(role)) {
    return { error: "Delivery account required." as const, status: 403 as const };
  }

  const deliveryProfile = await prisma.deliveryProfile.findUnique({
    where: { userId: token.id as string },
    select: { id: true, active: true },
  });

  if (!deliveryProfile) {
    return {
      error: "Complete delivery registration first." as const,
      status: 403 as const,
    };
  }

  if (!deliveryProfile.active) {
    return { error: "Delivery account is inactive." as const, status: 403 as const };
  }

  return {
    session: {
      user: {
        id: token.id as string,
        name: (token.name as string) ?? "",
        phone: (token.phone as string) ?? "",
        email: (token.email as string | null) ?? null,
        role,
      },
    },
  };
}
