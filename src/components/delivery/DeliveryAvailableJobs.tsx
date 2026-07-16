"use client";

import { useCallback, useEffect, useState } from "react";
import { DeliveryJobCard } from "@/components/delivery/DeliveryJobCard";
import { DeliveryNav } from "@/components/delivery/DeliveryNav";
import type { DeliveryJob } from "@/lib/delivery";

export function DeliveryAvailableJobs() {
  const [jobs, setJobs] = useState<DeliveryJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const res = await fetch("/api/delivery/jobs?scope=available", {
        credentials: "same-origin",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not load jobs.");
        return;
      }
      setJobs(data.jobs ?? []);
    } catch {
      setError("Could not load jobs.");
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

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Available deliveries</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Claim a job to take it on the road.
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
      ) : jobs.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-6 py-12 text-center text-sm text-zinc-500">
          No open deliveries. Sellers mark orders &quot;Ready for delivery&quot; first.
        </p>
      ) : (
        <ul className="mt-8 space-y-4">
          {jobs.map((job) => (
            <li key={job.id}>
              <DeliveryJobCard
                job={job}
                actionLabel="Claim delivery"
                busy={busyId === job.id}
                onAction={() => claim(job.id)}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
