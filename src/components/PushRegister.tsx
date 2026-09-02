"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { isNativeApp, mobileFetch } from "@/lib/mobile-auth-client";

/** Register device for FCM push when running in Capacitor. */
export function PushRegister() {
  const { status } = useSession();

  useEffect(() => {
    if (status !== "authenticated" || !isNativeApp()) return;

    void (async () => {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("sheger_push_token")
          : null;
      if (!token) return;

      await mobileFetch("/api/push/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          platform: /iPhone|iPad/i.test(navigator.userAgent) ? "ios" : "android",
        }),
      });
    })();
  }, [status]);

  return null;
}
