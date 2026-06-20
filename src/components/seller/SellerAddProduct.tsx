"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  emptyProductForm,
  SellerProductForm,
} from "@/components/seller/SellerProductForm";
import { MAX_PRODUCT_IMAGES } from "@/lib/product-image";
import { createSellerProduct } from "@/lib/seller-products-client";
import { SELLER_HOME, sellerViewPath } from "@/lib/seller-routes";

export function SellerAddProduct() {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <nav className="text-sm text-zinc-500">
        <Link href={SELLER_HOME} className="hover:text-brand-600">
          Seller
        </Link>
        <span className="mx-2">/</span>
        <span className="text-zinc-800">Add product</span>
      </nav>

      <h2 className="mt-4 text-2xl font-bold text-zinc-900">Add a product</h2>
      <p className="mt-1 text-sm text-zinc-500">
        Add up to {MAX_PRODUCT_IMAGES} images — upload files or paste URLs.
      </p>

      <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <SellerProductForm
          formId="add-product"
          initial={emptyProductForm()}
          submitLabel="List product"
          onCancel={() => router.push(SELLER_HOME)}
          onSubmit={async (form) => {
            const result = await createSellerProduct(form);
            if (!result.ok) return result;
            router.push(sellerViewPath(result.product.id));
            return { ok: true };
          }}
        />
      </div>
    </div>
  );
}
