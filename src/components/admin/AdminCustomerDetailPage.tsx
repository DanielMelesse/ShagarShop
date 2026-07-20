"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminTable, EmptyState, Td, Th } from "@/components/admin/AdminTable";
import type { AdminCustomerDetail } from "@/lib/admin";
import {
  ADMIN_CUSTOMERS,
  adminCourierHref,
  adminOrderHref,
  adminSellerHref,
} from "@/lib/admin-routes";
import { formatPrice } from "@/lib/products";

export function AdminCustomerDetailPage({ customerId }: { customerId: string }) {
  const [customer, setCustomer] = useState<AdminCustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/admin/customers/${customerId}`, { credentials: "same-origin" })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Could not load customer.");
          return;
        }
        setCustomer(data.customer);
      })
      .catch(() => setError("Could not load customer."))
      .finally(() => setLoading(false));
  }, [customerId]);

  return (
    <AdminShell
      title={customer?.name ?? "Customer details"}
      description="Account profile, spend, and order history."
    >
      <p className="mb-6">
        <Link
          href={ADMIN_CUSTOMERS}
          className="text-sm font-medium text-brand-700 hover:underline"
        >
          ← Back to customers
        </Link>
      </p>

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {loading || !customer ? (
        !error && <div className="h-64 animate-pulse rounded-2xl bg-zinc-100" />
      ) : (
        <div className="space-y-8">
          <section className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold text-zinc-900">{customer.name}</h2>
                <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700">
                  {customer.role}
                </span>
              </div>
              <p className="mt-2 text-sm text-zinc-600">{customer.phone}</p>
              {customer.email && (
                <p className="text-sm text-zinc-500">{customer.email}</p>
              )}
              <p className="mt-2 text-xs text-zinc-400">
                Joined{" "}
                {new Date(customer.createdAt).toLocaleDateString(undefined, {
                  dateStyle: "medium",
                })}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 text-right">
              <div>
                <p className="text-sm text-zinc-500">Orders</p>
                <p className="text-2xl font-bold text-zinc-900">
                  {customer.orderCount}
                </p>
              </div>
              <div>
                <p className="text-sm text-zinc-500">Total spent</p>
                <p className="text-2xl font-bold text-zinc-900">
                  {formatPrice(customer.totalSpent)}
                </p>
              </div>
            </div>
          </section>

          {(customer.sellerProfile || customer.deliveryProfile) && (
            <section className="grid gap-4 sm:grid-cols-2">
              {customer.sellerProfile && (
                <Link
                  href={adminSellerHref(customer.sellerProfile.id)}
                  className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-zinc-300"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    Seller shop
                  </p>
                  <p className="mt-2 font-semibold text-zinc-900">
                    {customer.sellerProfile.shopName}
                  </p>
                  <p className="mt-1 text-sm capitalize text-zinc-500">
                    {customer.sellerProfile.category} · {customer.sellerProfile.location}
                  </p>
                </Link>
              )}
              {customer.deliveryProfile && (
                <Link
                  href={adminCourierHref(customer.deliveryProfile.id)}
                  className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-zinc-300"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    Delivery profile
                  </p>
                  <p className="mt-2 font-semibold text-zinc-900">
                    {customer.deliveryProfile.serviceArea}
                  </p>
                  <p className="mt-1 text-sm text-zinc-500">
                    {customer.deliveryProfile.vehicleType} ·{" "}
                    {customer.deliveryProfile.active ? "Active" : "Inactive"}
                  </p>
                </Link>
              )}
            </section>
          )}

          <section>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Recent orders
            </h3>
            {customer.recentOrders.length === 0 ? (
              <div className="mt-4">
                <EmptyState message="No orders for this customer." />
              </div>
            ) : (
              <div className="mt-4">
                <AdminTable>
                  <thead>
                    <tr>
                      <Th>Order</Th>
                      <Th>Date</Th>
                      <Th>City</Th>
                      <Th>Status</Th>
                      <Th className="text-right">Total</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {customer.recentOrders.map((order) => (
                      <tr
                        key={order.id}
                        className="border-t border-zinc-100 transition hover:bg-zinc-50"
                      >
                        <Td>
                          <Link
                            href={adminOrderHref(order.id)}
                            className="font-medium text-brand-700 hover:underline"
                          >
                            #{order.id.slice(-8).toUpperCase()}
                          </Link>
                        </Td>
                        <Td>
                          {new Date(order.createdAt).toLocaleDateString(undefined, {
                            dateStyle: "medium",
                          })}
                        </Td>
                        <Td>{order.city}</Td>
                        <Td>{order.fulfillmentSummary}</Td>
                        <Td className="text-right font-semibold">
                          {formatPrice(order.total)}
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </AdminTable>
              </div>
            )}
          </section>
        </div>
      )}
    </AdminShell>
  );
}
