import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/products";
import { getDealMeta } from "@/lib/deals";
import type { Product } from "@/lib/types";
import { AddToCartButton } from "@/app/product/[id]/AddToCartButton";

export function DealSpotlight({ product }: { product: Product }) {
  const { listPrice, savingsPercent } = getDealMeta(product);

  return (
    <section className="mt-8 overflow-hidden rounded-2xl border-2 border-amber-200 bg-gradient-to-r from-amber-50 to-white shadow-sm">
      <div className="grid gap-6 lg:grid-cols-2 lg:items-center">
        <div className="relative aspect-[4/3] bg-zinc-100 lg:aspect-auto lg:min-h-[280px]">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 50vw"
            priority
          />
          <span className="absolute left-4 top-4 rounded-lg bg-red-600 px-3 py-1 text-sm font-bold text-white shadow">
            Deal of the day · {savingsPercent}% off
          </span>
        </div>

        <div className="p-6 lg:p-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">
            Best savings right now
          </p>
          <h2 className="mt-2 text-2xl font-bold text-zinc-900 sm:text-3xl">
            {product.name}
          </h2>
          <p className="mt-3 line-clamp-3 text-sm text-zinc-600">
            {product.description}
          </p>
          <div className="mt-2 flex items-center gap-2 text-sm text-zinc-500">
            <span className="text-amber-500">★</span>
            <span className="font-medium text-zinc-800">{product.rating}</span>
            <span>({product.reviewCount.toLocaleString()} reviews)</span>
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
            <AddToCartButton product={product} />
            <Link
              href={`/product/${product.id}`}
              className="inline-flex items-center rounded-xl border border-zinc-300 px-5 py-2.5 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50"
            >
              View details
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
