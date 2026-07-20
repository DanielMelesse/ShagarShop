"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminTable, EmptyState, Td, Th } from "@/components/admin/AdminTable";
import type { AdminCourierDetail } from "@/lib/admin";
import {
  ADMIN_DELIVERY,
  adminCustomerHref,
  adminOrderHref,
} from "@/lib/admin-routes";

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function AdminCourierDetailPage({ courierId }: { courierId: string }) {
  const [courier, setCourier] = useState<AdminCourierDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/admin/delivery/${courierId}`, { credentials: "same-origin" })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Could not load courier.");
          return;
        }
        setCourier(data.courier);
      })
      .catch(() => setError("Could not load courier."))
      .finally(() => setLoading(false));
  }, [courierId]);

  return (
    <AdminShell
      title={courier?.name ?? "Courier details"}
      description="Delivery partner profile, active jobs, and delivery history."
    >
      <p className="mb-6">
        <Link
          href={ADMIN_DELIVERY}
          className="text-sm font-medium text-brand-700 hover:underline"
        >
          ← Back to delivery
        </Link>
      </p>

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {loading || !courier ? (
        !error && <div className="h-64 animate-pulse rounded-2xl bg-zinc-100" />
      ) : (
        <div className="space-y-8">
          <section className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold text-zinc-900">{courier.name}</h2>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    courier.active
                      ? "bg-brand-100 text-brand-800"
                      : "bg-zinc-100 text-zinc-600"
                  }`}
                >
                  {courier.active ? "Active" : "Inactive"}
                </span>
              </div>
              <p className="mt-2 text-sm text-zinc-600">{courier.phone}</p>
              {courier.email && (
                <p className="text-sm text-zinc-500">{courier.email}</p>
              )}
              <p className="mt-2 text-sm text-zinc-500">
                {courier.vehicleLabel} · {courier.serviceArea}
              </p>
              <Link
                href={adminCustomerHref(courier.userId)}
                className="mt-3 inline-block text-sm font-medium text-brand-700 hover:underline"
              >
                View account →
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-4 text-right">
              <div>
                <p className="text-sm text-zinc-500">Active</p>
                <p className="text-2xl font-bold text-zinc-900">
                  {courier.stats.activeJobs}
                </p>
              </div>
              <div>
                <p className="text-sm text-zinc-500">Delivered</p>
                <p className="text-2xl font-bold text-zinc-900">
                  {courier.stats.deliveredTotal}
                </p>
              </div>
              <div>
                <p className="text-sm text-zinc-500">Today</p>
                <p className="text-2xl font-bold text-zinc-900">
                  {courier.stats.deliveredToday}
                </p>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Active deliveries
            </h3>
            {courier.activeDeliveries.length === 0 ? (
              <p className="mt-3 text-sm text-zinc-500">No jobs currently assigned.</p>
            ) : (
              <div className="mt-4">
                <AdminTable>
                  <thead>
                    <tr>
                      <Th>Product</Th>
                      <Th>Deliver to</Th>
                      <Th>Assigned</Th>
                      <Th>Order</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {courier.activeDeliveries.map((job) => (
                      <tr key={job.id} className="border-t border-zinc-100">
                        <Td className="font-medium text-zinc-900">{job.productName}</Td>
                        <Td>
                          {job.shippingName}
                          <div className="text-xs text-zinc-400">{job.city}</div>
                        </Td>
                        <Td>{formatDateTime(job.assignedAt)}</Td>
                        <Td>
                          <Link
                            href={adminOrderHref(job.orderId)}
                            className="text-brand-700 hover:underline"
                          >
                            #{job.orderId.slice(-8).toUpperCase()}
                          </Link>
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </AdminTable>
              </div>
            )}
          </section>

          <section>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Recent completed
            </h3>
            {courier.recentDeliveries.length === 0 ? (
              <div className="mt-4">
                <EmptyState message="No completed deliveries yet." />
              </div>
            ) : (
              <div className="mt-4">
                <AdminTable>
                  <thead>
                    <tr>
                      <Th>Product</Th>
                      <Th>Deliver to</Th>
                      <Th>Delivered</Th>
                      <Th>Order</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {courier.recentDeliveries.map((job) => (
                      <tr key={job.id} className="border-t border-zinc-100">
                        <Td className="font-medium text-zinc-900">{job.productName}</Td>
                        <Td>
                          {job.shippingName}
                          <div className="text-xs text-zinc-400">{job.city}</div>
                        </Td>
                        <Td>{formatDateTime(job.deliveredAt)}</Td>
                        <Td>
                          <Link
                            href={adminOrderHref(job.orderId)}
                            className="text-brand-700 hover:underline"
                          >
                            #{job.orderId.slice(-8).toUpperCase()}
                          </Link>
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
