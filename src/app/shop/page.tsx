import Link from "next/link";
import { DealSpotlightGate } from "@/components/deals/DealSpotlightGate";
import { DealsPageHero } from "@/components/deals/DealsPageHero";
import { DealsCategoryFilters } from "@/components/DealsCategoryFilters";
import { ProductCard } from "@/components/ProductCard";
import { sortDeals } from "@/lib/deals";
import { categories } from "@/lib/products";
import { isCategory } from "@/lib/product-mapper";
import { filterProducts, getFeaturedProducts } from "@/lib/products-server";
import type { Category } from "@/lib/types";

export const dynamic = "force-dynamic";

interface ShopPageProps {
  searchParams: Promise<{ category?: string; featured?: string; q?: string }>;
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const params = await searchParams;
  const categoryParam = params.category;
  const category =
    categoryParam && isCategory(categoryParam)
      ? (categoryParam as Category)
      : undefined;
  const featuredOnly = params.featured === "1";
  const query = params.q?.trim();

  const filtered = featuredOnly
    ? sortDeals(
        await filterProducts({
          category,
          featured: true,
          query: query || undefined,
        }),
      )
    : await filterProducts({
        category,
        query: query || undefined,
      });

  const allDealsForFilters = featuredOnly
    ? sortDeals(await getFeaturedProducts())
    : [];

  const activeCategory = categories.find((c) => c.id === category);
  const spotlight = featuredOnly && !query ? filtered[0] : undefined;
  const gridProducts =
    featuredOnly && spotlight ? filtered.slice(1) : filtered;

  if (featuredOnly) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <DealsPageHero
          bestDeal={spotlight ?? null}
          dealCount={filtered.length}
          activeCategoryLabel={activeCategory?.label}
        />

        <DealsCategoryFilters
          products={allDealsForFilters}
          activeCategory={category}
        />

        {filtered.length === 0 ? (
          <div className="mt-16 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-6 py-16 text-center">
            <p className="text-lg font-medium text-zinc-800">No deals found</p>
            <p className="mt-2 text-sm text-zinc-500">
              Try another category or check back tomorrow.
            </p>
            <Link
              href="/shop?featured=1"
              className="mt-6 inline-block rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700"
            >
              View all deals
            </Link>
          </div>
        ) : (
          <>
            {spotlight && <DealSpotlightGate product={spotlight} />}

            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-xl font-bold text-zinc-900">
                  {spotlight ? "More hot deals" : "All deals"}
                </h2>
                <p className="mt-1 text-sm text-zinc-500">
                  {gridProducts.length} product
                  {gridProducts.length !== 1 ? "s" : ""} · sorted by biggest
                  savings
                </p>
              </div>
              <form action="/shop" method="get" className="flex gap-2">
                <input type="hidden" name="featured" value="1" />
                {category && (
                  <input type="hidden" name="category" value={category} />
                )}
                <input
                  type="search"
                  name="q"
                  defaultValue={query ?? ""}
                  placeholder="Search deals..."
                  className="w-full rounded-lg border border-zinc-300 px-4 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 sm:w-64"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
                >
                  Search
                </button>
              </form>
            </div>

            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {gridProducts.map((product) => (
                <ProductCard key={product.id} product={product} deal />
              ))}
            </div>
          </>
        )}

        <section className="mt-14 rounded-2xl bg-zinc-900 px-6 py-8 text-center text-white sm:px-10">
          <h2 className="text-lg font-bold">Want more than deals?</h2>
          <p className="mt-2 text-sm text-zinc-400">
            Explore our full catalog — new arrivals across every category.
          </p>
          <Link
            href="/shop"
            className="mt-5 inline-block rounded-xl bg-brand-600 px-8 py-3 text-sm font-semibold hover:bg-brand-500"
          >
            Shop everything
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">
            {activeCategory ? activeCategory.label : "All products"}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            {filtered.length} product{filtered.length !== 1 ? "s" : ""}
          </p>
        </div>
        <form action="/shop" method="get" className="flex gap-2">
          <input
            type="search"
            name="q"
            defaultValue={query ?? ""}
            placeholder="Search products..."
            className="w-full rounded-lg border border-zinc-300 px-4 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 sm:w-72"
          />
          {category && <input type="hidden" name="category" value={category} />}
          <button
            type="submit"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Search
          </button>
        </form>
      </div>

      <p className="mt-4">
        <Link
          href="/shop?featured=1"
          className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-900 transition hover:bg-amber-200"
        >
          🔥 Today&apos;s Deals — limited-time savings
        </Link>
      </p>

      {filtered.length === 0 ? (
        <p className="mt-16 text-center text-zinc-500">No products found.</p>
      ) : (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
