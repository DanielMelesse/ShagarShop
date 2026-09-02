import { getAuthUserFromRequest } from "@/lib/auth-token";
import { isSellerRole } from "@/lib/user-role";

export async function requireSellerSession(request: Request) {
  const user = await getAuthUserFromRequest(request);
  if (!user) {
    return { error: "Unauthorized" as const, status: 401 as const };
  }

  if (!isSellerRole(user.role)) {
    return { error: "Seller account required." as const, status: 403 as const };
  }

  return { session: { user } };
}
