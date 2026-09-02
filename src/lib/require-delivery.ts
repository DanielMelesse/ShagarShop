import { getAuthUserFromRequest } from "@/lib/auth-token";
import { prisma } from "@/lib/db";
import { isDeliveryRole } from "@/lib/user-role";

export async function requireDeliverySession(request: Request) {
  const user = await getAuthUserFromRequest(request);
  if (!user) {
    return { error: "Unauthorized" as const, status: 401 as const };
  }

  if (!isDeliveryRole(user.role)) {
    return { error: "Courier account required." as const, status: 403 as const };
  }

  const profile = await prisma.deliveryProfile.findUnique({
    where: { userId: user.id },
    select: { active: true },
  });
  if (!profile?.active) {
    return {
      error: "Complete courier registration first." as const,
      status: 403 as const,
    };
  }

  return { session: { user } };
}
