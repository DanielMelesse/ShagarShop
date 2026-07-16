"use client";

import { useCallback, useEffect, useState } from "react";
import { DeliveryJobCard } from "@/components/delivery/DeliveryJobCard";
import { DeliveryNav } from "@/components/delivery/DeliveryNav";
import type { DeliveryJob } from "@/lib/delivery";

export function DeliveryMyJobs() {
  const [jobs, setJobs] = useState<DeliveryJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const res = await fetch("/api/delivery/jobs?scope=mine&history=1", {
        credentials: "same-origin",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not load your deliveries.");
        return;
      }
      setJobs(data.jobs ?? []);
    } catch {
      setError("Could not load your deliveries.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function deliver(jobId: string) {
    setBusyId(jobId);
    setError("");
    try {
      const res = await fetch(`/api/delivery/jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ action: "deliver" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not complete delivery.");
        return;
      }
      await load();
    } catch {
      setError("Could not complete delivery.");
    } finally {
      setBusyId(null);
    }
  }

  const active = jobs.filter((j) => j.fulfillmentStatus === "shipped");
  const done = jobs.filter((j) => j.fulfillmentStatus === "delivered");

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">My deliveries</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Active jobs and recent completions.
          </p>
        </div>
        <DeliveryNav />
      </header>

      {error && (
        <p className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {loading ? (
        <div className="mt-8 h-40 animate-pulse rounded-2xl bg-zinc-100" />
      ) : (
        <>
          <section className="mt-8">
            <h2 className="text-lg font-bold text-zinc-900">On the way</h2>
            {active.length === 0 ? (
              <p className="mt-4 text-sm text-zinc-500">
                No active deliveries. Claim one from Available.
              </p>
            ) : (
              <ul className="mt-4 space-y-4">
                {active.map((job) => (
                  <li key={job.id}>
                    <DeliveryJobCard
                      job={job}
                      actionLabel="Mark delivered"
                      busy={busyId === job.id}
                      onAction={() => deliver(job.id)}
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="mt-10">
            <h2 className="text-lg font-bold text-zinc-900">Completed</h2>
            {done.length === 0 ? (
              <p className="mt-4 text-sm text-zinc-500">No completed deliveries yet.</p>
            ) : (
              <ul className="mt-4 space-y-4">
                {done.map((job) => (
                  <li key={job.id}>
                    <DeliveryJobCard job={job} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
