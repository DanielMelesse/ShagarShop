import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import type { Product } from "@/lib/types";

interface ProductSectionProps {
  title: string;
  subtitle: string;
  products: Product[];
  viewAllHref?: string;
  viewAllLabel?: string;
  deal?: boolean;
}

export function ProductSection({
  title,
  subtitle,
  products,
  viewAllHref,
  viewAllLabel = "See all",
  deal = false,
}: ProductSectionProps) {
  if (products.length === 0) return null;

  return (
    <section className="mt-12 first:mt-0">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-900">{title}</h2>
          <p className="mt-1 text-sm text-zinc-500">{subtitle}</p>
        </div>
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="shrink-0 text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            {viewAllLabel} →
          </Link>
        )}
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} deal={deal} />
        ))}
      </div>
    </section>
  );
}
