"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SELLER_ADD,
  SELLER_EARNINGS,
  SELLER_HOME,
  SELLER_LISTINGS,
  SELLER_ORDERS,
} from "@/lib/seller-routes";

const tabs = [
  { href: SELLER_HOME, label: "Overview" },
  { href: SELLER_LISTINGS, label: "Listings" },
  { href: SELLER_ORDERS, label: "Orders" },
  { href: SELLER_EARNINGS, label: "Earnings" },
] as const;

export function SellerNav() {
  const pathname = usePathname();

  return (
    <nav
      className="mt-6 flex flex-wrap gap-2 border-b border-zinc-200 pb-4"
      aria-label="Seller dashboard"
    >
      {tabs.map((tab) => {
        const active =
          tab.href === SELLER_HOME
            ? pathname === SELLER_HOME
            : pathname === tab.href || pathname.startsWith(`${tab.href}/`);

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              active
                ? "bg-brand-600 text-white"
                : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
      <Link
        href={SELLER_ADD}
        className="ml-auto rounded-lg border border-brand-600 px-4 py-2 text-sm font-semibold text-brand-700 transition hover:bg-brand-50"
      >
        + Add product
      </Link>
    </nav>
  );
}
