"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminTable, EmptyState, Td, Th } from "@/components/admin/AdminTable";
import type { AdminProductRow } from "@/lib/admin";
import { adminProductHref } from "@/lib/admin-routes";
import { formatPrice } from "@/lib/products";

export function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/products", { credentials: "same-origin" })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Could not load products.");
          return;
        }
        setProducts(data.products ?? []);
      })
      .catch(() => setError("Could not load products."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminShell
      title="Products"
      description="Full catalog across all sellers — click a product for inventory, shop, and sales details."
    >
      {error && (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}
      {loading ? (
        <div className="h-48 animate-pulse rounded-2xl bg-zinc-100" />
      ) : products.length === 0 ? (
        <EmptyState message="No products in the catalog." />
      ) : (
        <AdminTable>
          <thead>
            <tr>
              <Th>Product</Th>
              <Th>Category</Th>
              <Th>Seller</Th>
              <Th>Stock</Th>
              <Th>Featured</Th>
              <Th className="text-right">Price</Th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr
                key={product.id}
                className="border-t border-zinc-100 transition hover:bg-zinc-50"
              >
                <Td className="font-medium text-zinc-900">
                  <Link
                    href={adminProductHref(product.id)}
                    className="text-brand-700 hover:underline"
                  >
                    {product.name}
                  </Link>
                </Td>
                <Td>
                  <Link
                    href={adminProductHref(product.id)}
                    className="block capitalize"
                  >
                    {product.category}
                  </Link>
                </Td>
                <Td>
                  <Link href={adminProductHref(product.id)} className="block">
                    {product.shopName ?? product.sellerName ?? "—"}
                    {product.shopName && product.sellerName && (
                      <div className="text-xs text-zinc-400">
                        {product.sellerName}
                      </div>
                    )}
                  </Link>
                </Td>
                <Td
                  className={
                    product.stock <= 5 ? "font-semibold text-amber-700" : ""
                  }
                >
                  <Link href={adminProductHref(product.id)} className="block">
                    {product.stock}
                  </Link>
                </Td>
                <Td>
                  <Link href={adminProductHref(product.id)} className="block">
                    {product.featured ? "Yes" : "No"}
                  </Link>
                </Td>
                <Td className="text-right font-semibold text-zinc-900">
                  <Link href={adminProductHref(product.id)} className="block">
                    {formatPrice(product.price)}
                  </Link>
                </Td>
              </tr>
            ))}
          </tbody>
        </AdminTable>
      )}
    </AdminShell>
  );
}
