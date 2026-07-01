"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { SellerPageHeader } from "@/components/seller/SellerPageHeader";
import { getDepartmentBySlug } from "@/lib/departments";
import { formatPrice } from "@/lib/products";
import {
  deleteSellerProduct,
  fetchSellerProducts,
} from "@/lib/seller-products-client";
import { SELLER_ADD, sellerEditPath, sellerViewPath } from "@/lib/seller-routes";
import type { Product } from "@/lib/types";

export function SellerListings() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const loadProducts = useCallback(async () => {
    const productsResult = await fetchSellerProducts();

    if (!productsResult.ok) {
      setMessage(productsResult.error);
      setLoading(false);
      return;
    }

    setProducts(productsResult.products);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  async function handleDelete(product: Product) {
    if (
      !window.confirm(
        `Delete "${product.name}"? This cannot be undone if the product has no orders.`,
      )
    ) {
      return;
    }

    const result = await deleteSellerProduct(product.id);
    if (!result.ok) {
      setMessage(result.error);
      return;
    }

    setProducts((prev) => prev.filter((p) => p.id !== product.id));
    setMessage("Product deleted.");
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <SellerPageHeader
        title="Listings"
        description="Add, edit, and remove products in your shop."
      />

      {message && (
        <p className="mt-6 rounded-lg bg-brand-50 px-4 py-3 text-sm text-brand-800">
          {message}
        </p>
      )}

      <section className="mt-10">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-zinc-900">
            Your products ({products.length})
          </h2>
          <Link
            href={SELLER_ADD}
            className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Add product
          </Link>
        </div>

        {loading ? (
          <div className="mt-6 h-32 animate-pulse rounded-2xl bg-zinc-200" />
        ) : products.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center">
            <p className="text-zinc-500">No products yet.</p>
            <Link
              href={SELLER_ADD}
              className="mt-4 inline-block text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              Add your first product →
            </Link>
          </div>
        ) : (
          <ul className="mt-6 space-y-4">
            {products.map((product) => (
              <li
                key={product.id}
                className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={sellerViewPath(product.id)}
                        className="font-semibold text-zinc-900 hover:text-brand-700"
                      >
                        {product.name}
                      </Link>
                      {product.featured && (
                        <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-700">
                          Featured
                        </span>
                      )}
                      {product.stock === 0 && (
                        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
                          Out of stock
                        </span>
                      )}
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-zinc-600">
                      {product.description}
                    </p>
                    <p className="mt-2 text-sm text-zinc-500">
                      {formatPrice(product.price)} · {product.stock} in stock ·{" "}
                      {getDepartmentBySlug(product.category)?.label ?? product.category}
                      {product.size ? ` · Size ${product.size}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Link
                      href={sellerViewPath(product.id)}
                      className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
                    >
                      View
                    </Link>
                    <Link
                      href={sellerEditPath(product.id)}
                      className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => void handleDelete(product)}
                      className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
