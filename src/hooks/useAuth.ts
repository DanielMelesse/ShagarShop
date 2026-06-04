"use client";

import { signIn, signOut, useSession } from "next-auth/react";

export function useAuth() {
  const { data: session, status } = useSession();

  return {
    user: session?.user ?? null,
    isReady: status !== "loading",
    login: async (email: string, password: string) => {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      return result?.ok ?? false;
    },
    signup: async (name: string, email: string, password: string) => {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      if (!res.ok) return false;
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      return result?.ok ?? false;
    },
    logout: () => signOut({ callbackUrl: "/" }),
  };
}
