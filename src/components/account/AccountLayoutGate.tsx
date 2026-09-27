"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { DELIVERY_HOME } from "@/lib/delivery-routes";
import { isDeliveryRole } from "@/lib/user-role";

function AccountPageSkeleton() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-zinc-200" />
      <div className="mt-8 grid gap-8 lg:grid-cols-[220px_1fr]">
        <div className="h-48 animate-pulse rounded-2xl bg-zinc-100" />
        <div className="h-64 animate-pulse rounded-2xl bg-zinc-100" />
      </div>
    </div>
  );
}

export function AccountLayoutGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isReady } = useAuth();

  useEffect(() => {
    if (!isReady) return;
    if (!user) {
      router.replace(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
      return;
    }
    // Couriers use the delivery portal — not buyer/seller account.
    if (isDeliveryRole(user.role)) {
      router.replace(DELIVERY_HOME);
    }
  }, [isReady, user, router, pathname]);

  if (!isReady || !user) {
    return <AccountPageSkeleton />;
  }

  if (isDeliveryRole(user.role)) {
    return <AccountPageSkeleton />;
  }

  return <>{children}</>;
}
