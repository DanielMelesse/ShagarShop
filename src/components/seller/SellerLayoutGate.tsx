"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { SELL_LANDING, SELLER_REGISTER } from "@/lib/seller-routes";
import { isSellerRole } from "@/lib/user-role";

function SellerPageSkeleton() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-zinc-200" />
      <div className="mt-4 h-4 w-64 animate-pulse rounded-lg bg-zinc-100" />
      <div className="mt-8 h-64 animate-pulse rounded-2xl bg-zinc-100" />
    </div>
  );
}

/** Cookie session — avoids hanging SessionProvider.update(). */
async function fetchSessionRole(timeoutMs = 2500): Promise<string | undefined> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetch("/api/auth/session", {
      cache: "no-store",
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return undefined;
    const data = (await res.json()) as { user?: { role?: string } };
    return data?.user?.role;
  } catch {
    return undefined;
  }
}

export function SellerLayoutGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isReady, isAuthenticated, refreshSession } = useAuth();
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const retried = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function gate() {
      if (!isReady) return;

      if (!isAuthenticated || !user) {
        if (!cancelled) {
          setChecking(false);
          setAllowed(false);
          router.replace(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
        }
        return;
      }

      let sellerRole = isSellerRole(user.role);

      if (!sellerRole && !retried.current) {
        retried.current = true;
        const cookieRole = await fetchSessionRole();
        if (cancelled) return;
        if (isSellerRole(cookieRole)) {
          void refreshSession().catch(() => undefined);
          sellerRole = true;
        }
      }

      if (!sellerRole) {
        if (!cancelled) {
          setChecking(false);
          setAllowed(false);
          router.replace(SELL_LANDING);
        }
        return;
      }

      try {
        const res = await fetch("/api/seller/me", { credentials: "same-origin" });
        if (cancelled) return;

        if (!res.ok) {
          setChecking(false);
          setAllowed(false);
          router.replace(SELL_LANDING);
          return;
        }

        const data = (await res.json()) as { registrationComplete?: boolean };
        if (!data.registrationComplete) {
          setChecking(false);
          setAllowed(false);
          router.replace(SELLER_REGISTER);
          return;
        }

        setAllowed(true);
        setChecking(false);
      } catch {
        if (!cancelled) {
          setChecking(false);
          setAllowed(false);
          router.replace(SELL_LANDING);
        }
      }
    }

    void gate();
    return () => {
      cancelled = true;
    };
  }, [isReady, isAuthenticated, user, user?.role, router, pathname, refreshSession]);

  if (!isReady || checking || !allowed) {
    return <SellerPageSkeleton />;
  }

  return <>{children}</>;
}
