"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { categories } from "@/lib/products";
import { infoNavLinks } from "@/lib/nav";
import type { Category } from "@/lib/types";
import { useAuth } from "@/hooks/useAuth";
import { useMounted } from "@/hooks/useMounted";
import { isSellerRole } from "@/lib/user-role";

function linkClass(active: boolean) {
  return `whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition ${
    active
      ? "bg-brand-600 text-white"
      : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900"
  }`;
}

function CategoryLinks({
  pathname,
  category,
  featured,
  showActive,
  sellerMode,
}: {
  pathname: string;
  category: Category | null;
  featured: boolean;
  showActive: boolean;
  sellerMode: boolean;
}) {
  return (
    <nav aria-label="Categories" className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 py-2.5 sm:px-6">
        {!sellerMode && (
          <>
            <Link
              href="/shop?featured=1"
              className={linkClass(showActive && featured)}
            >
              Today&apos;s Deals
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/shop?category=${cat.id}`}
                className={linkClass(showActive && !featured && category === cat.id)}
              >
                {cat.label}
              </Link>
            ))}
          </>
        )}
        {infoNavLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={linkClass(showActive && pathname === link.href)}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

function CategoryBarInner() {
  const mounted = useMounted();
  const { user, isReady: authReady } = useAuth();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const sellerMode =
    (mounted && authReady && isSellerRole(user?.role)) || pathname === "/sell";

  if (sellerMode) {
    return null;
  }

  const rawCategory = searchParams.get("category");
  const onShop = pathname === "/shop";
  const category =
    onShop && categories.some((c) => c.id === rawCategory)
      ? (rawCategory as Category)
      : null;
  const featured = onShop && searchParams.get("featured") === "1";

  return (
    <CategoryLinks
      pathname={pathname}
      category={category}
      featured={featured}
      showActive={mounted}
      sellerMode={sellerMode}
    />
  );
}

function CategoryBarFallback() {
  return (
    <CategoryLinks
      pathname=""
      category={null}
      featured={false}
      showActive={false}
      sellerMode={false}
    />
  );
}

export function CategoryBar() {
  return (
    <Suspense fallback={<CategoryBarFallback />}>
      <CategoryBarInner />
    </Suspense>
  );
}
