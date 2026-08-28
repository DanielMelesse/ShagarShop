"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import type { UserRole } from "@/lib/user-role";

function asUserRole(role: unknown): UserRole {
  if (
    role === "SELLER" ||
    role === "BUYER" ||
    role === "DELIVERY" ||
    role === "ADMIN"
  ) {
    return role;
  }
  return "BUYER";
}

/** Read role from the session cookie (authoritative after credentials sign-in). */
async function fetchSessionRole(
  timeoutMs = 2500,
): Promise<UserRole | undefined> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetch("/api/auth/session", {
      cache: "no-store",
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return undefined;
    const data = (await res.json()) as { user?: { role?: unknown } };
    if (!data?.user) return undefined;
    return asUserRole(data.user.role);
  } catch {
    return undefined;
  }
}

export function useAuth() {
  const { data: session, status, update } = useSession();
  const isAuthenticated = status === "authenticated";

  return {
    user: isAuthenticated ? (session?.user ?? null) : null,
    isAuthenticated,
    isReady: status !== "loading",
    refreshSession: update,
    login: async (
      phone: string,
      password: string,
    ): Promise<{ ok: boolean; role?: UserRole }> => {
      const result = await signIn("credentials", {
        phone,
        password,
        redirect: false,
      });
      if (!result?.ok) return { ok: false };

      // Cookie session is authoritative. Do not await SessionProvider update() —
      // it can hang after credentials sign-in and block the hard redirect.
      const role = await fetchSessionRole();
      void update().catch(() => undefined);

      return { ok: true, role };
    },
    signup: async (
      name: string,
      phone: string,
      password: string,
      email?: string,
      role: UserRole = "BUYER",
    ): Promise<{ ok: boolean; error?: string; role?: UserRole }> => {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          password,
          email: email?.trim() || undefined,
          role:
            role === "SELLER"
              ? "seller"
              : role === "DELIVERY"
                ? "delivery"
                : "buyer",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return {
          ok: false,
          error:
            typeof data.error === "string"
              ? data.error
              : "Could not create account.",
        };
      }
      const result = await signIn("credentials", {
        phone,
        password,
        redirect: false,
      });
      if (!result?.ok) {
        return {
          ok: false,
          error: "Account created but sign-in failed. Try logging in.",
        };
      }
      const sessionRole = (await fetchSessionRole()) ?? role;
      void update().catch(() => undefined);
      return { ok: true, role: asUserRole(sessionRole) };
    },
    logout: () => signOut({ callbackUrl: "/" }),
  };
}
