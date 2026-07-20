import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductGallery } from "@/components/ProductGallery";
import { AddToCartButton } from "./AddToCartButton";
import { getProductConditionLabel } from "@/lib/product-condition";
import { formatPrice } from "@/lib/products";
import { getProductById } from "@/lib/products-server";
import { TODAYS_DEALS_HREF } from "@/lib/shop-routes";

export const revalidate = 60;

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) notFound();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <nav className="mb-6 text-sm text-zinc-500">
        <Link href={TODAYS_DEALS_HREF} className="hover:text-brand-600">
          Shop
        </Link>
        <span className="mx-2">/</span>
        <span className="text-zinc-900">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        <ProductGallery images={product.images} name={product.name} />

        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-brand-600">
            {product.category}
          </p>
          <h2 className="mt-2 text-3xl font-bold text-zinc-900">{product.name}</h2>
          <p className="mt-2 inline-flex rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-zinc-700">
            {getProductConditionLabel(product.condition)}
          </p>
          <div className="mt-3 flex items-center gap-2 text-sm text-zinc-600">
            <span className="text-amber-500">★ {product.rating}</span>
            <span>·</span>
            <span>{product.reviewCount.toLocaleString()} reviews</span>
          </div>
          <p className="mt-6 text-3xl font-bold text-zinc-900">
            {formatPrice(product.price)}
          </p>
          <p className="mt-4 leading-relaxed text-zinc-600">{product.description}</p>
          <p className="mt-4 text-sm text-zinc-500">
            {product.stock > 0 ? (
              <span className="text-brand-700">
                In stock ({product.stock} available)
              </span>
            ) : (
              <span className="text-red-600">Out of stock</span>
            )}
          </p>
          <div className="mt-8">
            <AddToCartButton product={product} />
          </div>
        </div>
      </div>
    </div>
  );
}
