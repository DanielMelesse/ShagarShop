"use client";

import Link from "next/link";
import { TODAYS_DEALS_HREF } from "@/lib/shop-routes";
import { ProductImage } from "@/components/ProductImage";
import { AddToCartButton } from "@/app/product/[id]/AddToCartButton";
import { formatPrice, productNeedsSizeSelection } from "@/lib/products";
import type { Product } from "@/lib/types";

interface BestProductHeroProps {
  product: Product;
  userName: string;
}

export function BestProductHero({ product, userName }: BestProductHeroProps) {
  const firstName = userName.split(" ")[0] || userName;

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-brand-900 via-brand-700 to-brand-600 text-white">
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl"
        aria-hidden
      />
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-24">
        <div>
          <p className="text-sm font-medium uppercase tracking-wider text-brand-100">
            Hi, {firstName}
          </p>
          <h2 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
            Today&apos;s best pick
          </h2>
          <p className="mt-4 text-2xl font-semibold text-white">{product.name}</p>
          <p className="mt-3 line-clamp-3 max-w-lg text-base text-brand-50/90">
            {product.description}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
            <span className="rounded-full bg-white/15 px-3 py-1 backdrop-blur-sm">
              ★ {product.rating} ({product.reviewCount.toLocaleString()} reviews)
            </span>
            {product.size && (
              <span className="rounded-full bg-white/15 px-3 py-1 backdrop-blur-sm">
                Size {product.size}
              </span>
            )}
          </div>
          <p className="mt-5 text-3xl font-bold">{formatPrice(product.price)}</p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            {productNeedsSizeSelection(product) ? (
              <Link
                href={`/product/${product.id}`}
                className="rounded-xl bg-white px-8 py-4 text-base font-semibold text-brand-700 shadow-lg transition hover:bg-brand-50"
              >
                Choose size & buy
              </Link>
            ) : (
              <div className="[&_button]:rounded-xl [&_button]:px-8 [&_button]:py-4 [&_button]:text-base">
                <AddToCartButton product={product} />
              </div>
            )}
            <Link
              href={`/product/${product.id}`}
              className="rounded-xl border-2 border-white/40 px-8 py-4 text-base font-semibold transition hover:bg-white/10"
            >
              View details
            </Link>
            <Link
              href={TODAYS_DEALS_HREF}
              className="text-sm font-medium text-brand-100 underline-offset-2 hover:underline"
            >
              More deals →
            </Link>
          </div>
        </div>

        <Link
          href={`/product/${product.id}`}
          className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-2xl ring-2 ring-white/20 transition hover:ring-white/40"
        >
          <ProductImage
            src={product.image}
            alt={product.name}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
          <span className="absolute left-4 top-4 rounded-lg bg-amber-500 px-3 py-1 text-sm font-bold text-white shadow">
            Best rated
          </span>
        </Link>
      </div>
    </section>
  );
}
