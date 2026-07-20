"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminTable, EmptyState, Td, Th } from "@/components/admin/AdminTable";
import type { AdminSellerDetail } from "@/lib/admin";
import {
  ADMIN_SELLERS,
  adminCustomerHref,
  adminProductHref,
} from "@/lib/admin-routes";
import { formatPrice } from "@/lib/products";

export function AdminSellerDetailPage({ sellerId }: { sellerId: string }) {
  const [seller, setSeller] = useState<AdminSellerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/admin/sellers/${sellerId}`, { credentials: "same-origin" })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Could not load seller.");
          return;
        }
        setSeller(data.seller);
      })
      .catch(() => setError("Could not load seller."))
      .finally(() => setLoading(false));
  }, [sellerId]);

  return (
    <AdminShell
      title={seller?.shopName ?? "Seller details"}
      description="Shop profile, inventory, and catalog performance."
    >
      <p className="mb-6">
        <Link
          href={ADMIN_SELLERS}
          className="text-sm font-medium text-brand-700 hover:underline"
        >
          ← Back to sellers
        </Link>
      </p>

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {loading || !seller ? (
        !error && <div className="h-64 animate-pulse rounded-2xl bg-zinc-100" />
      ) : (
        <div className="space-y-8">
          <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-zinc-900">{seller.shopName}</h2>
                <p className="mt-1 text-sm capitalize text-zinc-500">
                  {seller.category} · {seller.location}
                </p>
                <p className="mt-2 text-xs text-zinc-400">
                  Joined{" "}
                  {new Date(seller.completedAt).toLocaleDateString(undefined, {
                    dateStyle: "medium",
                  })}
                </p>
              </div>
              <div className="text-sm text-zinc-600">
                <p className="font-medium text-zinc-900">{seller.owner.name}</p>
                <p>{seller.owner.phone}</p>
                {seller.owner.email && <p>{seller.owner.email}</p>}
                <Link
                  href={adminCustomerHref(seller.owner.id)}
                  className="mt-2 inline-block text-sm font-medium text-brand-700 hover:underline"
                >
                  View owner account →
                </Link>
              </div>
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Metric label="Listings" value={String(seller.stats.listings)} />
            <Metric label="Units in stock" value={String(seller.stats.unitsInStock)} />
            <Metric label="Units sold" value={String(seller.stats.unitsSold)} />
            <Metric label="Revenue" value={formatPrice(seller.stats.revenue)} />
            <Metric label="Featured" value={String(seller.stats.featured)} />
            <Metric label="Low stock" value={String(seller.stats.lowStock)} />
            <Metric
              label="Pending fulfillment"
              value={String(seller.stats.pendingOrders)}
            />
            {seller.licenseUrl && (
              <a
                href={seller.licenseUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-brand-300"
              >
                <p className="text-sm text-zinc-500">Business license</p>
                <p className="mt-2 text-sm font-semibold text-brand-700">Open file →</p>
              </a>
            )}
          </section>

          <section>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Catalog
            </h3>
            {seller.products.length === 0 ? (
              <div className="mt-4">
                <EmptyState message="No products listed yet." />
              </div>
            ) : (
              <div className="mt-4">
                <AdminTable>
                  <thead>
                    <tr>
                      <Th>Product</Th>
                      <Th>Stock</Th>
                      <Th>Featured</Th>
                      <Th className="text-right">Price</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {seller.products.map((product) => (
                      <tr
                        key={product.id}
                        className="border-t border-zinc-100 transition hover:bg-zinc-50"
                      >
                        <Td>
                          <Link
                            href={adminProductHref(product.id)}
                            className="font-medium text-brand-700 hover:underline"
                          >
                            {product.name}
                          </Link>
                        </Td>
                        <Td
                          className={
                            product.stock <= 5 ? "font-semibold text-amber-700" : ""
                          }
                        >
                          {product.stock}
                        </Td>
                        <Td>{product.featured ? "Yes" : "No"}</Td>
                        <Td className="text-right font-semibold">
                          {formatPrice(product.price)}
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </AdminTable>
              </div>
            )}
          </section>
        </div>
      )}
    </AdminShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-zinc-900">{value}</p>
    </div>
  );
}
