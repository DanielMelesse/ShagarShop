import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import {
  isAdminRole,
  isDeliveryRole,
  isSellerRole,
  type UserRole,
} from "@/lib/user-role";

function tokenRole(role: unknown): UserRole | null {
  if (
    role === "SELLER" ||
    role === "BUYER" ||
    role === "DELIVERY" ||
    role === "ADMIN"
  ) {
    return role;
  }
  return null;
}

async function resolveSessionRole(
  userId: string,
  role: unknown,
): Promise<UserRole> {
  const fromToken = tokenRole(role);
  if (fromToken) return fromToken;

  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (isSellerRole(dbUser?.role)) return "SELLER";
  if (isDeliveryRole(dbUser?.role)) return "DELIVERY";
  if (isAdminRole(dbUser?.role)) return "ADMIN";
  return "BUYER";
}

export async function requireSellerSession(request: Request) {
  const token = await getToken({
    req: request as NextRequest,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token?.id) {
    return { error: "Unauthorized" as const, status: 401 as const };
  }

  const role = await resolveSessionRole(token.id as string, token.role);

  if (!isSellerRole(role)) {
    return { error: "Seller account required." as const, status: 403 as const };
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
