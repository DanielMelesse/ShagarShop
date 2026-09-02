"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  DELIVERY_AVAILABLE,
  DELIVERY_HOME,
  DELIVERY_MINE,
  DELIVERY_SCAN,
} from "@/lib/delivery-routes";

const links = [
  { href: DELIVERY_HOME, label: "Overview" },
  { href: DELIVERY_AVAILABLE, label: "Available" },
  { href: DELIVERY_MINE, label: "My deliveries" },
  { href: DELIVERY_SCAN, label: "Scan" },
] as const;

export function DeliveryNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Delivery" className="flex flex-wrap gap-2">
      {links.map((link) => {
        const active =
          link.href === DELIVERY_HOME
            ? pathname === DELIVERY_HOME
            : pathname === link.href || pathname.startsWith(`${link.href}/`);

        return (
          <Link
            key={link.href}
            href={link.href}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
              active
                ? "bg-brand-600 text-white"
                : "bg-white text-zinc-600 ring-1 ring-zinc-200 hover:bg-zinc-50"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
