"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  productToFormState,
  SellerProductForm,
} from "@/components/seller/SellerProductForm";
import {
  fetchSellerProduct,
  updateSellerProduct,
} from "@/lib/seller-products-client";
import { SELLER_HOME, sellerViewPath } from "@/lib/seller-routes";
import type { Product } from "@/lib/types";

export function SellerEditProduct({ productId }: { productId: string }) {
  const router = useRouter();
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
        <div className="mt-8 h-64 animate-pulse rounded-2xl bg-zinc-100" />
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

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <nav className="text-sm text-zinc-500">
        <Link href={SELLER_HOME} className="hover:text-brand-600">
          Seller
        </Link>
        <span className="mx-2">/</span>
        <Link href={sellerViewPath(product.id)} className="hover:text-brand-600">
          {product.name}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-zinc-800">Edit</span>
      </nav>

      <h2 className="mt-4 text-2xl font-bold text-zinc-900">Edit listing</h2>
      <p className="mt-1 text-sm text-zinc-500">Update details for {product.name}.</p>

      <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <SellerProductForm
          formId={`edit-${product.id}`}
          initial={productToFormState(product)}
          submitLabel="Save changes"
          onCancel={() => router.push(sellerViewPath(product.id))}
          onSubmit={async (form) => {
            const result = await updateSellerProduct(product.id, form);
            if (!result.ok) return result;
            router.push(sellerViewPath(product.id));
            return { ok: true };
          }}
        />
      </div>
    </div>
  );
}
