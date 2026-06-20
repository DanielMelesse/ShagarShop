"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useIsSeller } from "@/hooks/useIsSeller";

export function useSellerRegistrationComplete() {
  const { user, isReady, isSeller, checkingSeller } = useIsSeller();
  const [complete, setComplete] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isReady || checkingSeller) return;

    if (!user || !isSeller) {
      setComplete(null);
      return;
    }

    let cancelled = false;
    setComplete(null);

    fetch("/api/seller/register/status", { credentials: "same-origin" })
      .then(async (res) => {
        if (cancelled) return;
        if (!res.ok) {
          setComplete(false);
          return;
        }
        const data = await res.json();
        setComplete(Boolean(data.complete));
      })
      .catch(() => {
        if (!cancelled) setComplete(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user, isReady, isSeller, checkingSeller]);

  const checking =
    isReady && isSeller && !!user && (checkingSeller || complete === null);

  return { complete, checking };
}

export function useRequireSellerRegistration() {
  const router = useRouter();
  const { isSeller, checkingSeller, isReady } = useIsSeller();
  const { complete, checking } = useSellerRegistrationComplete();

  useEffect(() => {
    if (!isReady || checkingSeller || checking) return;
    if (isSeller && complete === false) {
      router.replace("/sell/register");
    }
  }, [isReady, checkingSeller, checking, isSeller, complete, router]);

  return { complete, checking: checking || checkingSeller || !isReady };
}
