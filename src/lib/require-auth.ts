import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { resolveSessionRole } from "@/lib/session-role";
import type { UserRole } from "@/lib/user-role";

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
