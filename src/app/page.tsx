import Link from "next/link";
import { DealsPageHero } from "@/components/deals/DealsPageHero";
import { ProductCard } from "@/components/ProductCard";
import { shuffleDeals } from "@/lib/deals";
import { getDealsProducts } from "@/lib/products-server";
import { ALL_PRODUCTS_HREF } from "@/lib/shop-routes";

export const revalidate = 60;

export default async function HomePage() {
  const deals = shuffleDeals(await getDealsProducts());

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <DealsPageHero deals={deals} />

      {deals.length === 0 ? (
        <div className="mt-16 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-6 py-16 text-center">
          <p className="text-lg font-medium text-zinc-800">No deals found</p>
          <p className="mt-2 text-sm text-zinc-500">
            Try another category or check back tomorrow.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-10">
            <h2 className="text-xl font-bold text-zinc-900">All deals</h2>
            <p className="mt-1 text-sm text-zinc-500">
              {deals.length} product{deals.length !== 1 ? "s" : ""} · randomly
              sorted
            </p>
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {deals.map((product) => (
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
          href={ALL_PRODUCTS_HREF}
          className="mt-5 inline-block rounded-xl bg-brand-600 px-8 py-3 text-sm font-semibold hover:bg-brand-500"
        >
          Shop everything
        </Link>
      </section>
    </div>
  );
}
