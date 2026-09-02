"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { SellShopperPrompt } from "@/components/seller/SellShopperPrompt";
import { useAuth } from "@/hooks/useAuth";
import { formatPrice } from "@/lib/products";
import {
  SELL_LANDING,
  SELLER_HOME,
  SELLER_REGISTER,
} from "@/lib/seller-routes";
import { isSellerRole } from "@/lib/user-role";

const steps = [
  {
    title: "Create your account",
    description: "Sign up with your phone number — it takes less than a minute.",
  },
  {
    title: "List your products",
    description:
      "Add photos, descriptions, pricing in Birr, and stock from your seller dashboard.",
  },
  {
    title: "Reach buyers",
    description:
      "Get discovered through search, categories, and Today's Deals across ShegerShop.",
  },
  {
    title: "Fulfill orders",
    description: "Track sales and manage inventory from one place.",
  },
];

const perks = [
  "0% commission for your first 30 days, then 10%",
  "Free shipping threshold applies to your buyers",
  "Featured deal eligibility for top-rated listings",
  "Seller support via email",
];

export function SellLanding() {
  const router = useRouter();
  const { user, isReady } = useAuth();
  const isSeller = Boolean(user && isSellerRole(user.role));

  useEffect(() => {
    if (!isReady) return;
    if (isSeller) {
      router.replace(SELLER_HOME);
    }
  }, [isReady, isSeller, router]);

  if (!isReady || isSeller) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <div className="h-40 animate-pulse rounded-2xl bg-zinc-100" />
      </div>
    );
  }

  if (user) {
    return <SellShopperPrompt userName={user.name} />;
  }

  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-950 via-brand-800 to-brand-600 text-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-24">
          <p className="text-sm font-medium uppercase tracking-wider text-brand-100">
            Seller program
          </p>
          <h1 className="mt-3 max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
            Sell on ShegerShop
          </h1>
          <p className="mt-4 max-w-xl text-lg text-brand-50/90">
            Open your shop and reach customers across Ethiopia&apos;s marketplace.
            List products, manage inventory, and grow your business online.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href={SELLER_REGISTER}
              className="rounded-xl bg-white px-8 py-4 text-base font-semibold text-brand-700 shadow-lg transition hover:bg-brand-50"
            >
              Start selling
            </Link>
            <Link
              href={`/login?callbackUrl=${encodeURIComponent(SELLER_HOME)}`}
              className="rounded-xl border-2 border-white/40 px-8 py-4 text-base font-semibold transition hover:bg-white/10"
            >
              Seller login
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <h2 className="text-2xl font-bold text-zinc-900">How it works</h2>
        <ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <li
              key={step.title}
              className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
                {index + 1}
              </span>
              <h3 className="mt-4 font-semibold text-zinc-900">{step.title}</h3>
              <p className="mt-2 text-sm text-zinc-600">{step.description}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="text-2xl font-bold text-zinc-900">Why sell with us</h2>
            <ul className="mt-6 space-y-3">
              {perks.map((perk) => (
                <li key={perk} className="flex gap-3 text-zinc-700">
                  <span className="mt-1 text-brand-600" aria-hidden>
                    ✓
                  </span>
                  {perk}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl bg-zinc-900 p-8 text-white">
            <p className="text-sm font-medium uppercase tracking-wider text-zinc-400">
              Example listing
            </p>
            <p className="mt-3 text-2xl font-bold">Handwoven basket set</p>
            <p className="mt-2 text-zinc-400">
              List at {formatPrice(1200)} · 25 in stock · Home category
            </p>
            <p className="mt-6 text-sm text-zinc-500">
              Buyers see your product in shop search, category browse, and deals
              when featured.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6">
        <h2 className="text-2xl font-bold text-zinc-900">Ready to list your first product?</h2>
        <p className="mx-auto mt-3 max-w-lg text-zinc-600">
          Create a free account and open your seller dashboard instantly.
        </p>
        <Link
          href={SELLER_REGISTER}
          className="mt-8 inline-block rounded-xl bg-brand-600 px-8 py-4 text-base font-semibold text-white transition hover:bg-brand-700"
        >
          Register as seller
        </Link>
        <p className="mt-6 text-sm text-zinc-500">
          Already selling?{" "}
          <Link
            href={`/login?callbackUrl=${encodeURIComponent(SELL_LANDING)}`}
            className="font-medium text-brand-600 hover:underline"
          >
            Log in to your dashboard
          </Link>
        </p>
      </section>
    </>
  );
}
