"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import type { UserRole } from "@/lib/user-role";

export function useAuth() {
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";

  return {
    user: isAuthenticated ? (session?.user ?? null) : null,
    isAuthenticated,
    isReady: status !== "loading",
    login: async (phone: string, password: string) => {
      const result = await signIn("credentials", {
        phone,
        password,
        redirect: false,
      });
      return result?.ok ?? false;
    },
    signup: async (
      name: string,
      phone: string,
      password: string,
      email?: string,
      role: UserRole = "BUYER",
    ): Promise<{ ok: boolean; error?: string }> => {
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
      return { ok: true };
    },
    logout: () => signOut({ callbackUrl: "/" }),
  };
}
