"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AccountShell } from "@/components/account/AccountShell";
import { formatPrice } from "@/lib/products";
import { TODAYS_DEALS_HREF } from "@/lib/shop-routes";

interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
  priceAtPurchase: number;
}

interface Order {
  id: string;
  status: string;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  shippingName: string;
  address: string;
  city: string;
  zip: string;
  createdAt: string;
  items: OrderItem[];
}

export function AccountOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/orders", { credentials: "same-origin" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.orders) setOrders(data.orders);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <AccountShell
      title="Your orders"
      description="Track purchases and order totals."
    >
      {loading ? (
        <div className="h-48 animate-pulse rounded-2xl bg-zinc-100" />
      ) : orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center">
          <p className="text-zinc-500">You have no orders yet.</p>
          <Link
            href={TODAYS_DEALS_HREF}
            className="mt-4 inline-block rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white"
          >
            Start shopping
          </Link>
        </div>
      ) : (
        <ul className="space-y-6">
          {orders.map((order) => (
            <li
              key={order.id}
              className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm text-zinc-500">
                    {new Date(order.createdAt).toLocaleDateString("en-US", {
                      dateStyle: "medium",
                    })}
                  </p>
                  <p className="mt-1 font-semibold text-zinc-900">
                    Order #{order.id.slice(-8).toUpperCase()}
                  </p>
                  <p className="text-sm capitalize text-brand-700">{order.status}</p>
                </div>
                <p className="text-lg font-bold text-zinc-900">
                  {formatPrice(order.total)}
                </p>
              </div>
              <ul className="mt-4 space-y-2 border-t border-zinc-100 pt-4 text-sm">
                {order.items.map((item) => (
                  <li key={item.id} className="flex justify-between gap-4">
                    <span className="text-zinc-700">
                      {item.productName} × {item.quantity}
                    </span>
                    <span className="shrink-0 text-zinc-900">
                      {formatPrice(item.priceAtPurchase * item.quantity)}
                    </span>
                  </li>
                ))}
              </ul>
              <dl className="mt-4 border-t border-zinc-100 pt-4 text-sm">
                <div className="flex justify-between font-semibold text-zinc-900">
                  <dt>Total</dt>
                  <dd>{formatPrice(order.total)}</dd>
                </div>
              </dl>
              <p className="mt-3 text-xs text-zinc-500">
                Ship to: {order.shippingName}, {order.address}, {order.city}{" "}
                {order.zip}
              </p>
            </li>
          ))}
        </ul>
      )}
    </AccountShell>
  );
}
