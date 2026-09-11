"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SellLanding } from "@/components/seller/SellLanding";
import { SellerDashboard } from "@/components/seller/SellerDashboard";
import { useAuth } from "@/hooks/useAuth";
import { SELLER_REGISTER } from "@/lib/seller-routes";
import { isSellerRole } from "@/lib/user-role";

function MyshopHomeSkeleton() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <div className="h-40 animate-pulse rounded-2xl bg-zinc-100" />
    </div>
  );
}

/**
 * `/myshop` — marketing for guests/buyers; dashboard for registered sellers.
 */
export function MyshopHome() {
  const router = useRouter();
  const { user, isReady } = useAuth();
  const [phase, setPhase] = useState<"loading" | "landing" | "dashboard">(
    "loading",
  );

  useEffect(() => {
    let cancelled = false;

    async function resolve() {
      if (!isReady) return;

      if (!user || !isSellerRole(user.role)) {
        if (!cancelled) setPhase("landing");
        return;
      }

      try {
        const res = await fetch("/api/myshop/me", { credentials: "same-origin" });
        if (cancelled) return;
        if (!res.ok) {
          setPhase("landing");
          return;
        }
        const data = (await res.json()) as { registrationComplete?: boolean };
        if (!data.registrationComplete) {
          router.replace(SELLER_REGISTER);
          return;
        }
        setPhase("dashboard");
      } catch {
        if (!cancelled) setPhase("landing");
      }
    }

    void resolve();
    return () => {
      cancelled = true;
    };
  }, [isReady, user, user?.role, router]);

  if (!isReady || phase === "loading") {
    return <MyshopHomeSkeleton />;
  }

  if (phase === "dashboard") {
    return <SellerDashboard />;
  }

  return <SellLanding />;
}
