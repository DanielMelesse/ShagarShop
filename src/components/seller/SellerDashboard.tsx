"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { SellerOrderCard } from "@/components/seller/SellerOrderCard";
import { SellerPageHeader } from "@/components/seller/SellerPageHeader";
import { formatPrice } from "@/lib/products";
import {
  fetchSellerOrders,
  updateSellerOrderStatus,
} from "@/lib/seller-orders-client";
import type { FulfillmentStatus, SellerDashboardStats, SellerOrderLine } from "@/lib/seller-orders";
import { SELLER_ADD, SELLER_LISTINGS, SELLER_ORDERS } from "@/lib/seller-routes";

export function SellerDashboard() {
  const [stats, setStats] = useState<SellerDashboardStats | null>(null);
  const [orders, setOrders] = useState<SellerOrderLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const result = await fetchSellerOrders();
    if (!result.ok) {
      setMessage(result.error);
      setLoading(false);
      return;
    }
    setStats(result.stats);
    setOrders(result.orders);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleStatusChange(orderItemId: string, status: FulfillmentStatus) {
    setUpdatingId(orderItemId);
    setMessage("");
    const result = await updateSellerOrderStatus(orderItemId, status);
    setUpdatingId(null);

    if (!result.ok) {
      setMessage(result.error);
      return;
    }

    setOrders((prev) =>
      prev.map((o) => (o.id === orderItemId ? { ...o, fulfillmentStatus: status } : o)),
    );
    setStats((prev) => {
      if (!prev) return prev;
      const pendingDelta =
        status === "pending" ? 0 : orders.find((o) => o.id === orderItemId)?.fulfillmentStatus === "pending" ? -1 : 0;
      return { ...prev, pendingOrders: Math.max(0, prev.pendingOrders + pendingDelta) };
    });
    void load();
  }

  const recentOrders = orders.slice(0, 5);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <SellerPageHeader
        title="Overview"
        description="Track sales, fulfill orders, and manage your shop."
      />

      {message && (
        <p className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{message}</p>
      )}

      {loading ? (
        <div className="mt-8 h-40 animate-pulse rounded-2xl bg-zinc-100" />
      ) : (
        <>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {[
              { label: "Listings", value: stats?.listings ?? 0, href: SELLER_LISTINGS },
              { label: "Units in stock", value: stats?.unitsInStock ?? 0 },
              { label: "Featured", value: stats?.featured ?? 0 },
              { label: "Pending orders", value: stats?.pendingOrders ?? 0, href: SELLER_ORDERS },
              {
                label: "Total revenue",
                value: formatPrice(stats?.totalRevenue ?? 0),
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
              >
                <p className="text-sm text-zinc-500">{stat.label}</p>
                {"href" in stat && stat.href ? (
                  <Link
                    href={stat.href}
                    className="mt-1 block text-2xl font-bold text-brand-700 hover:text-brand-800"
                  >
                    {stat.value}
                  </Link>
                ) : (
                  <p className="mt-1 text-2xl font-bold text-zinc-900">{stat.value}</p>
                )}
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href={SELLER_ADD}
              className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
            >
              Add product
            </Link>
            <Link
              href={SELLER_LISTINGS}
              className="rounded-xl border border-zinc-300 px-5 py-2.5 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
            >
              Manage listings
            </Link>
            <Link
              href={SELLER_ORDERS}
              className="rounded-xl border border-zinc-300 px-5 py-2.5 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
            >
              View all orders
            </Link>
          </div>

          <section className="mt-12">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold text-zinc-900">Recent orders</h2>
              {orders.length > 5 && (
                <Link
                  href={SELLER_ORDERS}
                  className="text-sm font-medium text-brand-600 hover:text-brand-700"
                >
                  View all →
                </Link>
              )}
            </div>

            {recentOrders.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center">
                <p className="text-zinc-500">No orders yet.</p>
                <p className="mt-2 text-sm text-zinc-400">
                  When buyers purchase your products, orders will appear here.
                </p>
              </div>
            ) : (
              <ul className="mt-6 space-y-4">
                {recentOrders.map((order) => (
                  <li key={order.id}>
                    <SellerOrderCard
                      order={order}
                      compact
                      updatingId={updatingId}
                      onStatusChange={(id, status) => void handleStatusChange(id, status)}
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
