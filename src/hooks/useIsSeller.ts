"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { isSellerRole } from "@/lib/user-role";

export function useIsSeller() {
  const { user, isReady } = useAuth();
  const [verifiedSeller, setVerifiedSeller] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isReady) return;

    if (!user) {
      setVerifiedSeller(false);
      return;
    }

    if (isSellerRole(user.role)) {
      setVerifiedSeller(true);
      return;
    }

    let cancelled = false;
    setVerifiedSeller(null);

    fetch("/api/seller/me", { credentials: "same-origin" })
      .then((res) => {
        if (!cancelled) setVerifiedSeller(res.ok);
      })
      .catch(() => {
        if (!cancelled) setVerifiedSeller(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user, isReady]);

  const isSeller =
    isReady && !!user && (isSellerRole(user.role) || verifiedSeller === true);

  const checkingSeller =
    isReady && !!user && !isSellerRole(user.role) && verifiedSeller === null;

  return { user, isReady, isSeller, checkingSeller };
}
