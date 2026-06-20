"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ProductGallery } from "@/components/ProductGallery";
import { getDepartmentBySlug } from "@/lib/departments";
import { formatPrice } from "@/lib/products";
import { fetchSellerProduct } from "@/lib/seller-products-client";
import {
  SELLER_HOME,
  sellerEditPath,
} from "@/lib/seller-routes";
import type { Product } from "@/lib/types";

export function SellerViewProduct({ productId }: { productId: string }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetchSellerProduct(productId).then((result) => {
      if (cancelled) return;
      if (!result.ok) {
        setError(result.error);
        setLoading(false);
        return;
      }
      setProduct(result.product);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [productId]);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-zinc-200" />
        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <div className="aspect-square animate-pulse rounded-2xl bg-zinc-100" />
          <div className="space-y-4">
            <div className="h-8 w-3/4 animate-pulse rounded bg-zinc-100" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-zinc-100" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error || "Product not found."}
        </p>
        <Link
          href={SELLER_HOME}
          className="mt-4 inline-block text-sm font-medium text-brand-600 hover:text-brand-700"
        >
          ← Back to listings
        </Link>
      </div>
    );
  }

  const departmentLabel =
    getDepartmentBySlug(product.category)?.label ?? product.category;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <nav className="text-sm text-zinc-500">
        <Link href={SELLER_HOME} className="hover:text-brand-600">
          Seller
        </Link>
        <span className="mx-2">/</span>
        <span className="text-zinc-800">{product.name}</span>
      </nav>

      <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900">{product.name}</h2>
          <p className="mt-1 text-sm text-zinc-500">Listing preview</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={sellerEditPath(product.id)}
            className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            Edit
          </Link>
          <Link
            href={`/product/${product.id}`}
            className="rounded-xl border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
          >
            View in shop
          </Link>
        </div>
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-2">
        <ProductGallery images={product.images} name={product.name} />

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <dl className="space-y-4 text-sm">
            <div>
              <dt className="font-medium text-zinc-500">Price</dt>
              <dd className="mt-1 text-2xl font-bold text-zinc-900">
                {formatPrice(product.price)}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-500">Stock</dt>
              <dd className="mt-1 text-zinc-900">
                {product.stock > 0 ? `${product.stock} available` : "Out of stock"}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-500">Department</dt>
              <dd className="mt-1 text-zinc-900">{departmentLabel}</dd>
            </div>
            {product.size && (
              <div>
                <dt className="font-medium text-zinc-500">Size</dt>
                <dd className="mt-1 text-zinc-900">{product.size}</dd>
              </div>
            )}
            <div>
              <dt className="font-medium text-zinc-500">Featured deal</dt>
              <dd className="mt-1 text-zinc-900">
                {product.featured ? "Yes" : "No"}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-500">Rating</dt>
              <dd className="mt-1 text-zinc-900">
                ★ {product.rating} ({product.reviewCount.toLocaleString()} reviews)
              </dd>
            </div>
          </dl>

          <div className="mt-6 border-t border-zinc-100 pt-6">
            <h3 className="text-sm font-medium text-zinc-500">Description</h3>
            <p className="mt-2 leading-relaxed text-zinc-700">{product.description}</p>
          </div>
        </div>
      </div>

      <p className="mt-8">
        <Link
          href={SELLER_HOME}
          className="text-sm font-medium text-brand-600 hover:text-brand-700"
        >
          ← Back to listings
        </Link>
      </p>
    </div>
  );
}
