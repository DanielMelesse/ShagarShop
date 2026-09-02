import { getAuthUserFromRequest } from "@/lib/auth-token";
import { isAdminRole } from "@/lib/user-role";

export async function requireAdminSession(request: Request) {
  const user = await getAuthUserFromRequest(request);
  if (!user) {
    return { error: "Unauthorized" as const, status: 401 as const };
  }

  if (!isAdminRole(user.role)) {
    return { error: "Admin access required." as const, status: 403 as const };
  }

  return { session: { user } };
}
