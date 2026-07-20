"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { ProductImage } from "@/components/ProductImage";
import type { AdminProductDetail } from "@/lib/admin";
import { ADMIN_PRODUCTS } from "@/lib/admin-routes";
import { formatPrice } from "@/lib/products";

export function AdminProductDetailPage({ productId }: { productId: string }) {
  const [product, setProduct] = useState<AdminProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    fetch(`/api/admin/products/${encodeURIComponent(productId)}`, {
      credentials: "same-origin",
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Could not load product.");
          return;
        }
        setProduct(data.product);
        setActiveImage(0);
      })
      .catch(() => setError("Could not load product."))
      .finally(() => setLoading(false));
  }, [productId]);

  const inventoryBadgeClass =
    product?.inventoryStatus === "out_of_stock"
      ? "bg-red-100 text-red-800"
      : product?.inventoryStatus === "low_stock"
        ? "bg-amber-100 text-amber-800"
        : "bg-brand-100 text-brand-800";

  return (
    <AdminShell
      title={product?.name ?? "Product details"}
      description="Catalog record — media, inventory, shop, and sales performance."
    >
      <p className="mb-6">
        <Link
          href={ADMIN_PRODUCTS}
          className="text-sm font-medium text-brand-700 hover:underline"
        >
          ← Back to products
        </Link>
      </p>

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {loading || !product ? (
        !error && <div className="h-64 animate-pulse rounded-2xl bg-zinc-100" />
      ) : (
        <div className="space-y-8">
          <section className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold text-zinc-900">{product.name}</h2>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${inventoryBadgeClass}`}
                >
                  {product.inventoryStatusLabel}
                </span>
                {product.featured && (
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">
                    Featured deal
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm capitalize text-zinc-500">
                {product.category}
                {product.size ? ` · Size ${product.size}` : ""}
                {` · ${product.conditionLabel}`}
              </p>
              <p className="mt-1 font-mono text-xs text-zinc-400">{product.id}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-zinc-500">Price</p>
              <p className="text-2xl font-bold text-zinc-900">
                {formatPrice(product.price)}
              </p>
              <Link
                href={product.storefrontHref}
                className="mt-2 inline-block text-sm font-medium text-brand-700 hover:underline"
              >
                View on storefront →
              </Link>
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-3">
            <section className="space-y-4 lg:col-span-2">
              <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
                <div className="relative aspect-[4/3] bg-zinc-100">
                  <ProductImage
                    src={product.images[activeImage] ?? product.image}
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 66vw"
                    priority
                  />
                </div>
                {product.images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto border-t border-zinc-100 p-3">
                    {product.images.map((src, index) => (
                      <button
                        key={`${src}-${index}`}
                        type="button"
                        onClick={() => setActiveImage(index)}
                        className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border ${
                          index === activeImage
                            ? "border-brand-600 ring-2 ring-brand-600/30"
                            : "border-zinc-200"
                        }`}
                      >
                        <ProductImage
                          src={src}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="56px"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Description
                </h3>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-zinc-700">
                  {product.description}
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Sales performance
                </h3>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <Metric label="Units sold" value={String(product.sales.unitsSold)} />
                  <Metric
                    label="Revenue"
                    value={formatPrice(product.sales.revenue)}
                  />
                  <Metric
                    label="Order lines"
                    value={String(product.sales.orderLines)}
                  />
                  <Metric
                    label="Pending"
                    value={String(product.sales.unitsPending)}
                  />
                  <Metric
                    label="In transit"
                    value={String(product.sales.unitsInTransit)}
                  />
                  <Metric
                    label="Delivered"
                    value={String(product.sales.unitsDelivered)}
                  />
                </div>
                {product.sales.unitsCancelled > 0 && (
                  <p className="mt-3 text-xs text-zinc-500">
                    Cancelled units: {product.sales.unitsCancelled}
                  </p>
                )}
              </div>
            </section>

            <aside className="space-y-6">
              <InfoCard title="Inventory">
                <dl className="space-y-2 text-sm">
                  <Row label="Available" value={`${product.stock} units`} strong />
                  <Row label="Status" value={product.inventoryStatusLabel} />
                  <Row
                    label="Channel"
                    value={product.featured ? "Today's Deals + catalog" : "Catalog"}
                  />
                </dl>
              </InfoCard>

              <InfoCard title="Pricing & shipping">
                <dl className="space-y-2 text-sm">
                  <Row label="Price" value={formatPrice(product.price)} strong />
                  <Row label="Listing type" value={product.conditionLabel} />
                  <Row label="Shipping size" value={product.shippingTierLabel} />
                  <Row
                    label="Per-unit shipping fee"
                    value={
                      product.shippingTierFee > 0
                        ? formatPrice(product.shippingTierFee)
                        : "Included"
                    }
                  />
                </dl>
              </InfoCard>

              <InfoCard title="Shop">
                {product.shop ? (
                  <>
                    <p className="font-medium text-zinc-900">{product.shop.shopName}</p>
                    <p className="mt-1 text-sm capitalize text-zinc-600">
                      {product.shop.category}
                    </p>
                    <p className="mt-1 text-sm text-zinc-500">{product.shop.location}</p>
                    <div className="mt-3 border-t border-zinc-100 pt-3 text-sm">
                      <p className="font-medium text-zinc-800">
                        {product.shop.ownerName}
                      </p>
                      <p className="text-zinc-500">{product.shop.ownerPhone}</p>
                      {product.shop.ownerEmail && (
                        <p className="text-zinc-500">{product.shop.ownerEmail}</p>
                      )}
                      <p className="mt-2 text-xs text-zinc-400">
                        {product.shop.listings} listing
                        {product.shop.listings !== 1 ? "s" : ""} in shop
                      </p>
                    </div>
                  </>
                ) : product.seller ? (
                  <>
                    <p className="font-medium text-zinc-900">{product.seller.name}</p>
                    <p className="mt-1 text-sm text-zinc-500">{product.seller.phone}</p>
                    {product.seller.email && (
                      <p className="text-sm text-zinc-500">{product.seller.email}</p>
                    )}
                    <p className="mt-2 text-xs text-amber-700">
                      Seller profile incomplete — no shop record yet.
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-zinc-500">No seller assigned</p>
                )}
              </InfoCard>

              <InfoCard title="Reviews">
                <p className="text-2xl font-bold text-zinc-900">
                  {product.rating.toFixed(1)}
                  <span className="ml-1 text-base font-medium text-amber-500">★</span>
                </p>
                <p className="mt-1 text-sm text-zinc-500">
                  {product.reviewCount.toLocaleString()} reviews
                </p>
              </InfoCard>
            </aside>
          </div>
        </div>
      )}
    </AdminShell>
  );
}

function InfoCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
        {title}
      </h3>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-zinc-50 px-3 py-3">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 text-lg font-bold text-zinc-900">{value}</p>
    </div>
  );
}

function Row({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex justify-between gap-4">
      <dt className={strong ? "font-semibold text-zinc-900" : "text-zinc-500"}>
        {label}
      </dt>
      <dd
        className={
          strong ? "font-bold text-zinc-900" : "font-medium text-zinc-800"
        }
      >
        {value}
      </dd>
    </div>
  );
}
