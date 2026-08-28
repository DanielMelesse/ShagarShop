"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { DELIVERY_HOME, DELIVERY_REGISTER } from "@/lib/delivery-routes";
import { isDeliveryRole } from "@/lib/user-role";

export function DeliverLanding() {
  const router = useRouter();
  const { user, isReady } = useAuth();
  const isCourier = Boolean(user && isDeliveryRole(user.role));

  useEffect(() => {
    if (!isReady) return;
    if (isCourier) {
      router.replace(DELIVERY_HOME);
    }
  }, [isReady, isCourier, router]);

  if (!isReady || isCourier) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <div className="h-40 animate-pulse rounded-2xl bg-zinc-100" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <div className="rounded-2xl bg-gradient-to-br from-brand-700 via-brand-600 to-emerald-600 px-8 py-12 text-white shadow-lg">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-100">
          Delivery partners
        </p>
        <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
          Deliver for ShegerShop
        </h1>
        <p className="mt-3 max-w-xl text-brand-50">
          Claim ready orders, navigate to the customer, and mark deliveries complete.
          Buyers get SMS updates automatically.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={DELIVERY_REGISTER}
            className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-brand-800 hover:bg-brand-50"
          >
            Become a courier
          </Link>
          <Link
            href={`/login?callbackUrl=${encodeURIComponent(DELIVERY_HOME)}`}
            className="rounded-xl border border-white/40 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
          >
            Courier login
          </Link>
        </div>
      </div>

      <ol className="mt-10 grid gap-4 sm:grid-cols-3">
        {[
          {
            step: "1",
            title: "Claim",
            body: "Pick up jobs sellers marked ready for delivery.",
          },
          {
            step: "2",
            title: "Deliver",
            body: "Take the package to the address on the job card.",
          },
          {
            step: "3",
            title: "Complete",
            body: "Mark delivered — the buyer gets an SMS update.",
          },
        ].map((item) => (
          <li
            key={item.step}
            className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
          >
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-800">
              {item.step}
            </span>
            <h2 className="mt-3 font-semibold text-zinc-900">{item.title}</h2>
            <p className="mt-1 text-sm text-zinc-500">{item.body}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
