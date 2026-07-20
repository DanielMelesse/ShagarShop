import Link from "next/link";
import { redirect } from "next/navigation";
import { DealsPageHero } from "@/components/deals/DealsPageHero";
import { ProductCard } from "@/components/ProductCard";
import { ShopPagination } from "@/components/shop/ShopPagination";
import { shuffleDeals } from "@/lib/deals";
import { getDepartmentBySlug } from "@/lib/departments";
import { categories } from "@/lib/products";
import { isCategory } from "@/lib/product-mapper";
import { filterProducts, SHOP_PAGE_SIZE } from "@/lib/products-server";
import { ALL_PRODUCTS_HREF, TODAYS_DEALS_HREF } from "@/lib/shop-routes";
import type { Category } from "@/lib/types";

export const revalidate = 60;

interface ShopPageProps {
  searchParams: Promise<{
    category?: string;
    department?: string;
    featured?: string;
    all?: string;
    q?: string;
    page?: string;
  }>;
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const params = await searchParams;
  const categoryParam = params.category;
  const departmentParam = params.department;
  const query = params.q?.trim();
  const featuredOnly = params.featured === "1";
  const showAllCatalog = params.all === "1";
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);

  if (!featuredOnly && !showAllCatalog && !categoryParam && !departmentParam && !query) {
    redirect(TODAYS_DEALS_HREF);
  }

  const category =
    categoryParam && isCategory(categoryParam)
      ? (categoryParam as Category)
      : departmentParam
        ? getDepartmentBySlug(departmentParam)?.productCategory
        : undefined;

  const activeCategory = categories.find((c) => c.id === category);

  if (featuredOnly) {
    const result = await filterProducts({
      category,
      featured: true,
      query: query || undefined,
      page: 1,
      pageSize: 48,
    });
    const deals = shuffleDeals(result.products);

    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <DealsPageHero
          deals={deals}
          activeCategoryLabel={activeCategory?.label}
        />

        {deals.length === 0 ? (
          <div className="mt-16 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-6 py-16 text-center">
            <p className="text-lg font-medium text-zinc-800">No deals found</p>
            <p className="mt-2 text-sm text-zinc-500">
              Try another category or check back tomorrow.
            </p>
            <Link
              href={TODAYS_DEALS_HREF}
              className="mt-6 inline-block rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700"
            >
              View all deals
            </Link>
          </div>
        ) : (
          <>
            <div className="mt-10">
              <h2 className="text-xl font-bold text-zinc-900">All deals</h2>
              <p className="mt-1 text-sm text-zinc-500">
                {deals.length} product
                {deals.length !== 1 ? "s" : ""} · randomly sorted
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

  const { products, total, pageSize } = await filterProducts({
    category,
    query: query || undefined,
    page,
    pageSize: SHOP_PAGE_SIZE,
  });

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <p>
        <Link
          href={TODAYS_DEALS_HREF}
          className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-900 transition hover:bg-amber-200"
        >
          Today&apos;s Deals — limited-time savings
        </Link>
      </p>

      {products.length === 0 ? (
        <p className="mt-16 text-center text-zinc-500">No products found.</p>
      ) : (
        <>
          <p className="mt-6 text-sm text-zinc-500">
            Showing {(page - 1) * pageSize + 1}–
            {Math.min(page * pageSize, total)} of {total}
          </p>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <ShopPagination
            page={page}
            totalPages={totalPages}
            searchParams={{
              ...(categoryParam ? { category: categoryParam } : {}),
              ...(departmentParam ? { department: departmentParam } : {}),
              ...(showAllCatalog ? { all: "1" } : {}),
              ...(query ? { q: query } : {}),
            }}
          />
        </>
      )}
    </div>
  );
}
