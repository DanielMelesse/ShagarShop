import { prisma } from "@/lib/db";
import {
  isAdminRole,
  isDeliveryRole,
  isSellerRole,
  type UserRole,
} from "@/lib/user-role";

export function tokenRole(role: unknown): UserRole | null {
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

/** Trust JWT role when present; only hit DB when the token has no role. */
export async function resolveSessionRole(
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
