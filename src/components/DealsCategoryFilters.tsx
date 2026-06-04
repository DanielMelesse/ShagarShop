import Link from "next/link";
import { categories } from "@/lib/products";
import type { Category, Product } from "@/lib/types";

interface DealsCategoryFiltersProps {
  products: Product[];
  activeCategory?: Category;
}

export function DealsCategoryFilters({
  products,
  activeCategory,
}: DealsCategoryFiltersProps) {
  const counts = new Map<Category, number>();
  for (const p of products) {
    counts.set(p.category, (counts.get(p.category) ?? 0) + 1);
  }

  const available = categories.filter((c) => (counts.get(c.id) ?? 0) > 0);
  if (available.length <= 1) return null;

  return (
    <nav
      aria-label="Deal categories"
      className="mt-8 flex flex-wrap gap-2"
    >
      <Link
        href="/shop?featured=1"
        className={`rounded-full px-4 py-2 text-sm font-medium transition ${
          !activeCategory
            ? "bg-brand-600 text-white"
            : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
        }`}
      >
        All deals
      </Link>
      {available.map((cat) => (
        <Link
          key={cat.id}
          href={`/shop?featured=1&category=${cat.id}`}
          className={`rounded-full px-4 py-2 text-sm font-medium transition ${
            activeCategory === cat.id
              ? "bg-brand-600 text-white"
              : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
          }`}
        >
          {cat.label} ({counts.get(cat.id)})
        </Link>
      ))}
    </nav>
  );
}
