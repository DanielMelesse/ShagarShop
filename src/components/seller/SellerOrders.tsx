"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { SellerOrderCard } from "@/components/seller/SellerOrderCard";
import { SellerPageHeader } from "@/components/seller/SellerPageHeader";
import {
  fetchSellerOrders,
  updateSellerOrderStatus,
} from "@/lib/seller-orders-client";
import {
  FULFILLMENT_STATUSES,
  FULFILLMENT_STATUS_LABELS,
  type FulfillmentStatus,
  type SellerOrderLine,
} from "@/lib/seller-orders";

type OrderFilter = "all" | FulfillmentStatus;

export function SellerOrders() {
  const [orders, setOrders] = useState<SellerOrderLine[]>([]);
  const [filter, setFilter] = useState<OrderFilter>("all");
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
    setOrders(result.orders);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    if (filter === "all") return orders;
    return orders.filter((o) => o.fulfillmentStatus === filter);
  }, [orders, filter]);

  const counts = useMemo(() => {
    const tally: Record<OrderFilter, number> = {
      all: orders.length,
      pending: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    };
    for (const order of orders) {
      tally[order.fulfillmentStatus] += 1;
    }
    return tally;
  }, [orders]);

  async function handleStatusChange(
    orderItemId: string,
    status: FulfillmentStatus,
    trackingCode?: string,
  ) {
    setUpdatingId(orderItemId);
    setMessage("");
    const result = await updateSellerOrderStatus(orderItemId, status, trackingCode);
    setUpdatingId(null);

    if (!result.ok) {
      setMessage(result.error);
      return;
    }

    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderItemId
          ? {
              ...o,
              fulfillmentStatus: status,
              trackingCode: result.order.trackingCode,
              shopName: result.order.shopName ?? o.shopName,
            }
          : o,
      ),
    );
  }

  const filterOptions: { id: OrderFilter; label: string }[] = [
    { id: "all", label: "All" },
    ...FULFILLMENT_STATUSES.map((id) => ({
      id,
      label: FULFILLMENT_STATUS_LABELS[id],
    })),
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <SellerPageHeader
        title="Orders"
        description="Fulfill buyer orders and update shipping status."
      />

      {message && (
        <p className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{message}</p>
      )}

      <div className="mt-8 flex flex-wrap gap-2">
        {filterOptions.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => setFilter(option.id)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              filter === option.id
                ? "bg-zinc-900 text-white"
                : "bg-white text-zinc-600 ring-1 ring-zinc-200 hover:bg-zinc-50"
            }`}
          >
            {option.label}
            <span className="ml-1.5 text-xs opacity-70">({counts[option.id]})</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="mt-8 h-40 animate-pulse rounded-2xl bg-zinc-100" />
      ) : filtered.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center">
          <p className="text-zinc-500">
            {filter === "all" ? "No orders yet." : `No ${filter} orders.`}
          </p>
        </div>
      ) : (
        <ul className="mt-8 space-y-4">
          {filtered.map((order) => (
            <li key={order.id}>
              <SellerOrderCard
                order={order}
                updatingId={updatingId}
                onStatusChange={(id, status, code) =>
                  void handleStatusChange(id, status, code)
                }
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
