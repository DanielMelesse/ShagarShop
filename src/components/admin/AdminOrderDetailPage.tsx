"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { ProductImage } from "@/components/ProductImage";
import type { AdminOrderDetail } from "@/lib/admin";
import { ADMIN_ORDERS } from "@/lib/admin-routes";
import { getFulfillmentStatusStyle } from "@/lib/order-status";
import { formatPrice } from "@/lib/products";
import {
  DELIVERY_VEHICLE_LABELS,
  isDeliveryVehicleType,
} from "@/lib/delivery";

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function AdminOrderDetailPage({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<AdminOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/admin/orders/${orderId}`, { credentials: "same-origin" })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Could not load order.");
          return;
        }
        setOrder(data.order);
      })
      .catch(() => setError("Could not load order."))
      .finally(() => setLoading(false));
  }, [orderId]);

  return (
    <AdminShell
      title={
        order
          ? `Order #${order.id.slice(-8).toUpperCase()}`
          : "Order details"
      }
      description="Full order record — buyer, sellers, courier, timeline, and payment breakdown."
    >
      <p className="mb-6">
        <Link
          href={ADMIN_ORDERS}
          className="text-sm font-medium text-brand-700 hover:underline"
        >
          ← Back to orders
        </Link>
      </p>

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {loading || !order ? (
        !error && <div className="h-64 animate-pulse rounded-2xl bg-zinc-100" />
      ) : (
        <div className="space-y-8">
          <section className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-xl font-bold text-zinc-900">
                  #{order.id.slice(-8).toUpperCase()}
                </h2>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${getFulfillmentStatusStyle(order.fulfillmentStatus)}`}
                >
                  {order.fulfillmentSummary}
                </span>
              </div>
              <p className="mt-2 text-sm text-zinc-500">
                Placed {formatDateTime(order.createdAt)}
              </p>
              <p className="mt-1 font-mono text-xs text-zinc-400">{order.id}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-zinc-500">Order total</p>
              <p className="text-2xl font-bold text-zinc-900">
                {formatPrice(order.total)}
              </p>
            </div>
          </section>

          <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Timeline
            </h3>
            <ol className="mt-4 space-y-4">
              {order.timeline.map((step, index) => (
                <li key={step.key} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span
                      className={`mt-1 h-3 w-3 rounded-full ${
                        step.done ? "bg-brand-600" : "bg-zinc-300"
                      }`}
                    />
                    {index < order.timeline.length - 1 && (
                      <span
                        className={`mt-1 w-px flex-1 ${
                          step.done ? "bg-brand-200" : "bg-zinc-200"
                        }`}
                      />
                    )}
                  </div>
                  <div className="pb-2">
                    <p
                      className={`text-sm font-medium ${
                        step.done ? "text-zinc-900" : "text-zinc-400"
                      }`}
                    >
                      {step.label}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {formatDateTime(step.at)}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <div className="grid gap-6 lg:grid-cols-3">
            <aside className="space-y-6 lg:col-span-1">
              <InfoCard title="Customer">
                {order.buyer ? (
                  <>
                    <p className="font-medium text-zinc-900">{order.buyer.name}</p>
                    <p className="mt-1 text-sm text-zinc-600">{order.buyer.phone}</p>
                    {order.buyer.email && (
                      <p className="text-sm text-zinc-500">{order.buyer.email}</p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-zinc-500">Guest checkout</p>
                )}
              </InfoCard>

              <InfoCard title="Shipping address">
                <p className="font-medium text-zinc-900">{order.shippingName}</p>
                <p className="mt-1 text-sm text-zinc-600">
                  {order.address}
                  <br />
                  {order.city} {order.zip}
                </p>
              </InfoCard>

              <InfoCard title="Payment summary">
                <dl className="space-y-2 text-sm">
                  <Row label="Subtotal" value={formatPrice(order.subtotal)} />
                  <Row label="Delivery charged" value={formatPrice(order.shipping)} />
                  <Row
                    label="Courier payout (one stop)"
                    value={formatPrice(order.courierPayout)}
                  />
                  <Row
                    label="ShegerShop margin"
                    value={formatPrice(order.platformDeliveryMargin)}
                  />
                  <Row
                    label="Seller commission"
                    value={formatPrice(order.platformCommission)}
                  />
                  <Row
                    label="Platform total"
                    value={formatPrice(
                      Math.round(
                        (order.platformDeliveryMargin + order.platformCommission) *
                          100,
                      ) / 100,
                    )}
                    strong
                  />
                  <p className="pt-1 text-xs text-zinc-400">
                    Shipping: 200 Birr per item (+ size extras). One shop, 4+
                    items: base capped at 3×200. One shop, 6+ items: +50 per
                    item. Courier: one shop → 70% of stop fee.
                  </p>
                  {order.tax > 0 && (
                    <Row label="Tax" value={formatPrice(order.tax)} />
                  )}
                  <div className="border-t border-zinc-100 pt-2">
                    <Row
                      label="Total"
                      value={formatPrice(order.total)}
                      strong
                    />
                  </div>
                </dl>
                <p className="mt-3 text-xs text-zinc-400">
                  Payment method: Demo card (no live charge)
                </p>
              </InfoCard>
            </aside>

            <section className="space-y-4 lg:col-span-2">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
                Line items ({order.items.length})
              </h3>
              {order.items.map((item) => (
                <article
                  key={item.id}
                  className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex gap-4">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-zinc-100">
                      <ProductImage
                        src={item.productImage}
                        alt={item.productName}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-zinc-900">
                            {item.productName}
                          </p>
                          <p className="mt-1 text-sm text-zinc-500">
                            Qty {item.quantity} · {formatPrice(item.unitPrice)}{" "}
                            each
                          </p>
                        </div>
                        <div className="text-right">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getFulfillmentStatusStyle(item.fulfillmentStatus)}`}
                          >
                            {item.fulfillmentLabel}
                          </span>
                          <p className="mt-2 font-semibold text-zinc-900">
                            {formatPrice(item.lineTotal)}
                          </p>
                          <p className="mt-1 text-xs text-zinc-500">
                            Fee {formatPrice(item.commissionAmount)} · seller{" "}
                            {formatPrice(item.sellerEarnings)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-xl bg-zinc-50 px-3 py-3 text-sm">
                          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                            Seller
                          </p>
                          {item.seller ? (
                            <>
                              <p className="mt-1 font-medium text-zinc-900">
                                {item.seller.shopName ?? item.seller.name}
                              </p>
                              {item.seller.shopName && (
                                <p className="text-zinc-600">{item.seller.name}</p>
                              )}
                              <p className="text-zinc-500">{item.seller.phone}</p>
                            </>
                          ) : (
                            <p className="mt-1 text-zinc-500">Unassigned</p>
                          )}
                        </div>

                        <div className="rounded-xl bg-zinc-50 px-3 py-3 text-sm">
                          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                            Delivery person
                          </p>
                          {item.courier ? (
                            <>
                              <p className="mt-1 font-medium text-zinc-900">
                                {item.courier.name}
                              </p>
                              <p className="text-zinc-500">{item.courier.phone}</p>
                              {(item.courier.vehicleType ||
                                item.courier.serviceArea) && (
                                <p className="mt-1 text-xs text-zinc-500">
                                  {item.courier.vehicleType &&
                                  isDeliveryVehicleType(item.courier.vehicleType)
                                    ? DELIVERY_VEHICLE_LABELS[item.courier.vehicleType]
                                    : item.courier.vehicleType}
                                  {item.courier.serviceArea
                                    ? ` · ${item.courier.serviceArea}`
                                    : ""}
                                </p>
                              )}
                            </>
                          ) : (
                            <p className="mt-1 text-zinc-500">
                              Not claimed yet
                            </p>
                          )}
                        </div>
                      </div>

                      <dl className="mt-3 grid gap-2 text-xs text-zinc-500 sm:grid-cols-2">
                        <div>
                          <dt className="inline font-medium text-zinc-600">
                            Assigned:{" "}
                          </dt>
                          <dd className="inline">
                            {formatDateTime(item.deliveryAssignedAt)}
                          </dd>
                        </div>
                        <div>
                          <dt className="inline font-medium text-zinc-600">
                            Delivered:{" "}
                          </dt>
                          <dd className="inline">
                            {formatDateTime(item.deliveredAt)}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                </article>
              ))}
            </section>
          </div>
        </div>
      )}
    </AdminShell>
  );
}

function InfoCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
        {title}
      </h3>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function Row({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex justify-between gap-4">
      <dt className={strong ? "font-semibold text-zinc-900" : "text-zinc-500"}>
        {label}
      </dt>
      <dd
        className={
          strong ? "font-bold text-zinc-900" : "font-medium text-zinc-800"
        }
      >
        {value}
      </dd>
    </div>
  );
}
