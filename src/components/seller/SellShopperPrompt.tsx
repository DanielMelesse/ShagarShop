"use client";

import Link from "next/link";
import { SELL_LANDING, SELLER_REGISTER } from "@/lib/seller-routes";
import { TODAYS_DEALS_HREF } from "@/lib/shop-routes";

export function SellShopperPrompt({ userName }: { userName: string }) {
  return (
    <div className="mx-auto flex max-w-lg flex-col px-4 py-16 text-center sm:px-6">
      <h2 className="text-2xl font-bold text-zinc-900">Seller account required</h2>
      <p className="mt-3 text-sm text-zinc-600">
        Hi {userName.split(" ")[0]}, you&apos;re signed in with a shopper account. To list
        products and manage inventory, sign in with a seller account instead.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href={SELLER_REGISTER}
          className="rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          Register as seller
        </Link>
        <Link
          href={TODAYS_DEALS_HREF}
          className="rounded-xl border border-zinc-300 px-6 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
        >
          Back to shop
        </Link>
      </div>
      <p className="mt-6 text-xs text-zinc-500">
        Already have a seller account?{" "}
        <Link
          href={`/login?callbackUrl=${encodeURIComponent(SELL_LANDING)}`}
          className="font-medium text-brand-600 hover:underline"
        >
          Log in here
        </Link>
      </p>
    </div>
  );
}
