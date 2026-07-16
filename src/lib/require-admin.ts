import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { isAdminRole, type UserRole } from "@/lib/user-role";

export async function requireAdminSession(request: Request) {
  const token = await getToken({
    req: request as NextRequest,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token?.id) {
    return { error: "Unauthorized" as const, status: 401 as const };
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: token.id as string },
    select: { id: true, name: true, phone: true, email: true, role: true },
  });

  if (!dbUser || !isAdminRole(dbUser.role)) {
    return { error: "Admin access required." as const, status: 403 as const };
  }

  return {
    session: {
      user: {
        id: dbUser.id,
        name: dbUser.name,
        phone: dbUser.phone,
        email: dbUser.email,
        role: dbUser.role as UserRole,
      },
    },
  };
}
