"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useIsSeller } from "@/hooks/useIsSeller";
import { useSellerRegistrationComplete } from "@/hooks/useSellerRegistration";
import { SELLER_HOME } from "@/lib/seller-routes";
import { SellLanding } from "@/components/seller/SellLanding";
import { SellShopperPrompt } from "@/components/seller/SellShopperPrompt";

function SellPageSkeleton() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-zinc-200" />
      <div className="mt-4 h-4 w-64 animate-pulse rounded-lg bg-zinc-100" />
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-zinc-100" />
        ))}
      </div>
    </div>
  );
}

export function SellPageContent() {
  const router = useRouter();
  const { user, isReady, isSeller, checkingSeller } = useIsSeller();
  const { complete, checking } = useSellerRegistrationComplete();

  useEffect(() => {
    if (!isReady || checkingSeller || checking) return;
    if (isSeller && complete === false) {
      router.replace("/sell/register");
      return;
    }
    if (isSeller && complete) {
      router.replace(SELLER_HOME);
    }
  }, [isReady, checkingSeller, checking, isSeller, complete, router]);

  if (!isReady || checkingSeller || (isSeller && checking)) {
    return <SellPageSkeleton />;
  }

  if (isSeller && complete) {
    return <SellPageSkeleton />;
  }

  if (isSeller && user && complete === false) {
    return <SellPageSkeleton />;
  }

  if (user) {
    return <SellShopperPrompt userName={user.name} />;
  }

  return <SellLanding />;
}
