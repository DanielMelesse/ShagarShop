import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { isSellerRole, type UserRole } from "@/lib/user-role";

async function resolveSessionRole(
  userId: string,
  role: UserRole | string | undefined,
): Promise<UserRole> {
  if (isSellerRole(role)) return "SELLER";
  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  return dbUser?.role === "SELLER" ? "SELLER" : "BUYER";
}

export async function requireAuthSession(request: Request) {
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
