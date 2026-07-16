"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  DELIVERY_VEHICLE_LABELS,
  DELIVERY_VEHICLE_TYPES,
} from "@/lib/delivery";
import { DELIVER_LANDING } from "@/lib/delivery-routes";
import { isDeliveryRole } from "@/lib/user-role";

export function DeliveryRegisterForm() {
  const router = useRouter();
  const { login, user, isReady } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isReady && user && isDeliveryRole(user.role)) {
      router.replace(DELIVER_LANDING);
    }
  }, [isReady, user, router]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const payload = {
      name: String(form.get("name") ?? ""),
      phone: String(form.get("phone") ?? ""),
      password: String(form.get("password") ?? ""),
      vehicleType: String(form.get("vehicleType") ?? ""),
      serviceArea: String(form.get("serviceArea") ?? ""),
    };

    try {
      const res = await fetch("/api/delivery/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Registration failed.");
        setLoading(false);
        return;
      }

      const ok = await login(payload.phone, payload.password);
      setLoading(false);
      if (!ok) {
        setError("Account created — please log in.");
        router.push(`/login?callbackUrl=${encodeURIComponent(DELIVER_LANDING)}`);
        return;
      }
      router.replace(DELIVER_LANDING);
    } catch {
      setLoading(false);
      setError("Registration failed.");
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-bold text-zinc-900">Join as a delivery partner</h1>
      <p className="mt-2 text-sm text-zinc-500">
        Claim ready orders and deliver them across your service area.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <label htmlFor="name" className="text-sm font-medium text-zinc-700">
            Full name
          </label>
          <input
            id="name"
            name="name"
            required
            className="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          />
        </div>
        <div>
          <label htmlFor="phone" className="text-sm font-medium text-zinc-700">
            Phone number
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            required
            placeholder="09XX XXX XXXX"
            className="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          />
        </div>
        <div>
          <label htmlFor="password" className="text-sm font-medium text-zinc-700">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          />
        </div>
        <div>
          <label htmlFor="vehicleType" className="text-sm font-medium text-zinc-700">
            Vehicle
          </label>
          <select
            id="vehicleType"
            name="vehicleType"
            required
            defaultValue="motorcycle"
            className="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          >
            {DELIVERY_VEHICLE_TYPES.map((type) => (
              <option key={type} value={type}>
                {DELIVERY_VEHICLE_LABELS[type]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="serviceArea" className="text-sm font-medium text-zinc-700">
            Service area
          </label>
          <input
            id="serviceArea"
            name="serviceArea"
            required
            placeholder="e.g. Bole, Addis Ababa"
            className="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {loading ? "Creating account…" : "Start delivering"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-500">
        Already registered?{" "}
        <Link
          href={`/login?callbackUrl=${encodeURIComponent(DELIVER_LANDING)}`}
          className="font-medium text-brand-600 hover:underline"
        >
          Log in
        </Link>
      </p>
    </div>
  );
}
