"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import type { AdminOverviewStats } from "@/lib/admin";
import {
  ADMIN_CUSTOMERS,
  ADMIN_DELIVERY,
  ADMIN_ORDERS,
  ADMIN_PRODUCTS,
  ADMIN_SELLERS,
} from "@/lib/admin-routes";
import { formatPrice } from "@/lib/products";

export function AdminDashboard() {
  const [stats, setStats] = useState<AdminOverviewStats | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats", { credentials: "same-origin" })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Could not load admin stats.");
          return;
        }
        setStats(data.stats);
      })
      .catch(() => setError("Could not load admin stats."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminShell
      title="Home"
      description="Platform overview — same core areas as Shopify Admin: sales, orders, catalog, people, and fulfillment."
    >
      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {loading || !stats ? (
        <div className="h-48 animate-pulse rounded-2xl bg-zinc-100" />
      ) : (
        <>
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Sales
            </h2>
            <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Total revenue" value={formatPrice(stats.revenueTotal)} />
              <StatCard label="Revenue today" value={formatPrice(stats.revenueToday)} />
              <StatCard
                label="Orders"
                value={String(stats.ordersTotal)}
                href={ADMIN_ORDERS}
              />
              <StatCard label="Orders today" value={String(stats.ordersToday)} href={ADMIN_ORDERS} />
            </div>
          </section>

          <section className="mt-10">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Needs attention
            </h2>
            <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                label="Pending fulfillment"
                value={String(stats.pendingFulfillment)}
                href={ADMIN_ORDERS}
                warn={stats.pendingFulfillment > 0}
              />
              <StatCard
                label="Unassigned deliveries"
                value={String(stats.unassignedDeliveries)}
                href={ADMIN_DELIVERY}
                warn={stats.unassignedDeliveries > 0}
              />
              <StatCard
                label="Low stock (≤5)"
                value={String(stats.lowStock)}
                href={ADMIN_PRODUCTS}
                warn={stats.lowStock > 0}
              />
              <StatCard
                label="Live products"
                value={String(stats.productsLive)}
                href={ADMIN_PRODUCTS}
              />
            </div>
          </section>

          <section className="mt-10">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
              People
            </h2>
            <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Customers" value={String(stats.buyers)} href={ADMIN_CUSTOMERS} />
              <StatCard label="Sellers" value={String(stats.sellers)} href={ADMIN_SELLERS} />
              <StatCard label="Couriers" value={String(stats.couriers)} href={ADMIN_DELIVERY} />
              <StatCard
                label="Active couriers"
                value={String(stats.activeCouriers)}
                href={ADMIN_DELIVERY}
              />
            </div>
          </section>
        </>
      )}
    </AdminShell>
  );
}

function StatCard({
  label,
  value,
  href,
  warn,
}: {
  label: string;
  value: string;
  href?: string;
  warn?: boolean;
}) {
  const content = (
    <>
      <p className="text-sm text-zinc-500">{label}</p>
      <p
        className={`mt-2 text-2xl font-bold ${
          warn ? "text-amber-700" : "text-zinc-900"
        }`}
      >
        {value}
      </p>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-zinc-300 hover:shadow"
      >
        {content}
      </Link>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      {content}
    </div>
  );
}
