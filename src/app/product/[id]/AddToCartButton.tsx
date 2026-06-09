"use client";

import { useMemo, useState } from "react";
import { useCart } from "@/context/CartContext";
import {
  getCustomerSizeOptions,
  productNeedsSizeSelection,
} from "@/lib/products";
import type { Product } from "@/lib/types";

const selectClass =
  "mt-2 w-full max-w-xs rounded-lg border border-zinc-300 px-4 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 sm:w-auto";

export function AddToCartButton({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const [error, setError] = useState("");

  const sizeOptions = useMemo(
    () => getCustomerSizeOptions(product),
    [product],
  );
  const needsSize = productNeedsSizeSelection(product);
  const [selectedSize, setSelectedSize] = useState(
    sizeOptions.length === 1 ? sizeOptions[0] : "",
  );

  if (product.stock <= 0) {
    return (
      <button
        type="button"
        disabled
        className="w-full rounded-xl bg-zinc-200 px-6 py-3 text-sm font-semibold text-zinc-500 sm:w-auto"
      >
        Out of stock
      </button>
    );
  }

  function handleAdd() {
    if (needsSize && !selectedSize) {
      setError("Please select a size.");
      return;
    }
    setError("");
    addItem(product, { selectedSize: selectedSize || undefined });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div className="space-y-4">
      {needsSize && (
        <div>
          <label htmlFor="product-size" className="text-sm font-medium text-zinc-700">
            Size
          </label>
          <select
            id="product-size"
            value={selectedSize}
            onChange={(e) => {
              setSelectedSize(e.target.value);
              setError("");
            }}
            className={selectClass}
          >
            <option value="">Select size</option>
            {sizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="button"
        onClick={handleAdd}
        className="w-full rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 sm:w-auto"
      >
        {added ? "Added to cart ✓" : "Add to cart"}
      </button>
    </div>
  );
}
