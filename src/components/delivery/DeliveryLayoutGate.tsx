"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { isDeliveryRole } from "@/lib/user-role";
import { DELIVERY_REGISTER } from "@/lib/delivery-routes";

function DeliveryPageSkeleton() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-zinc-200" />
      <div className="mt-4 h-4 w-64 animate-pulse rounded-lg bg-zinc-100" />
      <div className="mt-8 h-64 animate-pulse rounded-2xl bg-zinc-100" />
    </div>
  );
}

export function DeliveryLayoutGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isReady } = useAuth();

  useEffect(() => {
    if (!isReady) return;

    if (!user) {
      router.replace(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
      return;
    }

    if (!isDeliveryRole(user.role)) {
      router.replace(DELIVERY_REGISTER);
    }
  }, [isReady, user, router, pathname]);

  if (!isReady || !user || !isDeliveryRole(user.role)) {
    return <DeliveryPageSkeleton />;
  }

  return <>{children}</>;
}
