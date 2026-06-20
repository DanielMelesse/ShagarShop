"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import {
  ALL_DEPARTMENTS_HREF,
  ALL_DEPARTMENTS_LABEL,
} from "@/lib/departments";
import { useAuth } from "@/hooks/useAuth";
import { useIsSeller } from "@/hooks/useIsSeller";
import { useMounted } from "@/hooks/useMounted";

const navLinkClass =
  "whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-900";

const navLinkActiveClass =
  "whitespace-nowrap rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white";

function HeaderNavInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const mounted = useMounted();
  const { isReady: authReady } = useAuth();
  const { isSeller } = useIsSeller();

  const sellerMode =
    (mounted && authReady && isSeller) || pathname.startsWith("/sell");

  if (sellerMode) {
    return null;
  }

  const featured = searchParams.get("featured") === "1";
  const allDepartmentsActive =
    mounted &&
    (pathname === ALL_DEPARTMENTS_HREF || pathname.startsWith("/shop/department/"));
  const dealsActive = mounted && pathname === "/shop" && featured;

  return (
    <nav
      aria-label="Shop"
      className="border-b border-zinc-200 bg-white shadow-sm shadow-zinc-900/5"
    >
      <div className="mx-auto flex max-w-7xl items-center gap-1 px-4 py-2 sm:gap-2 sm:px-6">
        <Link
          href={ALL_DEPARTMENTS_HREF}
          className={allDepartmentsActive ? navLinkActiveClass : navLinkClass}
        >
          {ALL_DEPARTMENTS_LABEL}
        </Link>

        <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto sm:gap-2">
          <Link
            href="/shop?featured=1"
            className={dealsActive ? navLinkActiveClass : navLinkClass}
          >
            Today&apos;s Deals
          </Link>

          <Link
            href="/sell"
            className={pathname.startsWith("/sell") ? navLinkActiveClass : navLinkClass}
          >
            Seller
          </Link>

          <Link
            href="/customer-service"
            className={
              pathname === "/customer-service" ? navLinkActiveClass : navLinkClass
            }
          >
            Customer Service
          </Link>
        </div>
      </div>
    </nav>
  );
}

function HeaderNavFallback() {
  return (
    <nav
      aria-label="Shop"
      className="border-b border-zinc-200 bg-white shadow-sm shadow-zinc-900/5"
    >
      <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-2 sm:px-6">
        <span className={navLinkClass}>{ALL_DEPARTMENTS_LABEL}</span>
        <span className={navLinkClass}>Today&apos;s Deals</span>
        <span className={navLinkClass}>Seller</span>
        <span className={navLinkClass}>Customer Service</span>
      </div>
    </nav>
  );
}

export function HeaderNav() {
  return (
    <Suspense fallback={<HeaderNavFallback />}>
      <HeaderNavInner />
    </Suspense>
  );
}
