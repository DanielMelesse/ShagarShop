"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { DeliveryNav } from "@/components/delivery/DeliveryNav";
import { DeliveryJobCard } from "@/components/delivery/DeliveryJobCard";
import { useAuth } from "@/hooks/useAuth";
import type { CourierDeliveryJob, DeliveryStats } from "@/lib/delivery";
import {
  DELIVERY_VEHICLE_LABELS,
  isDeliveryVehicleType,
  type DeliveryVehicleType,
} from "@/lib/delivery";
import { DELIVERY_AVAILABLE, DELIVERY_MINE } from "@/lib/delivery-routes";
import { formatPrice } from "@/lib/products";

interface MeResponse {
  profile: {
    vehicleType: string;
    serviceArea: string;
  } | null;
  stats: DeliveryStats;
}

export function DeliveryDashboard() {
  const { user } = useAuth();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [jobs, setJobs] = useState<CourierDeliveryJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const [meRes, jobsRes] = await Promise.all([
        fetch("/api/delivery/me", { credentials: "same-origin" }),
        fetch("/api/delivery/jobs?scope=available", { credentials: "same-origin" }),
      ]);
      const meData = await meRes.json();
      const jobsData = await jobsRes.json();
      if (!meRes.ok) {
        setError(meData.error ?? "Could not load delivery dashboard.");
        return;
      }
      setMe(meData);
      setJobs(jobsData.jobs ?? []);
    } catch {
      setError("Could not load delivery dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function claim(jobId: string) {
    setBusyId(jobId);
    setError("");
    try {
      const res = await fetch(`/api/delivery/jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ action: "claim" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not claim job.");
        return;
      }
      await load();
    } catch {
      setError("Could not claim job.");
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="h-8 w-56 animate-pulse rounded-lg bg-zinc-200" />
        <div className="mt-8 h-40 animate-pulse rounded-2xl bg-zinc-100" />
      </div>
    );
  }

  const firstName = user?.name?.split(" ")[0] ?? "Rider";
  const vehicle =
    me?.profile?.vehicleType && isDeliveryVehicleType(me.profile.vehicleType)
      ? DELIVERY_VEHICLE_LABELS[me.profile.vehicleType as DeliveryVehicleType]
      : me?.profile?.vehicleType;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-brand-700">Delivery</p>
          <h1 className="mt-1 text-2xl font-bold text-zinc-900">
            Hi, {firstName}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            {vehicle ? `${vehicle} · ` : ""}
            {me?.profile?.serviceArea ?? "ShegerShop courier"}
          </p>
        </div>
        <DeliveryNav />
      </header>

      {error && (
        <p className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Available", value: String(me?.stats.available ?? 0), href: DELIVERY_AVAILABLE },
          { label: "On the way", value: String(me?.stats.active ?? 0), href: DELIVERY_MINE },
          {
            label: "Delivered today",
            value: String(me?.stats.deliveredToday ?? 0),
            href: DELIVERY_MINE,
          },
          {
            label: "Earnings today",
            value: formatPrice(me?.stats.earningsToday ?? 0),
            href: DELIVERY_MINE,
          },
        ].map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-brand-200"
          >
            <p className="text-sm text-zinc-500">{stat.label}</p>
            <p className="mt-2 text-3xl font-bold text-zinc-900">{stat.value}</p>
          </Link>
        ))}
      </div>

      <section className="mt-10">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-zinc-900">Next up</h2>
          <Link
            href={DELIVERY_AVAILABLE}
            className="text-sm font-medium text-brand-700 hover:underline"
          >
            See all
          </Link>
        </div>
        {jobs.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-6 py-10 text-center text-sm text-zinc-500">
            No available deliveries right now. Check back when sellers hand off orders.
          </p>
        ) : (
          <ul className="mt-4 space-y-4">
            {jobs.slice(0, 3).map((job) => (
              <li key={job.id}>
                <DeliveryJobCard
                  job={job}
                  actionLabel="Claim stop"
                  busy={busyId === job.id}
                  onAction={() => claim(job.id)}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
