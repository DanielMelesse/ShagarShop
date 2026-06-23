"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
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
  total: number;
  shippingName: string;
  address: string;
  city: string;
  zip: string;
  createdAt: string;
  items: OrderItem[];
}

export default function OrdersPage() {
  const router = useRouter();
  const { user, isReady } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isReady) return;
    if (!user) {
      router.replace("/login");
      return;
    }

    fetch("/api/orders")
      .then((res) => {
        if (res.status === 401) {
          router.replace("/login");
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data?.orders) setOrders(data.orders);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [isReady, user, router]);

  if (!isReady || loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-zinc-200" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h2 className="text-2xl font-bold text-zinc-900">Your orders</h2>
      <p className="mt-1 text-sm text-zinc-500">
        Signed in as {user?.phone}
        {user?.email ? ` · ${user.email}` : ""}
      </p>

      {orders.length === 0 ? (
        <div className="mt-12 text-center">
          <p className="text-zinc-500">You have no orders yet.</p>
          <Link
            href={TODAYS_DEALS_HREF}
            className="mt-4 inline-block rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white"
          >
            Start shopping
          </Link>
        </div>
      ) : (
        <ul className="mt-8 space-y-6">
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
              <p className="mt-3 text-xs text-zinc-500">
                Ship to: {order.shippingName}, {order.address}, {order.city}{" "}
                {order.zip}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
