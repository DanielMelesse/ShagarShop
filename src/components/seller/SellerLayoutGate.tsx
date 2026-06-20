"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useIsSeller } from "@/hooks/useIsSeller";
import { useSellerRegistrationComplete } from "@/hooks/useSellerRegistration";

function SellerPageSkeleton() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-zinc-200" />
      <div className="mt-4 h-4 w-64 animate-pulse rounded-lg bg-zinc-100" />
      <div className="mt-8 h-64 animate-pulse rounded-2xl bg-zinc-100" />
    </div>
  );
}

export function SellerLayoutGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isReady } = useAuth();
  const { isSeller, checkingSeller } = useIsSeller();
  const { complete, checking } = useSellerRegistrationComplete();

  useEffect(() => {
    if (!isReady || checkingSeller || checking) return;

    if (!user) {
      router.replace(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
      return;
    }

    if (!isSeller) {
      router.replace("/sell");
      return;
    }

    if (complete === false) {
      router.replace("/sell/register");
    }
  }, [isReady, checkingSeller, checking, user, isSeller, complete, router, pathname]);

  if (!isReady || checkingSeller || checking || !user || !isSeller || complete !== true) {
    return <SellerPageSkeleton />;
  }

  return <>{children}</>;
}
