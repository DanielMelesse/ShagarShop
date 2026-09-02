import { getAuthUserFromRequest } from "@/lib/auth-token";

export async function requireAuthSession(request: Request) {
  const user = await getAuthUserFromRequest(request);
  if (!user) {
    return { error: "Unauthorized" as const, status: 401 as const };
  }

  return {
    session: { user },
  };
}
