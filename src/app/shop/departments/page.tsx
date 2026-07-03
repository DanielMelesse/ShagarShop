import Link from "next/link";
import { DepartmentGrid } from "@/components/shop/DepartmentGrid";
import { ProductSection } from "@/components/shop/ProductSection";
import { ALL_DEPARTMENTS_HREF, ALL_DEPARTMENTS_LABEL } from "@/lib/departments";
import { getAllDepartmentsCatalog } from "@/lib/products-server";
import { ALL_PRODUCTS_HREF, TODAYS_DEALS_HREF } from "@/lib/shop-routes";

export const dynamic = "force-dynamic";

export const metadata = {
  title: `${ALL_DEPARTMENTS_LABEL} — ShegerShop`,
  description: "Browse best deals, hot items, and bestsellers across every department.",
};

export default async function AllDepartmentsPage() {
  const { bestDeals, hotItems, bestSellers } = await getAllDepartmentsCatalog();
  const hasProducts = bestDeals.length + hotItems.length + bestSellers.length > 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 px-6 py-10 text-white sm:px-10">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-100">
          Marketplace
        </p>
        <h2 className="mt-2 text-3xl font-bold">{ALL_DEPARTMENTS_LABEL}</h2>
        <p className="mt-3 max-w-2xl text-sm text-brand-100 sm:text-base">
          Discover top picks across every category — best deals, trending hot
          items, and customer favorites.
        </p>
      </div>

      {!hasProducts ? (
        <div className="mt-16 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-6 py-16 text-center">
          <p className="text-lg font-medium text-zinc-800">No products yet</p>
          <p className="mt-2 text-sm text-zinc-500">
            Run{" "}
            <code className="rounded bg-zinc-100 px-1">
              bun run db:up && bun run db:setup
            </code>{" "}
            to seed the catalog.
          </p>
        </div>
      ) : (
        <>
          <ProductSection
            title="Best deals"
            subtitle="Featured offers with the biggest savings right now."
            products={bestDeals}
            viewAllHref={TODAYS_DEALS_HREF}
            viewAllLabel="Today's Deals"
            deal
          />

          <ProductSection
            title="Hot items"
            subtitle="Trending picks — high ratings, limited stock, and featured listings."
            products={hotItems}
            viewAllHref={ALL_DEPARTMENTS_HREF}
          />

          <ProductSection
            title="Best sellers"
            subtitle="Most-loved products by review count across all departments."
            products={bestSellers}
            viewAllHref={ALL_PRODUCTS_HREF}
            viewAllLabel="Shop all"
          />
        </>
      )}

      <DepartmentGrid />

      <div className="mt-10 text-center">
        <Link
          href={TODAYS_DEALS_HREF}
          className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-5 py-2.5 text-sm font-semibold text-amber-900 transition hover:bg-amber-200"
        >
          🔥 Today&apos;s Deals — limited-time savings
        </Link>
      </div>
    </div>
  );
}
