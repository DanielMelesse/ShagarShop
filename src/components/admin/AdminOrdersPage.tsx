"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminTable, EmptyState, Td, Th } from "@/components/admin/AdminTable";
import type { AdminOrderRow } from "@/lib/admin";
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
      description="All marketplace orders — track status across sellers and couriers."
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
              <Th>Status</Th>
              <Th className="text-right">Total</Th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-t border-zinc-100">
                <Td className="font-medium text-zinc-900">
                  #{order.id.slice(-8).toUpperCase()}
                </Td>
                <Td>
                  {new Date(order.createdAt).toLocaleDateString(undefined, {
                    dateStyle: "medium",
                  })}
                </Td>
                <Td>
                  <div>{order.buyerName ?? "Guest"}</div>
                  {order.buyerPhone && (
                    <div className="text-xs text-zinc-400">{order.buyerPhone}</div>
                  )}
                </Td>
                <Td>
                  {order.shippingName}
                  <div className="text-xs text-zinc-400">{order.city}</div>
                </Td>
                <Td>{order.itemCount}</Td>
                <Td>
                  <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700">
                    {order.fulfillmentSummary}
                  </span>
                </Td>
                <Td className="text-right font-semibold text-zinc-900">
                  {formatPrice(order.total)}
                </Td>
              </tr>
            ))}
          </tbody>
        </AdminTable>
      )}
    </AdminShell>
  );
}
