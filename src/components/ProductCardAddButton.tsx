"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { listItemToCartProduct } from "@/lib/product-mapper";
import { productNeedsSizeSelection } from "@/lib/products";
import type { ProductListItem } from "@/lib/types";

export function ProductCardAddButton({ product }: { product: ProductListItem }) {
  const { addItem } = useCart();

  if (productNeedsSizeSelection(product)) {
    return (
      <Link
        href={`/product/${product.id}`}
        className="ml-auto rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-brand-700"
      >
        Choose size
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => addItem(listItemToCartProduct(product))}
      className="ml-auto rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-brand-700"
    >
      Add
    </button>
  );
}
