import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import { HomeHero } from "@/components/home/HomeHero";
import { getBestProduct } from "@/lib/best-product";
import {
  FREE_SHIPPING_THRESHOLD,
  formatPrice,
} from "@/lib/products";
import { getFeaturedProducts } from "@/lib/products-server";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [featured, bestProduct] = await Promise.all([
    getFeaturedProducts(),
    getBestProduct(),
  ]);

  return (
    <>
      <HomeHero bestProduct={bestProduct} />

      <section className="bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-zinc-900">Top Picks</h2>
              <p className="mt-1 text-sm text-zinc-500">
                Top-rated products our customers love
              </p>
            </div>
            <Link
              href="/shop?featured=1"
              className="text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              View all deals →
            </Link>
          </div>
          {featured.length === 0 ? (
            <p className="mt-8 text-zinc-500">
              No products yet. Run{" "}
              <code className="rounded bg-zinc-100 px-1">
                bun run db:up && bun run db:setup
              </code>
              .
            </p>
          ) : (
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {featured.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid gap-6 rounded-2xl bg-zinc-900 p-8 text-white sm:grid-cols-3 sm:p-10">
          {[
            {
              title: "Free shipping",
              desc: `On orders over ${formatPrice(FREE_SHIPPING_THRESHOLD)}`,
            },
            { title: "Easy returns", desc: "5-day hassle-free policy" },
            { title: "Secure checkout", desc: "Encrypted payment processing" },
          ].map((item) => (
            <div key={item.title} className="text-center sm:text-left">
              <h3 className="font-semibold">{item.title}</h3>
              <p className="mt-1 text-sm text-zinc-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
