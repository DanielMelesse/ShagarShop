"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { isAdminRole, isDeliveryRole, isSellerRole } from "@/lib/user-role";

interface UseIsSellerOptions {
  /** When false, skip /api/seller/me (shop pages for buyers/couriers). */
  enabled?: boolean;
}

export function useIsSeller(options: UseIsSellerOptions = {}) {
  const { enabled = true } = options;
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

    // Known non-sellers — never call seller API from the header/shop shell.
    if (isDeliveryRole(user.role) || isAdminRole(user.role) || user.role === "BUYER") {
      setVerifiedSeller(false);
      return;
    }

    if (!enabled) {
      setVerifiedSeller(false);
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
  }, [user, isReady, enabled]);

  const isSeller =
    isReady && !!user && (isSellerRole(user.role) || verifiedSeller === true);

  const checkingSeller =
    enabled &&
    isReady &&
    !!user &&
    !isSellerRole(user.role) &&
    !isDeliveryRole(user.role) &&
    user.role !== "BUYER" &&
    !isAdminRole(user.role) &&
    verifiedSeller === null;

  return { user, isReady, isSeller, checkingSeller };
}
