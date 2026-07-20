"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminTable, EmptyState, Td, Th } from "@/components/admin/AdminTable";
import type { AdminOrderRow } from "@/lib/admin";
import { adminOrderHref } from "@/lib/admin-routes";
import { formatPrice } from "@/lib/products";

export function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/orders", { credentials: "same-origin" })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Could not load orders.");
          return;
        }
        setOrders(data.orders ?? []);
      })
      .catch(() => setError("Could not load orders."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminShell
      title="Orders"
      description="All marketplace orders — click an order for buyer, seller, courier, and payment details."
    >
      {error && (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}
      {loading ? (
        <div className="h-48 animate-pulse rounded-2xl bg-zinc-100" />
      ) : orders.length === 0 ? (
        <EmptyState message="No orders yet." />
      ) : (
        <AdminTable>
          <thead>
            <tr>
              <Th>Order</Th>
              <Th>Date</Th>
              <Th>Customer</Th>
              <Th>Ship to</Th>
              <Th>Items</Th>
              <Th>Delivery</Th>
              <Th>Status</Th>
              <Th className="text-right">Total</Th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr
                key={order.id}
                className="border-t border-zinc-100 transition hover:bg-zinc-50"
              >
                <Td className="font-medium text-zinc-900">
                  <Link
                    href={adminOrderHref(order.id)}
                    className="text-brand-700 hover:underline"
                  >
                    #{order.id.slice(-8).toUpperCase()}
                  </Link>
                </Td>
                <Td>
                  <Link
                    href={adminOrderHref(order.id)}
                    className="block text-zinc-600"
                  >
                    {new Date(order.createdAt).toLocaleDateString(undefined, {
                      dateStyle: "medium",
                    })}
                  </Link>
                </Td>
                <Td>
                  <Link href={adminOrderHref(order.id)} className="block">
                    <div>{order.buyerName ?? "Guest"}</div>
                    {order.buyerPhone && (
                      <div className="text-xs text-zinc-400">{order.buyerPhone}</div>
                    )}
                  </Link>
                </Td>
                <Td>
                  <Link href={adminOrderHref(order.id)} className="block">
                    {order.shippingName}
                    <div className="text-xs text-zinc-400">{order.city}</div>
                  </Link>
                </Td>
                <Td>
                  <Link href={adminOrderHref(order.id)} className="block">
                    {order.itemCount}
                  </Link>
                </Td>
                <Td>
                  <Link href={adminOrderHref(order.id)} className="block">
                    {formatPrice(order.shipping)}
                  </Link>
                </Td>
                <Td>
                  <Link href={adminOrderHref(order.id)} className="block">
                    <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700">
                      {order.fulfillmentSummary}
                    </span>
                  </Link>
                </Td>
                <Td className="text-right font-semibold text-zinc-900">
                  <Link href={adminOrderHref(order.id)} className="block">
                    {formatPrice(order.total)}
                  </Link>
                </Td>
              </tr>
            ))}
          </tbody>
        </AdminTable>
      )}
    </AdminShell>
  );
}
