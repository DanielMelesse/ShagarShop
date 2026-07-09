"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AddToCartButton } from "@/app/product/[id]/AddToCartButton";
import { ProductImage } from "@/components/ProductImage";
import { DealsHero } from "@/components/DealsHero";
import { getDealMeta } from "@/lib/deals";
import { formatPrice, productNeedsSizeSelection } from "@/lib/products";
import type { Product } from "@/lib/types";

interface DealsCarouselHeroProps {
  deals: Product[];
  activeCategoryLabel?: string;
}

const AUTO_ADVANCE_MS = 6000;

function DealSlide({ product }: { product: Product }) {
  const { listPrice, savingsPercent } = getDealMeta(product);

  return (
    <div className="grid gap-6 lg:grid-cols-2 lg:items-center">
      <div className="relative aspect-[4/3] bg-zinc-100 lg:aspect-auto lg:min-h-[280px]">
        <ProductImage
          src={product.image}
          alt={product.name}
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 50vw"
          priority
        />
        <span className="absolute left-4 top-4 rounded-lg bg-red-600 px-3 py-1 text-sm font-bold text-white shadow">
          Today&apos;s deal · {savingsPercent}% off
        </span>
      </div>

      <div className="p-6 lg:p-8">
        <h3 className="text-2xl font-bold text-zinc-900 sm:text-3xl">{product.name}</h3>
        <p className="mt-3 line-clamp-3 text-sm text-zinc-600">{product.description}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-zinc-500">
          <span className="text-amber-500">★</span>
          <span className="font-medium text-zinc-800">{product.rating}</span>
          <span>({product.reviewCount.toLocaleString()} reviews)</span>
          {product.size && <span>· Size {product.size}</span>}
        </div>
        <div className="mt-4 flex flex-wrap items-baseline gap-3">
          <span className="text-3xl font-bold text-brand-700">
            {formatPrice(product.price)}
          </span>
          <span className="text-lg text-zinc-400 line-through">
            {formatPrice(listPrice)}
          </span>
          <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-sm font-semibold text-red-700">
            Save {savingsPercent}%
          </span>
        </div>
        {product.stock <= 25 && (
          <p className="mt-3 text-sm font-medium text-orange-700">
            Only {product.stock} left in stock — order soon
          </p>
        )}
        <div className="mt-6 flex flex-wrap gap-3">
          {productNeedsSizeSelection(product) ? (
            <Link
              href={`/product/${product.id}`}
              className="inline-flex items-center rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
            >
              Choose size & buy
            </Link>
          ) : (
            <AddToCartButton product={product} />
          )}
          <Link
            href={`/product/${product.id}`}
            className="inline-flex items-center rounded-xl border border-zinc-300 px-5 py-2.5 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50"
          >
            View details
          </Link>
        </div>
      </div>
    </div>
  );
}

export function DealsCarouselHero({
  deals,
  activeCategoryLabel,
}: DealsCarouselHeroProps) {
  const [index, setIndex] = useState(0);
  const count = deals.length;

  const goTo = useCallback(
    (next: number) => {
      if (count === 0) return;
      setIndex(((next % count) + count) % count);
    },
    [count],
  );

  useEffect(() => {
    if (count <= 1) return;
    const timer = window.setInterval(() => goTo(index + 1), AUTO_ADVANCE_MS);
    return () => window.clearInterval(timer);
  }, [count, goTo, index]);

  if (count === 0) {
    return (
      <DealsHero dealCount={0} activeCategoryLabel={activeCategoryLabel} />
    );
  }

  const title = activeCategoryLabel
    ? `${activeCategoryLabel} deals`
    : "Today's Deals";

  return (
    <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-brand-600 p-1 shadow-lg">
      <div className="overflow-hidden rounded-[14px] bg-gradient-to-r from-amber-50 to-white">
        <div className="border-b border-amber-100 bg-gradient-to-r from-amber-100/80 to-orange-50 px-6 py-4 sm:px-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-800">
            {title}
          </p>
          <p className="mt-1 text-sm text-amber-900/80">
            {count} deal{count !== 1 ? "s" : ""} live · shuffled for you
          </p>
        </div>

        <DealSlide key={deals[index].id} product={deals[index]} />

        {count > 1 && (
          <div className="flex flex-wrap justify-center gap-2 border-t border-amber-100 px-6 py-4">
            {deals.map((deal, i) => (
              <button
                key={deal.id}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Show deal ${i + 1}: ${deal.name}`}
                aria-current={i === index ? "true" : undefined}
                className={`h-2.5 rounded-full transition ${
                  i === index
                    ? "w-8 bg-brand-600"
                    : "w-2.5 bg-amber-200 hover:bg-amber-300"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
