import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isSellerRole } from "@/lib/user-role";

export async function requireSellerSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: "Unauthorized" as const, status: 401 as const };
  }
  if (!isSellerRole(session.user.role)) {
    return { error: "Seller account required." as const, status: 403 as const };
  }
  return { session };
}
