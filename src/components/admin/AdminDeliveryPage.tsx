"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminTable, EmptyState, Td, Th } from "@/components/admin/AdminTable";
import type { AdminCourierRow } from "@/lib/admin";
import type { DeliveryJob } from "@/lib/delivery";
import { DELIVERY_VEHICLE_LABELS, isDeliveryVehicleType } from "@/lib/delivery";
import { adminCourierHref, adminOrderHref } from "@/lib/admin-routes";

export function AdminDeliveryPage() {
  const [couriers, setCouriers] = useState<AdminCourierRow[]>([]);
  const [jobs, setJobs] = useState<DeliveryJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/delivery", { credentials: "same-origin" })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Could not load delivery ops.");
          return;
        }
        setCouriers(data.couriers ?? []);
        setJobs(data.availableJobs ?? []);
      })
      .catch(() => setError("Could not load delivery ops."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminShell
      title="Delivery"
      description="Courier fleet and unassigned jobs — click a courier for jobs and history."
    >
      {error && (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {loading ? (
        <div className="h-48 animate-pulse rounded-2xl bg-zinc-100" />
      ) : (
        <>
          <section>
            <h2 className="text-lg font-bold text-zinc-900">
              Unassigned stops ({jobs.length})
            </h2>
            {jobs.length === 0 ? (
              <p className="mt-3 text-sm text-zinc-500">No stops waiting for a courier.</p>
            ) : (
              <ul className="mt-4 space-y-2">
                {jobs.map((job) => (
                  <li key={job.id}>
                    <Link
                      href={adminOrderHref(job.orderId)}
                      className="block rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50"
                    >
                      <span className="font-medium text-brand-700 hover:underline">
                        {job.productName}
                      </span>
                      <span className="text-zinc-400"> · </span>
                      {job.itemCount} item{job.itemCount === 1 ? "" : "s"}
                      <span className="text-zinc-400"> · </span>
                      {job.shippingName}, {job.city}
                      <span className="text-zinc-400"> · </span>
                      Order #{job.orderId.slice(-8).toUpperCase()}
                      <span className="text-zinc-400"> · </span>
                      courier pay {job.courierEarning} Birr
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="mt-10">
            <h2 className="text-lg font-bold text-zinc-900">Couriers</h2>
            {couriers.length === 0 ? (
              <div className="mt-4">
                <EmptyState message="No delivery partners registered." />
              </div>
            ) : (
              <div className="mt-4">
                <AdminTable>
                  <thead>
                    <tr>
                      <Th>Courier</Th>
                      <Th>Vehicle</Th>
                      <Th>Area</Th>
                      <Th>Status</Th>
                      <Th>Active jobs</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {couriers.map((courier) => (
                      <tr
                        key={courier.id}
                        className="border-t border-zinc-100 transition hover:bg-zinc-50"
                      >
                        <Td className="font-medium text-zinc-900">
                          <Link
                            href={adminCourierHref(courier.id)}
                            className="text-brand-700 hover:underline"
                          >
                            {courier.name}
                          </Link>
                          <Link
                            href={adminCourierHref(courier.id)}
                            className="block text-xs text-zinc-400"
                          >
                            {courier.phone}
                          </Link>
                        </Td>
                        <Td>
                          <Link
                            href={adminCourierHref(courier.id)}
                            className="block text-zinc-600"
                          >
                            {isDeliveryVehicleType(courier.vehicleType)
                              ? DELIVERY_VEHICLE_LABELS[courier.vehicleType]
                              : courier.vehicleType}
                          </Link>
                        </Td>
                        <Td>
                          <Link
                            href={adminCourierHref(courier.id)}
                            className="block text-zinc-600"
                          >
                            {courier.serviceArea}
                          </Link>
                        </Td>
                        <Td>
                          <Link href={adminCourierHref(courier.id)} className="block">
                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                                courier.active
                                  ? "bg-brand-100 text-brand-800"
                                  : "bg-zinc-100 text-zinc-600"
                              }`}
                            >
                              {courier.active ? "Active" : "Inactive"}
                            </span>
                          </Link>
                        </Td>
                        <Td>
                          <Link
                            href={adminCourierHref(courier.id)}
                            className="block text-zinc-600"
                          >
                            {courier.activeJobs}
                          </Link>
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </AdminTable>
              </div>
            )}
          </section>
        </>
      )}
    </AdminShell>
  );
}
