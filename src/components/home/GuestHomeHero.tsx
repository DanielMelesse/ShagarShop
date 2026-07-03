"use client";

import Image from "next/image";
import Link from "next/link";
import { FREE_SHIPPING_THRESHOLD, formatPrice } from "@/lib/products";
import { TODAYS_DEALS_HREF } from "@/lib/shop-routes";

export function GuestHomeHero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-brand-900 via-brand-700 to-brand-600 text-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-24">
        <div>
          <p className="text-sm font-medium uppercase tracking-wider text-brand-100">
            Welcome to ShegerShop
          </p>
          <h2 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Shop smarter.
            <br />
            <span className="text-brand-100">Delivered faster.</span>
          </h2>
          <p className="mt-4 max-w-lg text-lg text-brand-50/90">
            Thousands of products from electronics to fashion — curated deals,
            secure checkout, and free shipping on orders over{" "}
            {formatPrice(FREE_SHIPPING_THRESHOLD)}.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href={TODAYS_DEALS_HREF}
              className="rounded-xl bg-white px-8 py-4 text-base font-semibold text-brand-700 shadow-lg transition hover:bg-brand-50 sm:px-10 sm:py-5 sm:text-lg"
            >
              Browse all products
            </Link>
            <Link
              href="/signup"
              className="rounded-xl bg-white px-8 py-4 text-base font-semibold text-brand-700 shadow-lg transition hover:bg-brand-50 sm:px-10 sm:py-5 sm:text-lg"
            >
              Create account
            </Link>
          </div>
        </div>
        <div className="relative hidden aspect-[4/3] overflow-hidden rounded-2xl shadow-2xl lg:block">
          <Image
            src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=900&q=80"
            alt="Shopping bags and packages"
            fill
            className="object-cover"
            priority
            sizes="50vw"
            unoptimized
          />
        </div>
      </div>
    </section>
  );
}
