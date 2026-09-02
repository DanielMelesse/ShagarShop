"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ADMIN_CUSTOMERS,
  ADMIN_DELIVERY,
  ADMIN_HOME,
  ADMIN_ORDERS,
  ADMIN_PRODUCTS,
  ADMIN_SCAN,
  ADMIN_SELLERS,
} from "@/lib/admin-routes";

/** Shopify-style primary nav: Home → Orders → Products → Customers + marketplace ops */
const links = [
  { href: ADMIN_HOME, label: "Home" },
  { href: ADMIN_ORDERS, label: "Orders" },
  { href: ADMIN_SCAN, label: "Scan" },
  { href: ADMIN_PRODUCTS, label: "Products" },
  { href: ADMIN_CUSTOMERS, label: "Customers" },
  { href: ADMIN_SELLERS, label: "Sellers" },
  { href: ADMIN_DELIVERY, label: "Delivery" },
] as const;

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Admin"
      className="flex flex-wrap gap-1 border-b border-zinc-200 pb-3"
    >
      {links.map((link) => {
        const active =
          link.href === ADMIN_HOME
            ? pathname === ADMIN_HOME
            : pathname === link.href || pathname.startsWith(`${link.href}/`);

        return (
          <Link
            key={link.href}
            href={link.href}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
              active
                ? "bg-zinc-900 text-white"
                : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
