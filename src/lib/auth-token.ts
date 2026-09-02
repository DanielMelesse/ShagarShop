import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { verifyMobileAccessToken } from "@/lib/mobile-auth";
import { resolveSessionRole } from "@/lib/session-role";
import type { UserRole } from "@/lib/user-role";

export interface AuthUser {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  role: UserRole;
}

/** Resolve user from Bearer mobile JWT or NextAuth session cookie. */
export async function getAuthUserFromRequest(
  request: Request,
): Promise<AuthUser | null> {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const mobileUser = await verifyMobileAccessToken(authHeader.slice(7).trim());
    if (mobileUser) return mobileUser;
  }

  const token = await getToken({
    req: request as NextRequest,
    secret: process.env.NEXTAUTH_SECRET,
  });
  if (!token?.id) return null;

  const role = await resolveSessionRole(
    token.id as string,
    token.role as UserRole | undefined,
  );

  return {
    id: token.id as string,
    name: (token.name as string) ?? "",
    phone: (token.phone as string) ?? "",
    email: (token.email as string | null) ?? null,
    role,
  };
}
