import Link from "next/link";
import { ProductCardAddButton } from "@/components/ProductCardAddButton";
import { ProductImage } from "@/components/ProductImage";
import { getDealMeta } from "@/lib/deals";
import { formatPrice } from "@/lib/products";
import type { ProductListItem } from "@/lib/types";

export function ProductCard({
  product,
  deal = false,
}: {
  product: ProductListItem;
  deal?: boolean;
}) {
  const dealMeta = deal ? getDealMeta(product) : null;

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:border-brand-200 hover:shadow-md">
      <Link
        href={`/product/${product.id}`}
        className="relative aspect-square overflow-hidden bg-zinc-100"
      >
        {dealMeta && (
          <span className="absolute left-2 top-2 z-10 rounded-md bg-red-600 px-2 py-1 text-xs font-bold text-white shadow">
            -{dealMeta.savingsPercent}%
          </span>
        )}
        {deal && product.stock <= 25 && (
          <span className="absolute right-2 top-2 z-10 rounded-md bg-orange-600 px-2 py-1 text-xs font-bold text-white shadow">
            Low stock
          </span>
        )}
        <ProductImage
          src={product.image}
          alt={product.name}
          fill
          variant="card"
          className="object-cover transition duration-300 group-hover:scale-105"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <Link href={`/product/${product.id}`}>
          <h3 className="line-clamp-2 text-sm font-semibold text-zinc-900 transition group-hover:text-brand-700">
            {product.name}
          </h3>
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-500">
          <span className="flex items-center gap-1">
            <span className="text-amber-500">★</span>
            <span>{product.rating}</span>
            <span>({product.reviewCount.toLocaleString()})</span>
          </span>
          {product.size && (
            <>
              <span aria-hidden>·</span>
              <span>Size {product.size}</span>
            </>
          )}
        </div>
        <div className="mt-auto pt-3">
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-lg font-bold text-brand-700">
              {formatPrice(product.price)}
            </span>
            {dealMeta && (
              <span className="text-sm text-zinc-400 line-through">
                {formatPrice(dealMeta.listPrice)}
              </span>
            )}
          </div>
          <div className="mt-2 flex items-center justify-between gap-2">
            {deal && dealMeta && (
              <span className="text-xs font-medium text-red-600">
                Save {dealMeta.savingsPercent}%
              </span>
            )}
            <ProductCardAddButton product={product} />
          </div>
        </div>
      </div>
    </article>
  );
}
